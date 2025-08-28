import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  Restaurant as RecipeIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intermediateProductsApi, categoriesApi, storageLocationsApi } from '../services/realApi';
import { IntermediateProduct, CategoryType, IntermediateProductStatus } from '../types';
import { formatDate, formatQuantity, isExpired, isExpiringSoon, getDaysUntilExpiration } from '../utils/api';

const IntermediateProducts: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openForm, setOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IntermediateProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const queryClient = useQueryClient();

  // Fetch data
  const { data: products } = useQuery(['intermediateProducts'], intermediateProductsApi.getAll);
  const { data: categoriesResponse } = useQuery(['categories'], () => categoriesApi.getAll());
  const { data: storageLocationsResponse } = useQuery(['storageLocations'], storageLocationsApi.getAll);
  
  const categories = categoriesResponse?.data?.filter(c => c.type === CategoryType.INTERMEDIATE);
  const storageLocations = storageLocationsResponse?.data;

  // Mutations
  const createMutation = useMutation(intermediateProductsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['intermediateProducts']);
      handleCloseForm();
      showSnackbar('Intermediate product created successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error creating intermediate product', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IntermediateProduct> }) => 
      intermediateProductsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['intermediateProducts']);
      handleCloseForm();
      showSnackbar('Intermediate product updated successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error updating intermediate product', 'error');
    },
  });

  const deleteMutation = useMutation(intermediateProductsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries(['intermediateProducts']);
      showSnackbar('Intermediate product deleted successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error deleting intermediate product', 'error');
    },
  });

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingProduct(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Filter and sort products
  const filteredProducts = products?.data?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.categoryId === categoryFilter;
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const displayedProducts = filteredProducts
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formValues: Record<string, any> = {};
    formData.forEach((value, key) => {
      formValues[key] = value;
    });

    if (editingProduct) {
      // For updates, only include changed fields
      const updatedData: Partial<IntermediateProduct> = {};
      
      if (formValues.name !== editingProduct.name) updatedData.name = formValues.name as string;
      if (formValues.description !== editingProduct.description) updatedData.description = formValues.description as string;
      if (formValues.categoryId !== editingProduct.categoryId) updatedData.categoryId = formValues.categoryId as string;
      if (formValues.storageLocationId !== editingProduct.storageLocationId) updatedData.storageLocationId = formValues.storageLocationId as string;
      if (formValues.batchNumber !== editingProduct.batchNumber) updatedData.batchNumber = formValues.batchNumber as string;
      if (formValues.productionDate !== editingProduct.productionDate?.split('T')[0]) updatedData.productionDate = formValues.productionDate as string;
      if (formValues.expirationDate !== editingProduct.expirationDate?.split('T')[0]) updatedData.expirationDate = formValues.expirationDate as string;
      if (parseFloat(formValues.quantity) !== editingProduct.quantity) updatedData.quantity = parseFloat(formValues.quantity);
      if (formValues.unit !== editingProduct.unit) updatedData.unit = formValues.unit as string;
      if (formValues.status !== editingProduct.status) updatedData.status = formValues.status as IntermediateProductStatus;

      // Preserve existing values for fields not in the form
      updatedData.contaminated = editingProduct.contaminated;
      updatedData.qualityStatus = editingProduct.qualityStatus;
      
      updateMutation.mutate({ id: editingProduct.id, data: updatedData });
    } else {
      // For new products, include all required fields
      const newProductData = {
        name: formValues.name as string,
        description: formValues.description as string,
        categoryId: formValues.categoryId as string,
        storageLocationId: formValues.storageLocationId as string,
        recipeId: formValues.recipeId as string || undefined,
        batchNumber: formValues.batchNumber as string,
        productionDate: formValues.productionDate as string,
        expirationDate: formValues.expirationDate as string,
        quantity: parseFloat(formValues.quantity as string),
        unit: formValues.unit as string,
        contaminated: false,
        qualityStatusId: undefined, // Use qualityStatusId instead of qualityStatus enum
        status: formValues.status as IntermediateProductStatus,
      };

      createMutation.mutate(newProductData);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Intermediate Products
        </Typography>

        {/* Filters and Actions */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                variant="outlined"
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Filter by Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories?.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value={IntermediateProductStatus.IN_PRODUCTION}>In Production</MenuItem>
                  <MenuItem value={IntermediateProductStatus.COMPLETED}>Completed</MenuItem>
                  <MenuItem value={IntermediateProductStatus.ON_HOLD}>On Hold</MenuItem>
                  <MenuItem value={IntermediateProductStatus.DISCARDED}>Discarded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenForm(true)}
              >
                Add Product
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Products Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Batch Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Production Date</TableCell>
                <TableCell>Expiration Date</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Storage Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category?.name || 'N/A'}</TableCell>
                  <TableCell>{product.batchNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={product.status.replace('_', ' ')}
                      color={
                        product.status === IntermediateProductStatus.COMPLETED ? 'success' :
                        product.status === IntermediateProductStatus.IN_PRODUCTION ? 'primary' :
                        product.status === IntermediateProductStatus.ON_HOLD ? 'warning' :
                        'error'
                      }
                    />
                  </TableCell>
                  <TableCell>{formatDate(product.productionDate)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {formatDate(product.expirationDate)}
                      {isExpired(product.expirationDate) && (
                        <Tooltip title="Expired">
                          <WarningIcon color="error" sx={{ ml: 1 }} />
                        </Tooltip>
                      )}
                      {isExpiringSoon(product.expirationDate) && !isExpired(product.expirationDate) && (
                        <Tooltip title={`Expires in ${getDaysUntilExpiration(product.expirationDate)} days`}>
                          <WarningIcon color="warning" sx={{ ml: 1 }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{formatQuantity(product.quantity, product.unit)}</TableCell>
                  <TableCell>{product.storageLocation?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingProduct(product);
                        setOpenForm(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this product?')) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      </Box>

      {/* Form Dialog */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmitForm}>
          <DialogTitle>
            {editingProduct ? 'Edit' : 'Add'} Intermediate Product
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Product Name"
                    name="name"
                    defaultValue={editingProduct?.name || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Batch Number"
                    name="batchNumber"
                    defaultValue={editingProduct?.batchNumber || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    name="description"
                    defaultValue={editingProduct?.description || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="categoryId"
                      defaultValue={editingProduct?.categoryId || ''}
                      label="Category"
                    >
                      {categories?.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Storage Location</InputLabel>
                    <Select
                      name="storageLocationId"
                      defaultValue={editingProduct?.storageLocationId || ''}
                      label="Storage Location"
                    >
                      {storageLocations?.map((location) => (
                        <MenuItem key={location.id} value={location.id}>
                          {location.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Production Date"
                    name="productionDate"
                    defaultValue={editingProduct?.productionDate?.split('T')[0] || ''}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Expiration Date"
                    name="expirationDate"
                    defaultValue={editingProduct?.expirationDate?.split('T')[0] || ''}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Quantity"
                    name="quantity"
                    defaultValue={editingProduct?.quantity || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Unit"
                    name="unit"
                    defaultValue={editingProduct?.unit || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      defaultValue={editingProduct?.status || IntermediateProductStatus.IN_PRODUCTION}
                      label="Status"
                    >
                      <MenuItem value={IntermediateProductStatus.IN_PRODUCTION}>In Production</MenuItem>
                      <MenuItem value={IntermediateProductStatus.COMPLETED}>Completed</MenuItem>
                      <MenuItem value={IntermediateProductStatus.ON_HOLD}>On Hold</MenuItem>
                      <MenuItem value={IntermediateProductStatus.DISCARDED}>Discarded</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button
              variant="contained"
              type="submit"
            >
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default IntermediateProducts;
