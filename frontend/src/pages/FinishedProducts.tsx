import React, { useState, useEffect } from 'react';
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
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Divider,
  Stack,
  Drawer,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finishedProductsApi, categoriesApi, storageLocationsApi, unitsApi, qualityStatusApi } from '../services/realApi';
import { FinishedProduct, CategoryType, CreateFinishedProductData, UpdateFinishedProductData } from '../types';
import { formatDate, formatQuantity, isExpired, isExpiringSoon, getDaysUntilExpiration, formatCurrency } from '../utils/api';

// Status display helper functions
const getContaminationBadge = (isContaminated: boolean) => {
  if (isContaminated) {
    return <Chip label="CONTAMINATED" size="small" variant="outlined" color="error" sx={{ borderWidth: 1 }} />;
  }
  return null;
};

const getExpirationBadge = (expirationDate: string) => {
  if (isExpired(expirationDate)) {
    return <Chip label="EXPIRED" size="small" sx={{ backgroundColor: theme => theme.palette.error.main, color: 'white', fontWeight: 'medium' }} />;
  }
  if (isExpiringSoon(expirationDate)) {
    const days = getDaysUntilExpiration(expirationDate);
    return <Typography variant="caption" color="warning.main" fontWeight="medium" sx={{ display: 'block' }}>{days} days remaining</Typography>;
  }
  return null;
};

