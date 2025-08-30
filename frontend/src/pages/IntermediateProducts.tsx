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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intermediateProductsApi, categoriesApi, storageLocationsApi, unitsApi, qualityStatusApi } from '../services/realApi';
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

  // Helper functions for status chips (matching RawMaterials format)
  const getContaminationChip = (contaminated: boolean) => {
    if (contaminated) {
      return <Chip label="CONTAMINATED" color="error" size="small" sx={{ ml: 1 }} />;
    }
    return null; // Don't show anything if clean
  };

  const getExpirationChip = (expirationDate: string) => {
    if (isExpired(expirationDate)) {
      return <Chip label="EXPIRED" color="error" size="small" />;
    }
    if (isExpiringSoon(expirationDate)) {
      const days = getDaysUntilExpiration(expirationDate);
      return <Chip label={`Expires in ${days} days`} color="warning" size="small" />;
    }
    const days = getDaysUntilExpiration(expirationDate);
    return <Chip label={`${days} days left`} color="success" size="small" />;
  };

  // Fetch data
  const { data: products } = useQuery(['intermediateProducts'], intermediateProductsApi.getAll);
  const { data: categoriesResponse } = useQuery(['categories'], () => categoriesApi.getAll());
  const { data: storageLocationsResponse } = useQuery(['storageLocations'], storageLocationsApi.getAll);
  const { data: unitsResponse } = useQuery(['units'], unitsApi.getAll);
  const { data: qualityStatusResponse } = useQuery(['qualityStatuses'], qualityStatusApi.getAll);

  const categories = categoriesResponse?.data?.filter(c => c.type === CategoryType.INTERMEDIATE);
  const storageLocations = storageLocationsResponse?.data;
  const units = unitsResponse?.data;
  const qualityStatuses = (qualityStatusResponse?.data as any[]) || [];

  // Get default quality status (first in list)
  const getDefaultQualityStatusId = () => {
    return qualityStatuses.length > 0 ? qualityStatuses[0].id : '';
  };

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
      if (formValues.qualityStatusId !== editingProduct.qualityStatusId) updatedData.qualityStatusId = formValues.qualityStatusId as string;

      // Handle contamination status (checkbox)
      // Checkbox value is a boolean when controlled, or 'on' when uncontrolled
      updatedData.contaminated = typeof formValues.contaminated === 'boolean'
        ? formValues.contaminated
        : formValues.contaminated === 'on';

      // Note: qualityStatus is now managed separately via qualityStatusId

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
        status: formValues.status as IntermediateProductStatus,
      };

      createMutation.mutate(newProductData);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Intermediate Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Add Product
        </Button>
      </Box>

      {/* Filters */}
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
              <TableCell>Quality</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {product.name}
                    {getContaminationChip(product.contaminated)}
                  </Box>
                </TableCell>
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
                  <Box>
                    <Typography variant="body2">
                      {formatDate(product.expirationDate)}
                    </Typography>
                    {getExpirationChip(product.expirationDate)}
                  </Box>
                </TableCell>
                <TableCell>{formatQuantity(product.quantity, product.unit)}</TableCell>
                <TableCell>
                  {product.storageLocation?.name || 'N/A'}
                </TableCell>
                <TableCell>
                  {product.qualityStatus ? (
                    <Chip
                      label={product.qualityStatus.name}
                      size="small"
                      sx={{
                        backgroundColor: product.qualityStatus.color || '#gray',
                        color: 'white',
                      }}
                    />
                  ) : (
                    <Chip label="No status" variant="outlined" size="small" />
                  )}
                </TableCell>
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
      </TableContainer>      {/* Form Dialog */}
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
                  <FormControl fullWidth required>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      name="unit"
                      defaultValue={editingProduct?.unit || ''}
                      label="Unit"
                    >
                      {units?.map((unit) => (
                        <MenuItem key={unit.id} value={unit.symbol}>
                          {unit.name} ({unit.symbol})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Quality Status</InputLabel>
                    <Select
                      name="qualityStatusId"
                      defaultValue={editingProduct?.qualityStatusId || getDefaultQualityStatusId()}
                      label="Quality Status"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {qualityStatuses.map((status: any) => (
                        <MenuItem key={status.id} value={status.id}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: 1,
                                backgroundColor: status.color || '#gray',
                                border: '1px solid #ddd',
                              }}
                            />
                            {status.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="contaminated"
                        defaultChecked={editingProduct?.contaminated || false}
                        color="error"
                      />
                    }
                    label="Mark as contaminated"
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
