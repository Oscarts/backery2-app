import React, { useState, useEffect } from 'react';
import EnhancedRawMaterialForm from '../components/EnhancedRawMaterialForm';
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
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  Stack,
  Drawer,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon, // Keeping for now in case it's used elsewhere
  Search as SearchIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  TrendingDown as TrendingDownIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawMaterialsApi, categoriesApi, storageLocationsApi, unitsApi, suppliersApi, qualityStatusApi, skuReferencesApi } from '../services/realApi';
import { RawMaterial, CategoryType, UpdateRawMaterialData } from '../types';
import { borderRadius } from '../theme/designTokens';
import { formatDate, isExpired, isExpiringSoon, getDaysUntilExpiration, getErrorMessage } from '../utils/api';

const RawMaterials: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Prevent accidental display of SKU-like or timestamp-suffixed strings as units in quantity column
  const cleanUnit = (unit: string | undefined | null, sku?: string | null): string => {
    if (!unit) return '';
    if (sku && unit === sku) return '';
    // If contains a long digit sequence (likely timestamp) trim it off
    if (/\d{10,}/.test(unit)) {
      const trimmed = unit.replace(/[-_]?\d{10,}.*/, '');
      return trimmed;
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
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAttribute, setSearchAttribute] = useState<'all' | 'material' | 'sku' | 'batch' | 'supplier'>('all');
  const [expirationFilter, setExpirationFilter] = useState('');
  const [indicatorFilter, setIndicatorFilter] = useState<'all' | 'expiring_soon' | 'low_stock' | 'contaminated'>('all');

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const queryClient = useQueryClient();

  // Fetch data
  const { data: materials } = useQuery(['rawMaterials'], rawMaterialsApi.getAll);
  const { data: categoriesResponse } = useQuery(['categories'], () => categoriesApi.getAll());
  const { data: storageLocationsResponse } = useQuery(['storageLocations'], storageLocationsApi.getAll);
  const { data: unitsResponse } = useQuery(['units'], unitsApi.getAll);
  const { data: suppliersResponse } = useQuery(['suppliers'], suppliersApi.getAll);
  const { data: qualityStatusResponse } = useQuery(['qualityStatuses'], qualityStatusApi.getAll);
  const { data: skuReferencesResponse } = useQuery(['sku-references'], () => skuReferencesApi.getAll());

  const categories = categoriesResponse?.data?.filter(c => c.type === CategoryType.RAW_MATERIAL);
  const storageLocations = storageLocationsResponse?.data;
  const units = unitsResponse?.data;
  const suppliers = suppliersResponse?.data;
  const qualityStatuses = (qualityStatusResponse?.data as any[]) || [];
  const skuReferences = skuReferencesResponse?.data || [];



  // Mutations
  const createMutation = useMutation(rawMaterialsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['rawMaterials']);
      handleCloseForm();
      showSnackbar('Raw material created successfully', 'success');
    },
    onError: (error: unknown) => {
      showSnackbar(getErrorMessage(error), 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRawMaterialData }) =>
      rawMaterialsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rawMaterials']);
      handleCloseForm();
      showSnackbar('Raw material updated successfully', 'success');
    },
    onError: (error: unknown) => {
      showSnackbar(getErrorMessage(error), 'error');
    },
  });

  const deleteMutation = useMutation(rawMaterialsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries(['rawMaterials']);
      showSnackbar('Raw material deleted successfully', 'success');
    },
    onError: (error: unknown) => {
      showSnackbar(getErrorMessage(error), 'error');
    },
  });

  // Base filtering (search and expiration filter)
  const baseFiltered = materials?.data?.filter((material) => {
    let matchesSearch = true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      switch (searchAttribute) {
        case 'material':
          matchesSearch = material.name.toLowerCase().includes(term);
          break;
        case 'sku':
          matchesSearch = (material as any).sku?.toLowerCase().includes(term);
          break;
        case 'batch':
          matchesSearch = material.batchNumber.toLowerCase().includes(term);
          break;
        case 'supplier':
          matchesSearch = material.supplier?.name?.toLowerCase().includes(term) || false;
          break;
        case 'all':
        default:
          matchesSearch =
            material.name.toLowerCase().includes(term) ||
            material.batchNumber.toLowerCase().includes(term) ||
            (material.supplier?.name?.toLowerCase().includes(term) || false);
      }
    }

    const matchesExpiration = !expirationFilter ||
      (expirationFilter === 'expired' && isExpired(material.expirationDate)) ||
      (expirationFilter === 'expiring' && isExpiringSoon(material.expirationDate)) ||
      (expirationFilter === 'contaminated' && material.isContaminated);

    return matchesSearch && matchesExpiration;
  }) || [];

  // Calculate counts for KPI cards based on base filter
  const totalCount = baseFiltered?.length || 0;
  const expiringSoonCount = baseFiltered?.filter(m => isExpiringSoon(m.expirationDate) || isExpired(m.expirationDate))?.length || 0;
  const lowStockCount = baseFiltered?.filter(m => m.quantity <= m.reorderLevel)?.length || 0;

  // Apply indicator filter
  const filteredMaterials = baseFiltered.filter((material) => {
    switch (indicatorFilter) {
      case 'expiring_soon':
        return isExpiringSoon(material.expirationDate) || isExpired(material.expirationDate);
      case 'low_stock':
        return material.quantity <= material.reorderLevel;
      case 'contaminated':
        return material.isContaminated;
      case 'all':
      default:
        return true;
    }
  });

  // Handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenForm = (material?: RawMaterial) => {
    setEditingMaterial(material || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingMaterial(null);
  };

  const handleDelete = (material: RawMaterial) => {
    if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
      deleteMutation.mutate(material.id);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };



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
            <InventoryIcon sx={{ fontSize: '1.2em', color: 'primary.main' }} />
            Raw Materials
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Track ingredients, supplies, and stock levels for production
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

          {/* Add Material Button - Full text on larger screens, icon-only on xs */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            sx={{
              flexGrow: { xs: 1, sm: 0 },
              whiteSpace: 'nowrap'
            }}
          >
            {!isMobile ? 'Add Raw Material' : 'Add'}
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

      {/* Modern KPI cards with icons - now clickable and more compact */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={4} md={4}>
          <Card
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
            onClick={() => setIndicatorFilter('all')}
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
                  <Typography variant="caption" color="text.secondary">Total Materials</Typography>
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
            onClick={() => setIndicatorFilter('expiring_soon')}
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
            onClick={() => setIndicatorFilter('low_stock')}
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
                  <Typography variant="caption" color="text.secondary">Low Stock Items</Typography>
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
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Search By</InputLabel>
                <Select
                  value={searchAttribute}
                  onChange={(e) => setSearchAttribute(e.target.value as any)}
                  label="Search By"
                >
                  <MenuItem value="all">All Attributes</MenuItem>
                  <MenuItem value="material">Material</MenuItem>
                  <MenuItem value="sku">SKU</MenuItem>
                  <MenuItem value="batch">Batch</MenuItem>
                  <MenuItem value="supplier">Supplier</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
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
                  <MenuItem value="material">Material</MenuItem>
                  <MenuItem value="sku">SKU</MenuItem>
                  <MenuItem value="batch">Batch</MenuItem>
                  <MenuItem value="supplier">Supplier</MenuItem>
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
                  startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                }}
                size="small"
              />

              <FormControl fullWidth size="small">
                <InputLabel>Filter By Status</InputLabel>
                <Select
                  value={expirationFilter}
                  label="Filter By Status"
                  onChange={(e) => setExpirationFilter(e.target.value)}
                >
                  <MenuItem value="">All Items</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="expiring">Expiring Soon</MenuItem>
                  <MenuItem value="contaminated">Contaminated</MenuItem>
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

      {/* Display either List View or Card View based on viewMode state */}
      {viewMode === 'list' ? (
        // List/Table View
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 2, py: 1.5, whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  <TableCell width="20%">Material</TableCell>
                  {!isMobile && <TableCell width="10%">SKU Ref</TableCell>}
                  {!isMobile && <TableCell width="12%">SKU/Batch</TableCell>}
                  {!isMobile && <TableCell width="15%">Supplier</TableCell>}
                  <TableCell width="10%" align="center">Quantity</TableCell>
                  {!isMobile && <TableCell width="10%" align="center">Price</TableCell>}
                  {!isMobile && <TableCell width="10%" align="center">Stock Level</TableCell>}
                  <TableCell width="10%" align="center">Expiration</TableCell>
                  {!isMobile && <TableCell width="10%" align="center">Quality</TableCell>}
                  <TableCell width="10%" align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMaterials
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((material) => {
                    const isLowStock = material.quantity <= material.reorderLevel;

                    return (
                      <TableRow
                        key={material.id}
                        onClick={() => handleOpenForm(material)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderLeft: material.isContaminated ? '3px solid #d32f2f' : 'none'
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {material.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              {material.category?.name || 'Uncategorized'}
                              {material.isContaminated && (
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
                        {!isMobile && (
                          <TableCell>
                            {material.skuReference ? (
                              <Tooltip
                                title={
                                  <Box>
                                    <Typography variant="caption" display="block" fontWeight="bold">
                                      {material.skuReference.name}
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                      <strong>SKU:</strong> {material.skuReference.sku}
                                    </Typography>
                                    {material.skuReference.unitPrice && (
                                      <Typography variant="caption" display="block">
                                        <strong>Unit Price:</strong> ${material.skuReference.unitPrice}
                                      </Typography>
                                    )}
                                    {material.skuReference.reorderLevel && (
                                      <Typography variant="caption" display="block">
                                        <strong>Reorder Level:</strong> {material.skuReference.reorderLevel}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                                arrow
                              >
                                <Chip
                                  label={material.skuReference.sku}
                                  size="small"
                                  icon={<LabelIcon />}
                                  color="primary"
                                  variant="outlined"
                                  sx={{ cursor: 'help' }}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                        )}
                        {!isMobile && (
                          <TableCell>
                            <Box>
                              <Typography variant="body2">{material.sku || '-'}</Typography>
                              <Typography variant="caption" color="text.secondary">{material.batchNumber}</Typography>
                            </Box>
                          </TableCell>
                        )}
                        {!isMobile && <TableCell>{material.supplier?.name || 'Unknown'}</TableCell>}
                        <TableCell align="center">
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: isLowStock ? 'error.main' : 'text.primary',
                                fontWeight: isLowStock ? 'medium' : 'regular',
                              }}
                            >
                              {material.quantity.toLocaleString()} {cleanUnit((material as any).unitDetails?.symbol || material.unit, material.sku)}
                            </Typography>
                            {material.reservedQuantity > 0 && (
                              <Typography variant="caption" color="info.main" sx={{ display: 'block' }}>
                                ({material.reservedQuantity.toLocaleString()} reserved)
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="center">
                            ${material.unitPrice?.toFixed(2) || 'N/A'}
                          </TableCell>
                        )}
                        {!isMobile && (
                          <TableCell align="center">
                            {material.quantity <= 0 ? (
                              <Chip label="OUT OF STOCK" color="error" size="small" />
                            ) : material.quantity <= material.reorderLevel ? (
                              <Chip label="LOW STOCK" color="warning" size="small" />
                            ) : (
                              <Chip label="In Stock" color="success" size="small" />
                            )}
                          </TableCell>
                        )}
                        <TableCell align="center">
                          {isExpired(material.expirationDate) ? (
                            <Chip label="EXPIRED" size="small" sx={{ backgroundColor: theme => theme.palette.error.main, color: 'white' }} />
                          ) : isExpiringSoon(material.expirationDate) ? (
                            <Typography variant="caption" color="warning.main" fontWeight="medium" sx={{ display: 'block' }}>
                              {getDaysUntilExpiration(material.expirationDate)} days left
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {formatDate(material.expirationDate)}
                            </Typography>
                          )}
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="center">
                            {material.qualityStatus ? (
                              <Chip
                                label={material.qualityStatus.name}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: material.qualityStatus.color || '#gray',
                                  color: material.qualityStatus.color || '#gray',
                                  borderWidth: 1.5,
                                  fontWeight: 'medium'
                                }}
                              />
                            ) : (
                              <Chip label="No status" variant="outlined" size="small" />
                            )}
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenForm(material);
                              }}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(material);
                              }}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredMaterials.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      ) : (
        // Card View (for mobile)
        <Box>
          <Grid container spacing={2}>
            {filteredMaterials
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((material) => {
                const isLowStock = material.quantity <= material.reorderLevel;

                return (
                  <Grid item xs={12} sm={6} md={4} key={material.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderLeft: material.isContaminated ? '4px solid #d32f2f' : 'none',
                        position: 'relative',
                        borderRadius: 2,
                        '&:hover': { boxShadow: 6 },
                        cursor: 'pointer',
                      }}
                      onClick={() => handleOpenForm(material)}
                    >
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 40, height: 40 }}>
                            <InventoryIcon fontSize="small" />
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
                            {material.name}
                          </Typography>
                        }
                        subheader={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Batch: {material.batchNumber}
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
                              Total Qty
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
                              {material.quantity.toLocaleString()} {cleanUnit((material as any).unitDetails?.symbol || material.unit, material.sku)}
                              {isLowStock && (
                                <Tooltip title="Low stock">
                                  <WarningIcon color="error" fontSize="small" sx={{ fontSize: '1rem' }} />
                                </Tooltip>
                              )}
                            </Typography>
                          </Grid>

                          {material.reservedQuantity > 0 && (
                            <>
                              <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Reserved
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 'medium',
                                    color: 'info.main',
                                  }}
                                >
                                  {material.reservedQuantity.toLocaleString()} {cleanUnit((material as any).unitDetails?.symbol || material.unit, material.sku)}
                                </Typography>
                              </Grid>

                              <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Available
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 'medium',
                                    color: (material.quantity - material.reservedQuantity) <= material.reorderLevel ? 'warning.main' : 'success.main',
                                  }}
                                >
                                  {(material.quantity - material.reservedQuantity).toLocaleString()} {cleanUnit((material as any).unitDetails?.symbol || material.unit, material.sku)}
                                </Typography>
                              </Grid>
                            </>
                          )}

                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Price
                            </Typography>
                            <Typography variant="body1">
                              ${material.unitPrice?.toFixed(2) || '0.00'}
                            </Typography>
                          </Grid>

                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Expires
                            </Typography>
                            <Typography variant="body2">
                              {formatDate(material.expirationDate)}
                            </Typography>
                          </Grid>

                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Supplier
                            </Typography>
                            <Typography variant="body2" noWrap>
                              {material.supplier?.name || 'Unknown'}
                            </Typography>
                          </Grid>

                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Category
                            </Typography>
                            <Typography variant="body2" noWrap>
                              {material.category?.name || 'Uncategorized'}
                            </Typography>
                          </Grid>

                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Storage
                            </Typography>
                            <Typography variant="body2" noWrap>
                              {material.storageLocation?.name || 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>

                      <CardActions sx={{ px: 2, py: 1, justifyContent: 'space-between', bgcolor: 'background.default' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isExpired(material.expirationDate) && (
                            <Chip label="EXPIRED" size="small" sx={{ backgroundColor: theme => theme.palette.error.main, color: 'white', fontWeight: 'medium' }} />
                          )}
                          {isExpiringSoon(material.expirationDate) && !isExpired(material.expirationDate) && (
                            <Chip label={`${getDaysUntilExpiration(material.expirationDate)} days left`} color="warning" size="small" />
                          )}
                          {material.qualityStatus && (
                            <Chip
                              label={material.qualityStatus.name}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: material.qualityStatus.color || '#gray',
                                color: material.qualityStatus.color || '#gray',
                                borderWidth: 1.5,
                                fontWeight: 'medium'
                              }}
                            />
                          )}
                          {material.isContaminated && (
                            <Chip
                              label="CONTAMINATED"
                              color="error"
                              size="small"
                              sx={{ fontWeight: 'medium' }}
                            />
                          )}
                          {material.quantity <= 0 ? (
                            <Chip label="OUT OF STOCK" size="small" color="error" />
                          ) : material.quantity <= material.reorderLevel ? (
                            <Chip label="LOW STOCK" size="small" color="warning" />
                          ) : null}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(material);
                            }}
                            aria-label="Delete material"
                          >
                            <Tooltip title="Delete material">
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
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredMaterials.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}

      {/* Enhanced Form Dialog with Smart Defaults - Improved Wizard for Creating (with SKU search first) */}
      <EnhancedRawMaterialForm
        open={openForm}
        onClose={handleCloseForm}
        material={editingMaterial}
        categories={categories || []}
        storageLocations={storageLocations || []}
        units={units || []}
        suppliers={suppliers || []}
        qualityStatuses={qualityStatuses || []}
        skuReferences={skuReferences}
        onSubmit={(data) => {
          if (editingMaterial) {
            updateMutation.mutate({ id: editingMaterial.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RawMaterials;
