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
  DialogActions,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Stack,
  Divider,
  Drawer,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
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
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawMaterialsApi, categoriesApi, storageLocationsApi, unitsApi, suppliersApi, qualityStatusApi } from '../services/realApi';
import { RawMaterial, CategoryType, CreateRawMaterialData, UpdateRawMaterialData } from '../types';
import { formatDate, formatQuantity, isExpired, isExpiringSoon, getDaysUntilExpiration } from '../utils/api';

const RawMaterials: React.FC = () => {
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
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAttribute, setSearchAttribute] = useState<'all' | 'material' | 'batch' | 'supplier'>('all');
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

  const categories = categoriesResponse?.data?.filter(c => c.type === CategoryType.RAW_MATERIAL);
  const storageLocations = storageLocationsResponse?.data;
  const units = unitsResponse?.data;
  const suppliers = suppliersResponse?.data;
  const qualityStatuses = (qualityStatusResponse?.data as any[]) || [];

  // Get the default quality status (first item by sort order)
  const getDefaultQualityStatusId = () => {
    return qualityStatuses.length > 0 ? qualityStatuses[0].id : '';
  };

  // Mutations
  const createMutation = useMutation(rawMaterialsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['rawMaterials']);
      handleCloseForm();
      showSnackbar('Raw material created successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error creating raw material', 'error');
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
    onError: () => {
      showSnackbar('Error updating raw material', 'error');
    },
  });

  const deleteMutation = useMutation(rawMaterialsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries(['rawMaterials']);
      showSnackbar('Raw material deleted successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error deleting raw material', 'error');
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
  const contaminatedCount = baseFiltered?.filter(m => m.isContaminated)?.length || 0;
  
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
  const handleChangePage = (event: unknown, newPage: number) => {
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

  const getContaminationChip = (isContaminated: boolean) => {
    if (isContaminated) {
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

  const getStockLevelChip = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) {
      return <Chip label="OUT OF STOCK" color="error" size="small" />;
    }
    if (quantity <= reorderLevel) {
      return <Chip label="LOW STOCK" color="warning" size="small" />;
    }
    return <Chip label="In Stock" color="success" size="small" />;
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
        <Typography variant="h4" component="h1">
          Raw Materials
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Search By</InputLabel>
                <Select
                  value={searchAttribute}
                  onChange={(e) => setSearchAttribute(e.target.value as any)}
                  label="Search By"
                >
                  <MenuItem value="all">All Attributes</MenuItem>
                  <MenuItem value="material">Material</MenuItem>
                  <MenuItem value="batch">Batch</MenuItem>
                  <MenuItem value="supplier">Supplier</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
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
                  {!isMobile && <TableCell width="10%">Batch Number</TableCell>}
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
                        {!isMobile && <TableCell>{material.batchNumber}</TableCell>}
                        {!isMobile && <TableCell>{material.supplier?.name || 'Unknown'}</TableCell>}
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            sx={{
                              color: isLowStock ? 'error.main' : 'text.primary',
                              fontWeight: isLowStock ? 'medium' : 'regular',
                            }}
                          >
                            {formatQuantity(material.quantity, material.unit)}
                          </Typography>
                          {!isMobile && (
                            <Typography variant="caption" color="text.secondary">
                              Reorder: {formatQuantity(material.reorderLevel, material.unit)}
                            </Typography>
                          )}
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
                        '&:hover': { boxShadow: 3 },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenForm(material)}
                    >
                      <Box sx={{ p: 2, pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 0.5 }}>
                            {material.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenForm(material);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(material);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {material.category?.name || 'Uncategorized'} • Batch: {material.batchNumber}
                        </Typography>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Supplier: {material.supplier?.name || 'Unknown'}
                        </Typography>

                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Quantity
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: isLowStock ? 'error.main' : 'text.primary',
                                fontWeight: isLowStock ? 'medium' : 'regular',
                              }}
                            >
                              {formatQuantity(material.quantity, material.unit)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Unit Price
                            </Typography>
                            <Typography variant="body2">
                              ${material.unitPrice?.toFixed(2) || '0.00'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      <CardActions sx={{ p: 1, pt: 0, mt: 'auto', display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {material.qualityStatus && (
                          <Chip
                            label={material.qualityStatus.name}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: material.qualityStatus.color,
                              color: material.qualityStatus.color,
                              borderWidth: 1.5,
                              fontWeight: 'medium',
                              mr: 0.5
                            }}
                          />
                        )}

                        {isExpired(material.expirationDate) ? (
                          <Chip label="EXPIRED" size="small" color="error" />
                        ) : isExpiringSoon(material.expirationDate) ? (
                          <Chip label={`${getDaysUntilExpiration(material.expirationDate)} days left`} size="small" color="warning" />
                        ) : null}

                        {material.quantity <= 0 ? (
                          <Chip label="OUT OF STOCK" size="small" color="error" />
                        ) : material.quantity <= material.reorderLevel ? (
                          <Chip label="LOW STOCK" size="small" color="warning" />
                        ) : null}

                        {material.isContaminated && (
                          <Chip label="CONTAMINATED" size="small" color="error" />
                        )}
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

      {/* Form Dialog */}
      <RawMaterialForm
        open={openForm}
        onClose={handleCloseForm}
        material={editingMaterial}
        categories={categories || []}
        storageLocations={storageLocations || []}
        units={units || []}
        suppliers={suppliers || []}
        qualityStatuses={qualityStatuses || []}
        defaultQualityStatusId={getDefaultQualityStatusId()}
        onSubmit={(data) => {
          if (editingMaterial) {
            // For updates, include contaminated field if it exists
            const updateData: UpdateRawMaterialData = { ...data };
            if (data.contaminated !== undefined) {
              updateData.contaminated = data.contaminated;
            }
            updateMutation.mutate({ id: editingMaterial.id, data: updateData });
          } else {
            // For creation, remove contaminated field since new materials are not contaminated
            const { contaminated, ...createData } = data;
            createMutation.mutate(createData);
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

// Raw Material Form Component
interface RawMaterialFormData extends CreateRawMaterialData {
  contaminated?: boolean;
}

interface RawMaterialFormProps {
  open: boolean;
  onClose: () => void;
  material: RawMaterial | null;
  categories: any[];
  storageLocations: any[];
  units: any[];
  suppliers: any[];
  qualityStatuses: any[];
  defaultQualityStatusId: string;
  onSubmit: (data: RawMaterialFormData) => void;
}

const RawMaterialForm: React.FC<RawMaterialFormProps> = ({
  open,
  onClose,
  material,
  categories,
  storageLocations,
  units,
  suppliers,
  qualityStatuses,
  defaultQualityStatusId,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<RawMaterialFormData>({
    name: '',
    categoryId: '',
    supplierId: '', // We'll handle suppliers later
    batchNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    quantity: 0,
    unit: '',
    costPerUnit: 0,
    reorderLevel: 0,
    storageLocationId: '',
    qualityStatusId: '',
    contaminated: false, // Default is not contaminated
  });

  React.useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        categoryId: material.categoryId,
        supplierId: material.supplierId,
        batchNumber: material.batchNumber,
        purchaseDate: material.purchaseDate ? material.purchaseDate.split('T')[0] : '',
        expirationDate: material.expirationDate.split('T')[0],
        quantity: material.quantity,
        unit: material.unit,
        costPerUnit: material.unitPrice,
        reorderLevel: material.reorderLevel,
        storageLocationId: material.storageLocationId,
        qualityStatusId: material.qualityStatusId || '',
        contaminated: material.isContaminated,
      });
    } else {
      setFormData({
        name: '',
        categoryId: '',
        supplierId: '',
        batchNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        expirationDate: '',
        quantity: 0,
        unit: '',
        costPerUnit: 0,
        reorderLevel: 0,
        storageLocationId: '',
        qualityStatusId: '',
        contaminated: false, // Default is not contaminated
      });
    }
  }, [material, open]);

  // Set default quality status when quality statuses are loaded and no material is being edited
  React.useEffect(() => {
    if (qualityStatuses.length > 0 && !material && formData.qualityStatusId === '') {
      setFormData(prev => ({
        ...prev,
        qualityStatusId: defaultQualityStatusId
      }));
    }
  }, [qualityStatuses, material, formData.qualityStatusId, defaultQualityStatusId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateRawMaterialData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: ['quantity', 'costPerUnit', 'reorderLevel'].includes(field) ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {material ? 'Edit Raw Material' : 'Add New Raw Material'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Name"
                value={formData.name}
                onChange={handleChange('name')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Batch Number"
                value={formData.batchNumber}
                onChange={handleChange('batchNumber')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.categoryId}
                  label="Category"
                  onChange={handleChange('categoryId')}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={formData.supplierId}
                  label="Supplier"
                  onChange={handleChange('supplierId')}
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Storage Location</InputLabel>
                <Select
                  value={formData.storageLocationId}
                  label="Storage Location"
                  onChange={handleChange('storageLocationId')}
                >
                  {storageLocations.map((location) => (
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
                  value={formData.qualityStatusId || ''}
                  label="Quality Status"
                  onChange={handleChange('qualityStatusId')}
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
              <TextField
                fullWidth
                required
                label="Purchase Date"
                type="date"
                value={formData.purchaseDate}
                onChange={handleChange('purchaseDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Expiration Date"
                type="date"
                value={formData.expirationDate}
                onChange={handleChange('expirationDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange('quantity')}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unit}
                  label="Unit"
                  onChange={handleChange('unit')}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit.id} value={unit.symbol}>
                      {unit.name} ({unit.symbol})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {material && (
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.contaminated || false}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, contaminated: e.target.checked }))}
                      color="error"
                    />
                  }
                  label="Contaminated"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Cost per Unit"
                type="number"
                value={formData.costPerUnit}
                onChange={handleChange('costPerUnit')}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Reorder Level"
                type="number"
                value={formData.reorderLevel}
                onChange={handleChange('reorderLevel')}
                inputProps={{ min: 0, step: 0.1 }}
                helperText="Minimum quantity before reordering"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {material ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RawMaterials;
