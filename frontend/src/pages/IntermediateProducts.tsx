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
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Avatar,
  Divider,
  InputAdornment,
  Stack,
  Drawer,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intermediateProductsApi, categoriesApi, storageLocationsApi, unitsApi, qualityStatusApi } from '../services/realApi';
import { IntermediateProduct, CategoryType, IntermediateProductStatus } from '../types';
import { formatDate, formatQuantity, isExpired, isExpiringSoon, getDaysUntilExpiration } from '../utils/api';

const IntermediateProducts: React.FC = () => {
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
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [openForm, setOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IntermediateProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAttribute, setSearchAttribute] = useState<'all' | 'product' | 'description' | 'batch'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const queryClient = useQueryClient();

  // Production status meta (color + labels) for subtle dot display
  const getProductionStatusMeta = (status?: IntermediateProductStatus) => {
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
    const term = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    
    if (term) {
      switch (searchAttribute) {
        case 'product':
          matchesSearch = product.name.toLowerCase().includes(term);
          break;
        case 'description':
          matchesSearch = product.description.toLowerCase().includes(term);
          break;
        case 'batch':
          matchesSearch = product.batchNumber.toLowerCase().includes(term);
          break;
        case 'all':
        default:
          matchesSearch = 
            product.name.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term) ||
            product.batchNumber.toLowerCase().includes(term);
      }
    }
    
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  // Calculate counts for KPI cards
  const totalCount = filteredProducts?.length || 0;
  const expiringSoonCount = filteredProducts?.filter(p => isExpiringSoon(p.expirationDate) || isExpired(p.expirationDate))?.length || 0;
  const inProgressCount = filteredProducts?.filter(p => p.status === IntermediateProductStatus.IN_PRODUCTION)?.length || 0;

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
          Intermediate Products
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
            onClick={() => setOpenForm(true)}
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

      {/* Modern KPI cards with icons */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4} md={4}>
          <Card
            elevation={1}
            sx={{
              borderRadius: 2,
              p: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 36, height: 36 }}>
                <InventoryIcon fontSize="small" />
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="caption" color="text.secondary">Total Products</Typography>
                <Typography variant="h5">{totalCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <Card
            elevation={1}
            sx={{
              borderRadius: 2,
              p: 1,
              border: 1,
              borderColor: 'warning.main',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
              <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', width: 36, height: 36 }}>
                <ScheduleIcon fontSize="small" />
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="caption" color="text.secondary">Expiring Soon or Expired</Typography>
                <Typography variant="h5" color="warning.main">{expiringSoonCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <Card
            elevation={1}
            sx={{
              borderRadius: 2,
              p: 1,
              border: 1,
              borderColor: 'primary.main',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 36, height: 36 }}>
                <TrendingDownIcon fontSize="small" />
              </Avatar>
              <Box flexGrow={1}>
                <Typography variant="caption" color="text.secondary">In Production</Typography>
                <Typography variant="h5" color="primary.main">{inProgressCount}</Typography>
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
                  <MenuItem value="description">Description</MenuItem>
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
                  <MenuItem value="description">Description</MenuItem>
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
                  startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                }}
                size="small"
              />
              
              <FormControl fullWidth size="small">
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
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 2, py: 1.5, whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  <TableCell width="20%">Product</TableCell>
                  {!isMobile && <TableCell width="10%">Batch Number</TableCell>}
                  <TableCell width="10%" align="center">Quantity</TableCell>
                  {!isMobile && <TableCell width="10%" align="center">Production</TableCell>}
                  {!isMobile && <TableCell width="10%" align="center">Storage</TableCell>}
                  <TableCell width="10%" align="center">Expiration</TableCell>
                  {!isMobile && <TableCell width="10%" align="center">Status</TableCell>}
                  {!isMobile && <TableCell width="10%" align="center">Quality</TableCell>}
                  <TableCell width="10%" align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedProducts.map((product) => {
                  const isLowStock = product.quantity <= 10;
                  
                  return (
                    <TableRow 
                      key={product.id}
                      onClick={() => {
                        setEditingProduct(product);
                        setOpenForm(true);
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderLeft: product.contaminated ? '3px solid #d32f2f' : 'none'
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            {product.category?.name || 'N/A'}
                            {product.contaminated && (
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
                      {!isMobile && <TableCell>{product.batchNumber}</TableCell>}
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
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
                        </Box>
                      </TableCell>
                      {!isMobile && (
                        <TableCell align="center">
                          <Typography variant="body2">
                            {formatDate(product.productionDate)}
                          </Typography>
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell align="center">
                          <Typography variant="body2">
                            {product.storageLocation?.name || 'N/A'}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                          <Typography variant="body2">
                            {formatDate(product.expirationDate)}
                          </Typography>
                          {isExpired(product.expirationDate) && (
                            <Chip label="EXPIRED" size="small" sx={{ backgroundColor: theme => theme.palette.error.main, color: 'white', fontWeight: 'medium' }} />
                          )}
                          {isExpiringSoon(product.expirationDate) && !isExpired(product.expirationDate) && (
                            <Typography variant="caption" color="warning.main" fontWeight="medium" sx={{ display: 'block' }}>
                              {getDaysUntilExpiration(product.expirationDate)} days remaining
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      {!isMobile && (
                        <TableCell align="center">
                          {(() => {
                            const meta = getProductionStatusMeta(product.status);
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
                      {!isMobile && (
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
                      )}
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this product?')) {
                              deleteMutation.mutate(product.id);
                            }
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
            {displayedProducts.map((product) => {
              const isLowStock = product.quantity <= 10;

              return (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card
                    elevation={2}
                    onClick={() => {
                      setEditingProduct(product);
                      setOpenForm(true);
                    }}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderLeft: product.contaminated ? '4px solid #d32f2f' : 'none',
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
                        </Box>
                      }
                      subheader={
                        <Box sx={{ mt: 0.5 }}>
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
                            Status
                          </Typography>
                          <Typography variant="body1">
                            {product.status.replace('_', ' ')}
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
                        {isExpired(product.expirationDate) && (
                          <Chip label="EXPIRED" size="small" sx={{ backgroundColor: theme => theme.palette.error.main, color: 'white', fontWeight: 'medium' }} />
                        )}
                        {isExpiringSoon(product.expirationDate) && !isExpired(product.expirationDate) && (
                          <Chip label={`${getDaysUntilExpiration(product.expirationDate)} days left`} color="warning" size="small" />
                        )}
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
                        {product.contaminated && (
                          <Chip 
                            label="CONTAMINATED" 
                            color="error" 
                            size="small" 
                            sx={{ fontWeight: 'medium' }} 
                          />
                        )}
                        {(() => {
                          const meta = getProductionStatusMeta(product.status);
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
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this product?')) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
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
      )}      {/* Form Dialog */}
      <Dialog
        open={openForm}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmitForm}>
          <DialogTitle sx={{ pb: 1 }}>
            {editingProduct ? 'Edit' : 'Add'} Intermediate Product
          </DialogTitle>
          <DialogActions sx={{ justifyContent: 'flex-start', px: 3, pb: 2, pt: 0 }}>
            <Button
              variant="contained"
              type="submit"
            >
              {editingProduct ? 'Update' : 'Create'}
            </Button>
            <Button onClick={handleCloseForm} variant="outlined">
              Cancel
            </Button>
          </DialogActions>
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
