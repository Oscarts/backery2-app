import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Grid,
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
  Alert,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Divider,
  Stack,
  Drawer,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
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
import { FinishedProduct, CategoryType, UpdateFinishedProductData, ProductStatus } from '../types';
import { formatDate, isExpired, isExpiringSoon, getDaysUntilExpiration, formatCurrency, getErrorMessage } from '../utils/api';
import { borderRadius } from '../theme/designTokens';
import EnhancedFinishedProductForm from '../components/EnhancedFinishedProductForm';
import ConfirmationDialog from '../components/dialogs/ConfirmationDialog';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';

// Status display helper functions

// Production status meta (color + labels) for subtle dot display
const getProductionStatusMeta = (status?: typeof ProductStatus[keyof typeof ProductStatus]) => {
  if (!status) return null;
  const label = status.replace('_', ' ');
  const descriptionMap: Record<string, string> = {
    PLANNED: 'Planned for production',
    IN_PROGRESS: 'Currently in production',
    COMPLETED: 'Production completed',
    CANCELLED: 'Production cancelled',
    ON_HOLD: 'Production paused'
  };
  const colorMap: Record<string, (theme: any) => string> = {
    PLANNED: (theme) => theme.palette.info.main,
    IN_PROGRESS: (theme) => theme.palette.primary.main,
    COMPLETED: (theme) => theme.palette.success.main,
    CANCELLED: (theme) => theme.palette.error.main,
    ON_HOLD: (theme) => theme.palette.warning.main,
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

  // Sanitize unit to avoid accidental SKU/timestamp strings leaking into quantity display
  const cleanUnit = (unit: string | undefined | null, sku?: string | null): string => {
    if (!unit) return '';
    if (sku && unit === sku) return '';
    if (/\d{10,}/.test(unit)) {
      return unit.replace(/[-_]?\d{10,}.*/, '');
    }
    return unit;
  };

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

  const {
    dialogState,
    closeConfirmationDialog,
    handleConfirm,
    confirmInventoryModification
  } = useConfirmationDialog();

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

  // Mutations
  const createMutation = useMutation(finishedProductsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['finishedProducts']);
      showSnackbar('Finished product created successfully', 'success');
    },
    onError: (error: unknown) => {
      showSnackbar(getErrorMessage(error), 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFinishedProductData }) =>
      finishedProductsApi.update(id, data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries(['finishedProducts']);
      // If status became COMPLETED, invalidate material breakdown so cost can refresh
      if ((vars.data.status as any) === (ProductStatus.COMPLETED as any) && vars.id === selectedProductId) {
        queryClient.invalidateQueries(['materialBreakdown', vars.id]);
      }
      showSnackbar('Finished product updated successfully', 'success');
    },
    onError: (error: unknown) => {
      showSnackbar(getErrorMessage(error), 'error');
    },
  });

  const deleteMutation = useMutation(finishedProductsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries(['finishedProducts']);
      showSnackbar('Finished product deleted successfully', 'success');
    },
    onError: (error: unknown) => {
      showSnackbar(getErrorMessage(error), 'error');
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
    // Find the product to get its name for the confirmation
    const product = products?.data?.find(p => p.id === id);
    const productName = product?.name || 'this product';

    confirmInventoryModification(
      'delete',
      'Finished Product',
      productName,
      `This will remove "${productName}" from your finished products inventory.`,
      [
        'Customer orders may be affected',
        'Sales reports will exclude this product',
        'Historical data will be preserved for audit purposes'
      ],
      async () => {
        await deleteMutation.mutateAsync(id);
      }
    );
  };

  // Clear selection when closing form

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
        <Box>
          <Typography
            variant={isMobile ? "h4" : "h3"}
            sx={{
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1
            }}
          >
            <LocalDiningIcon sx={{ fontSize: '1.2em', color: 'primary.main' }} />
            Finished Products
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor ready-to-sell products and inventory levels
          </Typography>
        </Box>

        <Box display="flex" gap={1} width={{ xs: '100%', sm: 'auto' }}>
          {/* View Toggle Buttons */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'flex' },
              border: 1,
              borderColor: 'divider',
              borderRadius: borderRadius.base, // 12px - Modern rounded toggle
              mr: 1
            }}
          >
            <Tooltip title="List View">
              <IconButton
                color={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
                sx={{
                  borderRadius: `${borderRadius.base} 0 0 ${borderRadius.base}`, // Left rounded
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
                  borderRadius: `0 ${borderRadius.base} ${borderRadius.base} 0`, // Right rounded
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
              borderRadius: borderRadius.md, // 16px - Modern rounded cards
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
              borderRadius: borderRadius.md, // 16px - Modern rounded cards
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
              borderRadius: borderRadius.md, // 16px - Modern rounded cards
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
        <Paper sx={{ borderRadius: borderRadius.md, overflow: 'hidden' }}>
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
                  <TableCell width="18%">Product</TableCell>
                  {!isMobile && <TableCell width="10%">SKU/Batch</TableCell>}
                  <TableCell width="12%" align="center">Inventory</TableCell>
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
                        <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                          {product.quantity === 0 ? (
                            <Typography sx={{ color: 'error.main', fontWeight: 'bold', fontSize: '0.875rem' }}>
                              Out of Stock
                            </Typography>
                          ) : (
                            <>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Typography
                                  sx={{
                                    fontWeight: 'bold',
                                    color: (product.quantity - product.reservedQuantity) <= 5 ? 'error.main' :
                                      (product.quantity - product.reservedQuantity) <= 10 ? 'warning.main' :
                                        'success.main',
                                    fontSize: '1rem'
                                  }}
                                >
                                  {(product.quantity - product.reservedQuantity).toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  available
                                </Typography>
                              </Box>
                              {product.reservedQuantity > 0 && (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Typography
                                    sx={{
                                      fontSize: '0.875rem',
                                      color: 'info.main',
                                      fontWeight: 'medium'
                                    }}
                                  >
                                    {product.reservedQuantity.toLocaleString()}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    reserved
                                  </Typography>
                                </Box>
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                                Total: {product.quantity.toLocaleString()} {cleanUnit(product.unit, product.sku)}
                              </Typography>
                            </>
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
            {paginatedProducts.map((product) => (
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
                    borderRadius: borderRadius.md // 16px - Modern rounded cards
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
                          SKU: {product.sku} • Batch: {product.batchNumber}
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
                      <Grid item xs={12}>
                        <Box sx={{
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1.5
                        }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Inventory Status
                          </Typography>
                          <Stack spacing={1}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                Available
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 'bold',
                                  color: (product.quantity - product.reservedQuantity) <= 5 ? 'error.main' :
                                    (product.quantity - product.reservedQuantity) <= 10 ? 'warning.main' :
                                      'success.main',
                                }}
                              >
                                {(product.quantity - product.reservedQuantity).toLocaleString()}
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                  {cleanUnit(product.unit, product.sku)}
                                </Typography>
                              </Typography>
                            </Box>
                            {product.reservedQuantity > 0 && (
                              <>
                                <Divider />
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" color="text.secondary">
                                    Reserved
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontWeight: 'medium',
                                      color: 'info.main',
                                    }}
                                  >
                                    {product.reservedQuantity.toLocaleString()}
                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                      {cleanUnit(product.unit, product.sku)}
                                    </Typography>
                                  </Typography>
                                </Box>
                              </>
                            )}
                            <Divider />
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                Total Inventory
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {product.quantity.toLocaleString()}
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                  {cleanUnit(product.unit, product.sku)}
                                </Typography>
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
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
            ))}
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



      {/* Enhanced Form Dialog with Smart Defaults */}
      <EnhancedFinishedProductForm
        open={openForm}
        onClose={handleCloseForm}
        product={editingProduct}
        categories={categories || []}
        storageLocations={storageLocations || []}
        units={units || []}
        qualityStatuses={qualityStatuses || []}
        onSubmit={(data) => {
          if (editingProduct) {
            confirmInventoryModification(
              'update',
              'Finished Product',
              data.name || editingProduct.name,
              `This will update "${data.name || editingProduct.name}" in your finished products.`,
              [
                'Product pricing and specifications may change',
                'Customer orders may be affected',
                'Sales reporting will be updated'
              ],
              async () => {
                await updateMutation.mutateAsync({
                  id: editingProduct.id,
                  data
                });
                handleCloseForm();
              }
            );
          } else {
            confirmInventoryModification(
              'create',
              'Finished Product',
              data.name,
              `This will add "${data.name}" to your finished products inventory.`,
              [
                'New product will be available for orders',
                'Sales tracking will begin immediately',
                'Cost calculations will include this product'
              ],
              async () => {
                await createMutation.mutateAsync(data);
                handleCloseForm();
              }
            );
          }
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={dialogState.open}
        onClose={closeConfirmationDialog}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        severity={dialogState.severity}
        loading={dialogState.loading}
        itemType={dialogState.itemType}
        itemName={dialogState.itemName}
        action={dialogState.action}
        consequences={dialogState.consequences}
        additionalInfo={dialogState.additionalInfo}
      />

      {/* Legacy MaterialBreakdownDialog removed; using inline Materials tab */}
    </Container>
  );
};

export default FinishedProducts;