const FinishedProducts: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'card'>(isMobile ? 'card' : 'list');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Update viewMode when screen size changes
  useEffect(() => {
    if (isMobile) {
      setViewMode('card');
    }
  }, [isMobile]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);

  // Form state
  const [openForm, setOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FinishedProduct | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expirationFilter, setExpirationFilter] = useState('');


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

  // Helper function to display contamination status (only if contaminated)
  const getContaminationChip = (isContaminated: boolean) => {
    if (isContaminated) {
      return <Chip label="CONTAMINATED" color="error" size="small" sx={{ ml: 1 }} />;
    }
    return null; // Don't show anything if clean
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
      isContaminated: editingProduct?.isContaminated || false, // Default is not contaminated
      qualityStatusId: editingProduct?.qualityStatusId || getDefaultQualityStatusId(),
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
          <DialogTitle sx={{ pb: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {editingProduct ? 'Edit Finished Product' : 'Create Finished Product'}
              </Typography>
              <Box>
                <Button onClick={handleCloseForm} sx={{ mr: 1 }}>Cancel</Button>
                <Button type="submit" variant="contained">
                  {editingProduct ? 'Update' : 'Create'}
                </Button>
              </Box>
            </Box>
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
                    name="qualityStatusId"
                    value={formData.qualityStatusId || getDefaultQualityStatusId()}
                    onChange={(e) => setFormData({ ...formData, qualityStatusId: e.target.value })}
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
                <TextField
                  fullWidth
                  label="Packaging Info"
                  multiline
                  rows={2}
                  value={formData.packagingInfo}
                  onChange={(e) => setFormData({ ...formData, packagingInfo: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isContaminated"
                      checked={!!formData.isContaminated}
                      onChange={(e) => setFormData({ ...formData, isContaminated: e.target.checked })}
                      color="error"
                    />
                  }
                  label="Mark as contaminated"
                />
              </Grid>
            </Grid>
          </DialogContent>
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header with responsive design */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={2}
      >
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
          Finished Products
        </Typography>

        <Box display="flex" gap={1} width={{ xs: '100%', sm: 'auto' }}>
          {/* View Toggle Buttons */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'flex' },
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mr: 1
            }}
          >
            <Tooltip title="List View">
              <IconButton
                color={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
                sx={{
                  borderRadius: '4px 0 0 4px',
                  bgcolor: viewMode === 'list' ? 'action.selected' : 'transparent'
                }}
              >
                <ListViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Card View">
              <IconButton
                color={viewMode === 'card' ? 'primary' : 'default'}
                onClick={() => setViewMode('card')}
                sx={{
                  borderRadius: '0 4px 4px 0',
                  bgcolor: viewMode === 'card' ? 'action.selected' : 'transparent'
                }}
              >
                <GridViewIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Add Product Button - Full text on larger screens, icon-only on xs */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            sx={{
              flexGrow: { xs: 1, sm: 0 },
              whiteSpace: 'nowrap'
            }}
          >
            {!isMobile ? 'Add Product' : 'Add'}
          </Button>

          {/* Filter Toggle Button for Mobile */}
          {isMobile && (
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              Filters
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Cards with responsive grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: { xs: 1.5 }, px: { xs: 2 } }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Total Products
              </Typography>
              <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {filteredProducts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: { xs: 1.5 }, px: { xs: 2 } }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Expiring Soon
              </Typography>
              <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }} color="warning.main">
                {filteredProducts.filter(p => isExpiringSoon(p.expirationDate)).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: { xs: 1.5 }, px: { xs: 2 } }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Low Stock
              </Typography>
              <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }} color="error.main">
                {filteredProducts.filter(p => p.quantity <= 10).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: { xs: 1.5 }, px: { xs: 2 } }}>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Reserved Items
              </Typography>
              <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }} color="info.main">
                {filteredProducts.filter(p => p.reservedQuantity > 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters - Regular view on larger screens, drawer on mobile */}
      {!isMobile ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
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
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Expiration</InputLabel>
                <Select
                  value={expirationFilter}
                  onChange={(e) => setExpirationFilter(e.target.value)}
                  label="Expiration"
                >
                  <MenuItem value="">All Products</MenuItem>
                  <MenuItem value="expiring_soon">Expiring Soon</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Drawer
          anchor="bottom"
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              pt: 1
            }
          }}
        >
          <Box sx={{ p: 2, pb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={() => setFiltersOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />

              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories?.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Expiration</InputLabel>
                <Select
                  value={expirationFilter}
                  onChange={(e) => setExpirationFilter(e.target.value)}
                  label="Expiration"
                >
                  <MenuItem value="">All Products</MenuItem>
                  <MenuItem value="expiring_soon">Expiring Soon</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={() => setFiltersOpen(false)}
                fullWidth
              >
                Apply Filters
              </Button>
            </Stack>
          </Box>
        </Drawer>
      )}

      {/* List/Table View */}
      {viewMode === 'list' && (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table
              size="small"
              sx={{
                '& .MuiTableCell-root': {
                  px: 2,
                  py: 1.5,
                  whiteSpace: 'nowrap'
                }
              }}>
              <TableHead>
                <TableRow>
                  <TableCell width="20%">Product</TableCell>
                  {!isMobile && <TableCell width="10%">SKU/Batch</TableCell>}
                  <TableCell width="10%" align="center">Quantity</TableCell>
                  {!isMobile && <TableCell width="10%" align="center">Production</TableCell>}
                  {!isMobile && <TableCell width="10%" align="center">Storage</TableCell>}
                  {!isMobile && <TableCell width="10%" align="right">Price</TableCell>}
                  <TableCell width="10%" align="center">Expiration</TableCell>
                  {!isMobile && <TableCell width="10%" align="center">Quality</TableCell>}
                  <TableCell width="10%" align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProducts.map((product) => {
                  const isLowStock = product.quantity <= 10;

                  return (
                    <TableRow
                      key={product.id}
                      onClick={() => handleOpenForm(product)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
                            {product.name}
                            {getContaminationChip(product.isContaminated)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.category?.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{product.sku}</Typography>
                          <Typography variant="caption" color="text.secondary">{product.batchNumber}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                          {product.quantity === 0 ? (
                            <Typography sx={{ color: 'error.main', fontWeight: 'bold' }}>
                              Out of Stock
                            </Typography>
                          ) : (
                            <Typography
                              sx={{
                                fontWeight: isLowStock ? 'bold' : 'regular',
                                color: isLowStock ? 'warning.main' : 'text.primary',
                                borderBottom: isLowStock ? '1px solid' : 'none',
                                borderColor: 'warning.main'
                              }}
                            >
                              {formatQuantity(product.quantity, product.unit)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="body2">
                          {formatDate(product.productionDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {product.storageLocation?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">${product.salePrice.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                          <Typography variant="body2">
                            {formatDate(product.expirationDate)}
                          </Typography>
                          {getExpirationBadge(product.expirationDate)}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Box display="flex" justifyContent="center">
                          {product.qualityStatus ? (
                            <Chip
                              label={product.qualityStatus.name}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: product.qualityStatus.color || '#gray',
                                color: product.qualityStatus.color || '#gray',
                                borderWidth: 1.5,
                                fontWeight: 'medium'
                              }}
                            />
                          ) : (
                            <Chip label="No status" variant="outlined" size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product.id);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
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
            labelRowsPerPage={isMobile ? "Items:" : "Items per page:"}
            sx={{ px: 2 }}
          />
        </Paper>
      )}

      {/* Card View for Mobile */}
      {viewMode === 'card' && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {paginatedProducts.map((product) => {
              const isLowStock = product.quantity <= 10;

              return (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card
                    elevation={2}
                    onClick={() => handleOpenForm(product)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderLeft: product.isContaminated ? '4px solid #d32f2f' : 'none',
                      position: 'relative',
                      borderRadius: 2
                    }}
                  >
                    <CardHeader
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" noWrap>
                            {product.name}
                          </Typography>
                          {getContaminationBadge(product.isContaminated)}
                        </Box>
                      }
                      subheader={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            SKU: {product.sku}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Batch: {product.batchNumber}
                          </Typography>
                        </Box>
                      }
                      action={null}
                      sx={{ pb: 1 }}
                    />

                    <Divider />

                    <CardContent sx={{ pt: 2, pb: 1, flexGrow: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Available
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: isLowStock ? 'bold' : 'medium',
                              color: isLowStock ? 'error.main' : 'text.primary',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            {formatQuantity(product.quantity, product.unit)}
                            {isLowStock && (
                              <Tooltip title="Low stock">
                                <WarningIcon color="error" fontSize="small" sx={{ fontSize: '1rem' }} />
                              </Tooltip>
                            )}
                          </Typography>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Price
                          </Typography>
                          <Typography variant="body1">
                            {formatCurrency(product.salePrice)}
                          </Typography>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Expires
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(product.expirationDate)}
                          </Typography>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Category
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {product.category?.name || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Storage
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {product.storageLocation?.name || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Production
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {formatDate(product.productionDate)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>

                    <CardActions sx={{ px: 2, py: 1, justifyContent: 'space-between', bgcolor: 'background.default' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getExpirationBadge(product.expirationDate)}
                        {product.qualityStatus && (
                          <Chip
                            label={product.qualityStatus.name}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: product.qualityStatus.color || '#gray',
                              color: product.qualityStatus.color || '#gray',
                              borderWidth: 1.5,
                              fontWeight: 'medium'
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>


                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(product.id)}
                          aria-label="Delete product"
                        >
                          <Tooltip title="Delete product">
                            <DeleteIcon fontSize="small" />
                          </Tooltip>
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Card view pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <TablePagination
              component="div"
              count={filteredProducts.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage={isMobile ? "Items:" : "Items per page:"}
              sx={{
                '.MuiTablePagination-selectLabel': {
                  margin: 0,
                },
                '.MuiTablePagination-displayedRows': {
                  margin: 0,
                }
              }}
            />
          </Box>
        </Box>
      )}



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
