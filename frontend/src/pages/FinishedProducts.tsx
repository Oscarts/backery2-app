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
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  LocalShipping as ReserveIcon,
  PlaylistRemove as ReleaseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finishedProductsApi, categoriesApi, storageLocationsApi, unitsApi, qualityStatusApi } from '../services/realApi';
import { FinishedProduct, CategoryType, CreateFinishedProductData, UpdateFinishedProductData } from '../types';
import { formatDate, formatQuantity, isExpired, isExpiringSoon, getDaysUntilExpiration } from '../utils/api';

const FinishedProducts: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openForm, setOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FinishedProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expirationFilter, setExpirationFilter] = useState('');
  const [reserveDialog, setReserveDialog] = useState<{ open: boolean; product: FinishedProduct | null }>({
    open: false,
    product: null,
  });
  const [reserveQuantity, setReserveQuantity] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const queryClient = useQueryClient();

  // Fetch data
  const { data: products } = useQuery(['finishedProducts'], finishedProductsApi.getAll);
  const { data: categoriesResponse } = useQuery(['categories'], () => categoriesApi.getAll());
  const { data: storageLocationsResponse } = useQuery(['storageLocations'], storageLocationsApi.getAll);
  const { data: unitsResponse } = useQuery(['units'], unitsApi.getAll);
  const { data: qualityStatusResponse } = useQuery(['qualityStatuses'], qualityStatusApi.getAll);
  
  const categories = categoriesResponse?.data?.filter(c => c.type === CategoryType.FINISHED_PRODUCT);
  const storageLocations = storageLocationsResponse?.data;
  const units = unitsResponse?.data;
  const qualityStatuses = (qualityStatusResponse?.data as any[]) || [];

  // Get default quality status (first in list)
  const getDefaultQualityStatusId = () => {
    return qualityStatuses.length > 0 ? qualityStatuses[0].id : '';
  };

  // Mutations
  const createMutation = useMutation(finishedProductsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['finishedProducts']);
      handleCloseForm();
      showSnackbar('Finished product created successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error creating finished product', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFinishedProductData }) => 
      finishedProductsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['finishedProducts']);
      handleCloseForm();
      showSnackbar('Finished product updated successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error updating finished product', 'error');
    },
  });

  const deleteMutation = useMutation(finishedProductsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries(['finishedProducts']);
      showSnackbar('Finished product deleted successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error deleting finished product', 'error');
    },
  });

  const reserveMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      finishedProductsApi.reserveQuantity(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(['finishedProducts']);
      setReserveDialog({ open: false, product: null });
      setReserveQuantity('');
      showSnackbar('Quantity reserved successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error reserving quantity', 'error');
    },
  });

  // Helper functions
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenForm = (product?: FinishedProduct) => {
    setEditingProduct(product || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this finished product?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleReserve = (product: FinishedProduct) => {
    setReserveDialog({ open: true, product });
  };

  const handleReserveSubmit = () => {
    if (reserveDialog.product && reserveQuantity) {
      const quantity = parseFloat(reserveQuantity);
      if (quantity > 0) {
        reserveMutation.mutate({ id: reserveDialog.product.id, quantity });
      }
    }
  };

  // Form component
  const ProductForm: React.FC = () => {
    const [formData, setFormData] = useState<CreateFinishedProductData>({
      name: editingProduct?.name || '',
      sku: editingProduct?.sku || '',
      categoryId: editingProduct?.categoryId || '',
      batchNumber: editingProduct?.batchNumber || '',
      productionDate: editingProduct?.productionDate?.split('T')[0] || '',
      expirationDate: editingProduct?.expirationDate?.split('T')[0] || '',
      shelfLife: editingProduct?.shelfLife || 0,
      quantity: editingProduct?.quantity || 0,
      unit: editingProduct?.unit || '',
      salePrice: editingProduct?.salePrice || 0,
      costToProduce: editingProduct?.costToProduce || undefined,
      packagingInfo: editingProduct?.packagingInfo || '',
      storageLocationId: editingProduct?.storageLocationId || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (editingProduct) {
        updateMutation.mutate({ id: editingProduct.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    };

    return (
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingProduct ? 'Edit Finished Product' : 'Create Finished Product'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
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
                <TextField
                  fullWidth
                  label="Batch Number"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Production Date"
                  type="date"
                  value={formData.productionDate}
                  onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expiration Date"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Shelf Life (days)"
                  type="number"
                  value={formData.shelfLife}
                  onChange={(e) => setFormData({ ...formData, shelfLife: parseInt(e.target.value) || 0 })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
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
                <TextField
                  fullWidth
                  label="Sale Price"
                  type="number"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cost to Produce"
                  type="number"
                  value={formData.costToProduce || ''}
                  onChange={(e) => setFormData({ ...formData, costToProduce: parseFloat(e.target.value) || undefined })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Storage Location</InputLabel>
                  <Select
                    value={formData.storageLocationId}
                    onChange={(e) => setFormData({ ...formData, storageLocationId: e.target.value })}
                  >
                    <MenuItem value="">None</MenuItem>
                    {storageLocations?.map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Quality Status</InputLabel>
                  <Select
                    value={formData.qualityStatusId || getDefaultQualityStatusId()}
                    onChange={(e) => setFormData({ ...formData, qualityStatusId: e.target.value })}
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
                <TextField
                  fullWidth
                  label="Packaging Info"
                  multiline
                  rows={2}
                  value={formData.packagingInfo}
                  onChange={(e) => setFormData({ ...formData, packagingInfo: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  };

  // Filter products
  const filteredProducts = products?.data?.filter((product) => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || product.categoryId === categoryFilter;
    
    let matchesExpiration = true;
    if (expirationFilter === 'expired') {
      matchesExpiration = isExpired(product.expirationDate);
    } else if (expirationFilter === 'expiring_soon') {
      matchesExpiration = isExpiringSoon(product.expirationDate);
    }
    
    return matchesSearch && matchesCategory && matchesExpiration;
  }) || [];

  const paginatedProducts = filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3" component="h1">
          Finished Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          Add Product
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Products
              </Typography>
              <Typography variant="h4">
                {filteredProducts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Expiring Soon
              </Typography>
              <Typography variant="h4" color="warning.main">
                {filteredProducts.filter(p => isExpiringSoon(p.expirationDate)).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Low Stock
              </Typography>
              <Typography variant="h4" color="error.main">
                {filteredProducts.filter(p => p.quantity <= 10).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Reserved Items
              </Typography>
              <Typography variant="h4" color="info.main">
                {filteredProducts.filter(p => p.reservedQuantity > 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Expiration</InputLabel>
              <Select
                value={expirationFilter}
                onChange={(e) => setExpirationFilter(e.target.value)}
              >
                <MenuItem value="">All Products</MenuItem>
                <MenuItem value="expiring_soon">Expiring Soon</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Reserved</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Expiration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Quality</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.map((product) => {
                const availableQuantity = product.quantity - product.reservedQuantity;
                const isLowStock = product.quantity <= 10;
                const isExpiringSoonProduct = isExpiringSoon(product.expirationDate);
                const isExpiredProduct = isExpired(product.expirationDate);

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{product.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.category?.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.batchNumber}</TableCell>
                    <TableCell>{product.category?.name}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>
                          {formatQuantity(product.quantity, product.unit)}
                        </Typography>
                        {isLowStock && (
                          <Tooltip title="Low stock">
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {product.reservedQuantity > 0 ? (
                        <Chip
                          label={`${formatQuantity(product.reservedQuantity, product.unit)}`}
                          color="info"
                          size="small"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>${product.salePrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(product.expirationDate)}
                        </Typography>
                        {isExpiredProduct ? (
                          <Chip label="Expired" color="error" size="small" />
                        ) : isExpiringSoonProduct ? (
                          <Chip 
                            label={`${getDaysUntilExpiration(product.expirationDate)} days`} 
                            color="warning" 
                            size="small" 
                          />
                        ) : null}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Chip
                          label={isLowStock ? 'Low Stock' : 'In Stock'}
                          color={isLowStock ? 'warning' : 'success'}
                          size="small"
                        />
                        {product.reservedQuantity > 0 && (
                          <Chip label="Reserved" color="info" size="small" />
                        )}
                      </Box>
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
                    <TableCell align="right">
                      <Box display="flex" gap={1}>
                        <Tooltip title="Reserve Quantity">
                          <IconButton
                            size="small"
                            onClick={() => handleReserve(product)}
                            disabled={availableQuantity <= 0}
                          >
                            <ReserveIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenForm(product)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(product.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredProducts.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
        />
      </Paper>

      {/* Reserve Quantity Dialog */}
      <Dialog
        open={reserveDialog.open}
        onClose={() => setReserveDialog({ open: false, product: null })}
      >
        <DialogTitle>Reserve Quantity</DialogTitle>
        <DialogContent>
          {reserveDialog.product && (
            <Box>
              <Typography gutterBottom>
                Product: {reserveDialog.product.name}
              </Typography>
              <Typography gutterBottom>
                Available: {formatQuantity(
                  reserveDialog.product.quantity - reserveDialog.product.reservedQuantity,
                  reserveDialog.product.unit
                )}
              </Typography>
              <TextField
                fullWidth
                label="Quantity to Reserve"
                type="number"
                value={reserveQuantity}
                onChange={(e) => setReserveQuantity(e.target.value)}
                sx={{ mt: 2 }}
                inputProps={{
                  max: reserveDialog.product.quantity - reserveDialog.product.reservedQuantity,
                  min: 0,
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReserveDialog({ open: false, product: null })}>
            Cancel
          </Button>
          <Button onClick={handleReserveSubmit} variant="contained">
            Reserve
          </Button>
        </DialogActions>
      </Dialog>

      <ProductForm />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FinishedProducts;
