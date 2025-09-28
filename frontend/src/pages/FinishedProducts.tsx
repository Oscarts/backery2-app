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
  Avatar,
  Tabs,
  Tab,
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
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  TrendingDown as TrendingDownIcon,
  LocalDining as LocalDiningIcon,
  Insights as IngredientsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finishedProductsApi, categoriesApi, storageLocationsApi, unitsApi, qualityStatusApi } from '../services/realApi';
import { FinishedProduct, CategoryType, CreateFinishedProductData, UpdateFinishedProductData, ProductStatus, MaterialBreakdown, MaterialAllocation, ApiResponse } from '../types';
import { formatDate, formatQuantity, isExpired, isExpiringSoon, getDaysUntilExpiration, formatCurrency } from '../utils/api';

// Status display helper functions

// Production status meta (color + labels) for subtle dot display
const getProductionStatusMeta = (status?: typeof ProductStatus[keyof typeof ProductStatus]) => {
  if (!status) return null;
  const label = status.replace('_', ' ');
  const descriptionMap: Record<string, string> = {
    IN_PRODUCTION: 'Currently in production',
    COMPLETED: 'Production completed',
    ON_HOLD: 'Production paused',
    DISCARDED: 'Discarded and not for use'
  };
  const colorMap: Record<string, (theme: any) => string> = {
    IN_PRODUCTION: (theme) => theme.palette.primary.main,
    COMPLETED: (theme) => theme.palette.success.main,
    ON_HOLD: (theme) => theme.palette.warning.main,
    DISCARDED: (theme) => theme.palette.error.main,
  };
  return {
    label,
    description: descriptionMap[status] || label,
    getColor: colorMap[status] || ((theme: any) => theme.palette.text.secondary)
  };
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
  const [searchAttribute, setSearchAttribute] = useState<'all' | 'product' | 'sku' | 'batch'>('all');
  const [indicatorFilter, setIndicatorFilter] = useState<'all' | 'expiring_soon' | 'low_stock'>('all');


  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Material breakdown query state (selected product for inline tab)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch data
  const { data: products } = useQuery(['finishedProducts'], finishedProductsApi.getAll);
  const { data: categoriesResponse } = useQuery(['categories'], () => categoriesApi.getAll());
  const { data: storageLocationsResponse } = useQuery(['storageLocations'], storageLocationsApi.getAll);
  const { data: unitsResponse } = useQuery(['units'], unitsApi.getAll);
  const { data: qualityStatusResponse } = useQuery(['qualityStatuses'], qualityStatusApi.getAll);

  // Fetch material breakdown for selected product
  const { data: materialBreakdownResponse, isLoading: materialLoading, error: materialError } = useQuery<ApiResponse<MaterialBreakdown> | null, Error>(
    ['materialBreakdown', selectedProductId],
    () => selectedProductId ? finishedProductsApi.getMaterialBreakdown(selectedProductId) : Promise.resolve(null),
    { enabled: !!selectedProductId, retry: false }
  );

  const categories = categoriesResponse?.data?.filter(c => c.type === CategoryType.FINISHED_PRODUCT);
  const storageLocations = storageLocationsResponse?.data;
  const units = unitsResponse?.data;
  const qualityStatuses = (qualityStatusResponse?.data as any[]) || [];

  // Get default quality status (first in list)
  const getDefaultQualityStatusId = () => {
    return qualityStatuses.length > 0 ? qualityStatuses[0].id : '';
  };

  // Get default quality status (first in list)

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
    if (product) {
      setSelectedProductId(product.id);
    } else {
      setSelectedProductId(null);
    }
    setOpenForm(true);
  };

  // Open material breakdown inline tab for a product (navigates to Materials tab inside form)
  const handleOpenMaterialTab = (product: FinishedProduct) => {
    setEditingProduct(product);
    setSelectedProductId(product.id);
    setOpenForm(true);
    // Defer tab switch until after dialog open (setTimeout to ensure state applied)
    setTimeout(() => {
      // no direct ref to child tab state; child component will read editingProduct & we trigger custom event
      const event = new CustomEvent('open-materials-tab');
      window.dispatchEvent(event);
    }, 0);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingProduct(null);
    setSelectedProductId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this finished product?')) {
      deleteMutation.mutate(id);
    }
  };

  // Clear selection when closing form



  // Form component
  const ProductForm: React.FC = () => {
    const [currentTab, setCurrentTab] = useState(0);

    // Listen for external request to jump to materials tab
    useEffect(() => {
      const handler = () => setCurrentTab(1);
      window.addEventListener('open-materials-tab', handler);
      return () => window.removeEventListener('open-materials-tab', handler);
    }, []);
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
      status: (editingProduct as any)?.status || ProductStatus.IN_PRODUCTION,
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
          
          {/* Add tabs for editing existing products */}
          {editingProduct && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} aria-label="product form tabs">
                <Tab label="Details" />
                <Tab label="Materials" />
              </Tabs>
            </Box>
          )}
          
          <DialogContent>
            {/* Tab Panel 0: Product Details (always shown) */}
            <Box hidden={!!editingProduct && currentTab !== 0}>
              <Grid container spacing={2} sx={{ mt: editingProduct ? 0 : 1 }}>
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Production Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    label="Production Status"
                  >
                    <MenuItem value={ProductStatus.IN_PRODUCTION}>In Production</MenuItem>
                    <MenuItem value={ProductStatus.COMPLETED}>Completed</MenuItem>
                    <MenuItem value={ProductStatus.ON_HOLD}>On Hold</MenuItem>
                    <MenuItem value={ProductStatus.DISCARDED}>Discarded</MenuItem>
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
            </Box>
            
            {/* Tab Panel 1: Materials (inline minimal table) */}
            {editingProduct && (
              <Box hidden={currentTab !== 1} sx={{ mt: 2 }}>
                {materialLoading && (
                  <Alert severity="info">Loading material breakdown...</Alert>
                )}
                {materialError && !materialLoading && (
                  <Alert severity={materialError.message.includes('No production run linked') ? 'warning' : 'error'}>
                    {materialError.message}
                  </Alert>
                )}
                {!materialLoading && !materialError && materialBreakdownResponse?.data && (
                  <Box>
                    <Card sx={{ mb:2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>Cost Summary</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Materials</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {materialBreakdownResponse.data.summary?.totalMaterialsUsed}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Material Cost</Typography>
                            <Typography variant="body1" fontWeight="bold">{formatCurrency(materialBreakdownResponse.data.summary?.totalMaterialCost || 0)}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Cost / Unit</Typography>
                            <Typography variant="body1" fontWeight="bold">{formatCurrency(materialBreakdownResponse.data.summary?.costPerUnit || 0)}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Total Cost</Typography>
                            <Typography variant="body1" fontWeight="bold">{formatCurrency(materialBreakdownResponse.data.summary?.totalProductionCost || 0)}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>SKU</TableCell>
                            <TableCell>Batch</TableCell>
                            <TableCell align="right">Qty Used</TableCell>
                            <TableCell align="right">Unit Cost</TableCell>
                            <TableCell align="right">Total Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(materialBreakdownResponse.data.materials || []).map((m: MaterialAllocation) => (
                            <TableRow key={m.id}>
                              <TableCell>{m.materialName}</TableCell>
                              <TableCell>{m.materialSku}</TableCell>
                              <TableCell>{m.materialBatchNumber || '—'}</TableCell>
                              <TableCell align="right">{(m.quantityConsumed || m.quantityAllocated).toFixed(2)} {m.unit}</TableCell>
                              <TableCell align="right">{formatCurrency(m.unitCost)}</TableCell>
                              <TableCell align="right">{formatCurrency(m.totalCost)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                {!materialLoading && !materialError && !materialBreakdownResponse?.data && (
                  <Alert severity="info">No material breakdown data available.</Alert>
                )}
              </Box>
            )}
          </DialogContent>
        </form>
      </Dialog>
    );
  };

  // Base filter by search attribute/term
  const baseFiltered = products?.data?.filter((product) => {
    const term = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (term) {
      switch (searchAttribute) {
        case 'product':
          matchesSearch = product.name.toLowerCase().includes(term);
          break;
        case 'sku':
          matchesSearch = product.sku.toLowerCase().includes(term);
          break;
        case 'batch':
          matchesSearch = product.batchNumber.toLowerCase().includes(term);
          break;
        case 'all':
        default:
          matchesSearch =
            product.name.toLowerCase().includes(term) ||
            product.sku.toLowerCase().includes(term) ||
            product.batchNumber.toLowerCase().includes(term);
      }
    }

    return matchesSearch;
  }) || [];

  // Indicator counts based on base filter (not the indicator filter)
  const totalCount = baseFiltered.length;
  const expiringSoonCount = baseFiltered.filter(p => isExpiringSoon(p.expirationDate) || isExpired(p.expirationDate)).length;
  const lowStockCount = baseFiltered.filter(p => p.quantity <= 10).length;

  // Apply indicator filter
  const filteredProducts = baseFiltered.filter((product) => {
    switch (indicatorFilter) {
      case 'expiring_soon':
        return isExpiringSoon(product.expirationDate) || isExpired(product.expirationDate);
      case 'low_stock':
        return product.quantity <= 10;
      case 'all':
      default:
        return true;
    }
  });

  const paginatedProducts = filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header with responsive design */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={2}
      >
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalDiningIcon color="success" />
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

      {/* Modern KPI cards with icons and click-to-filter - more compact design */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={4} md={4}>
          <Card
            onClick={() => setIndicatorFilter('all')}
            elevation={1}
            sx={{
              borderRadius: 1.5,
              p: 0.5,
              border: 1,
              borderColor: indicatorFilter === 'all' ? 'primary.main' : 'divider',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: 'primary.main'
              },
              backgroundColor: indicatorFilter === 'all' ? 'primary.50' : 'white',
              minHeight: '64px',
              display: 'flex',
            }}
          >
            <CardContent sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.25,
              pb: '8px !important',
              width: '100%'
            }}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 32, height: 32 }}>
                <InventoryIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" color="text.secondary">Total Products</Typography>
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>{totalCount}</Typography>
                </Box>
                {indicatorFilter === 'all' &&
                  <Typography variant="caption" color="primary.dark" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                    Currently viewing all
                  </Typography>
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <Card
            onClick={() => setIndicatorFilter(indicatorFilter === 'expiring_soon' ? 'all' : 'expiring_soon')}
            elevation={1}
            sx={{
              borderRadius: 1.5,
              p: 0.5,
              border: 1,
              borderColor: indicatorFilter === 'expiring_soon' ? 'warning.main' : (expiringSoonCount > 0 ? 'warning.main' : 'divider'),
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: 'warning.main'
              },
              backgroundColor: indicatorFilter === 'expiring_soon' ? 'warning.50' : 'white',
              minHeight: '64px',
              display: 'flex',
            }}
          >
            <CardContent sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.25,
              pb: '8px !important',
              width: '100%'
            }}>
              <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', width: 32, height: 32 }}>
                <ScheduleIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" color="text.secondary">Expiring Soon</Typography>
                  <Typography variant="h6" color="warning.main" sx={{ ml: 1, fontWeight: 'bold' }}>{expiringSoonCount}</Typography>
                </Box>
                {indicatorFilter === 'expiring_soon' &&
                  <Typography variant="caption" color="warning.dark" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                    Filtered by expiration
                  </Typography>
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <Card
            onClick={() => setIndicatorFilter(indicatorFilter === 'low_stock' ? 'all' : 'low_stock')}
            elevation={1}
            sx={{
              borderRadius: 1.5,
              p: 0.5,
              border: 1,
              borderColor: indicatorFilter === 'low_stock' ? 'error.main' : (lowStockCount > 0 ? 'error.main' : 'divider'),
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: 'error.main'
              },
              backgroundColor: indicatorFilter === 'low_stock' ? 'error.50' : 'white',
              minHeight: '64px',
              display: 'flex',
            }}
          >
            <CardContent sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.25,
              pb: '8px !important',
              width: '100%'
            }}>
              <Avatar sx={{ bgcolor: 'error.light', color: 'error.contrastText', width: 32, height: 32 }}>
                <TrendingDownIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" color="text.secondary">Low Stock</Typography>
                  <Typography variant="h6" color="error.main" sx={{ ml: 1, fontWeight: 'bold' }}>{lowStockCount}</Typography>
                </Box>
                {indicatorFilter === 'low_stock' &&
                  <Typography variant="caption" color="error.dark" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                    Filtered by low stock
                  </Typography>
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters - Regular view on larger screens, drawer on mobile */}
      {!isMobile ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Search By</InputLabel>
                <Select
                  value={searchAttribute}
                  onChange={(e) => setSearchAttribute(e.target.value as any)}
                  label="Search By"
                >
                  <MenuItem value="all">All Attributes</MenuItem>
                  <MenuItem value="product">Product</MenuItem>
                  <MenuItem value="sku">SKU</MenuItem>
                  <MenuItem value="batch">Batch</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                placeholder={
                  searchAttribute === 'all'
                    ? 'Search across all fields...'
                    : `Search by ${searchAttribute}...`
                }
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
              <FormControl fullWidth size="small">
                <InputLabel>Search By</InputLabel>
                <Select
                  value={searchAttribute}
                  onChange={(e) => setSearchAttribute(e.target.value as any)}
                  label="Search By"
                >
                  <MenuItem value="all">All Attributes</MenuItem>
                  <MenuItem value="product">Product</MenuItem>
                  <MenuItem value="sku">SKU</MenuItem>
                  <MenuItem value="batch">Batch</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                placeholder={
                  searchAttribute === 'all'
                    ? 'Search across all fields...'
                    : `Search by ${searchAttribute}...`
                }
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
                  {!isMobile && <TableCell width="10%" align="center">Status</TableCell>}
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
                        '&:hover': { bgcolor: 'action.hover' },
                        borderLeft: product.isContaminated ? '3px solid #d32f2f' : 'none'
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            {product.category?.name}
                            {product.isContaminated && (
                              <Chip
                                label="CONTAMINATED"
                                color="error"
                                size="small"
                                sx={{ ml: 1, height: 16, '& .MuiChip-label': { px: 0.5, py: 0 } }}
                              />
                            )}
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

                      {!isMobile && (
                        <TableCell align="center">
                          {(() => {
                            const meta = getProductionStatusMeta(product.status as any);
                            return meta ? (
                              <Tooltip title={meta.description} arrow>
                                <Box
                                  component="span"
                                  sx={(theme) => ({
                                    display: 'inline-block',
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: meta.getColor(theme),
                                    boxShadow: 0.5,
                                  })}
                                  aria-label={`${meta.label} status`}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            );
                          })()}
                        </TableCell>
                      )}

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
                        <Box display="flex" alignItems="center" gap={1}>
                          <Tooltip title="Show Material Breakdown">
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="Show material breakdown"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMaterialTab(product);
                              }}
                            >
                              <IngredientsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
                    onClick={() => handleOpenForm(product)}
                  >
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: theme.palette.success.main, width: 40, height: 40 }}>
                          <LocalDiningIcon fontSize="small" />
                        </Avatar>
                      }
                      title={
                        <Typography
                          variant="subtitle1"
                          fontWeight="medium"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.2,
                            height: 'auto',
                          }}
                        >
                          {product.name}
                        </Typography>
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
                      action={
                        <Tooltip title="Show Material Breakdown">
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label="Show material breakdown"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMaterialTab(product);
                            }}
                          >
                            <IngredientsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
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
                        {product.isContaminated && (
                          <Chip
                            label="CONTAMINATED"
                            color="error"
                            size="small"
                            sx={{ fontWeight: 'medium' }}
                          />
                        )}
                        {(() => {
                          const meta = getProductionStatusMeta(product.status as any);
                          return meta ? (
                            <Tooltip title={meta.description} arrow>
                              <Box
                                component="span"
                                sx={(theme) => ({
                                  display: 'inline-block',
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  bgcolor: meta.getColor(theme),
                                  ml: 0.5,
                                })}
                                aria-label={`${meta.label} status`}
                              />
                            </Tooltip>
                          ) : null;
                        })()}
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

      {/* Legacy MaterialBreakdownDialog removed; using inline Materials tab */}
    </Container>
  );
};

export default FinishedProducts;
