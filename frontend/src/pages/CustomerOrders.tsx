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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Alert,
  Snackbar,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Stack,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  Menu,
  ListItemIcon,
  ListItemText,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  PendingActions as PendingIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as FulfillIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { customerOrdersApi, customersApi } from '../services/realApi';
import { CustomerOrder, OrderStatus } from '../types';
import { formatDate } from '../utils/api';
import { borderRadius } from '../theme/designTokens';

// Language options for export
const exportLanguages = [
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
];

const CustomerOrders: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // View mode state (card or list)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Filter state
  const [filters, setFilters] = useState<{
    status?: OrderStatus;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>({});

  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<CustomerOrder | null>(null);

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [orderToExport, setOrderToExport] = useState<{ id: string; orderNumber: string } | null>(null);

  // Action menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // Fetch orders
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['customer-orders', filters],
    queryFn: () => customerOrdersApi.getAll(filters),
  });

  // Fetch customers for filter dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  });

  const orders = ordersData?.data || [];
  const customers = customersData?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: customerOrdersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
      showSnackbar('Order deleted successfully', 'success');
    },
    onError: (error: Error) => {
      showSnackbar(`Error: ${error.message}`, 'error');
    },
  });

  // Helper functions
  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
    setPage(0);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDeleteClick = (order: CustomerOrder) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete.id);
    }
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/customer-orders/${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    navigate(`/customer-orders/${orderId}/edit`);
  };

  // Action menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: CustomerOrder) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleMenuAction = (action: string) => {
    if (!selectedOrder) return;

    switch (action) {
      case 'view':
        handleViewOrder(selectedOrder.id);
        break;
      case 'edit':
        handleEditOrder(selectedOrder.id);
        break;
      case 'export':
        setOrderToExport({ id: selectedOrder.id, orderNumber: selectedOrder.orderNumber });
        setExportDialogOpen(true);
        break;
      case 'delete':
        handleDeleteClick(selectedOrder);
        break;
    }

    handleMenuClose();
  };

  // Export order as Word document (DOCX) with language selection
  const handleExportOrder = async (language: 'fr' | 'en' | 'es') => {
    if (!orderToExport) return;
    setExportDialogOpen(false);
    try {
      const blob = await customerOrdersApi.exportWord(orderToExport.id, language);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const langSuffix = language === 'fr' ? 'commande' : language === 'es' ? 'pedido' : 'order';
      link.download = `${langSuffix}-${orderToExport.orderNumber}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSnackbar('Export successful', 'success');
      setOrderToExport(null);
    } catch (error) {
      console.error('Export error:', error);
      showSnackbar('Export failed', 'error');
    }
  };

  // Status badge color
  const getStatusColor = (status: OrderStatus): 'default' | 'primary' | 'success' => {
    switch (status) {
      case OrderStatus.DRAFT:
        return 'default';
      case OrderStatus.CONFIRMED:
        return 'primary';
      case OrderStatus.FULFILLED:
        return 'success';
      default:
        return 'default';
    }
  };

  // Calculate KPI metrics
  const totalOrders = orders.length;
  const draftOrders = orders.filter(o => o.status === OrderStatus.DRAFT).length;
  const confirmedOrders = orders.filter(o => o.status === OrderStatus.CONFIRMED).length;
  const fulfilledOrders = orders.filter(o => o.status === OrderStatus.FULFILLED).length;

  // Apply status filter
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get customer initials for avatar
  const getCustomerInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get avatar color based on customer name
  const getAvatarColor = (name: string) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Error loading orders: {(error as Error).message}</Alert>
      </Container>
    );
  }

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
            <ShoppingCartIcon sx={{ fontSize: '1.2em', color: 'primary.main' }} />
            Customer Orders
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Track customer orders and fulfillment status
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

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/customer-orders/new')}
            sx={{
              flexGrow: { xs: 1, sm: 0 },
              whiteSpace: 'nowrap'
            }}
          >
            {!isMobile ? 'New Order' : 'New'}
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

      {/* Modern KPI cards */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => setStatusFilter('all')}
            elevation={1}
            sx={{
              borderRadius: borderRadius.md, // 16px - Modern rounded cards
              p: 0.5,
              border: 1,
              borderColor: statusFilter === 'all' ? 'primary.main' : 'divider',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: 'primary.main'
              },
              backgroundColor: statusFilter === 'all' ? 'primary.50' : 'white',
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
                <ReceiptIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" color="text.secondary">Total Orders</Typography>
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>{totalOrders}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => setStatusFilter(statusFilter === OrderStatus.DRAFT ? 'all' : OrderStatus.DRAFT)}
            elevation={1}
            sx={{
              borderRadius: borderRadius.md, // 16px - Modern rounded cards
              p: 0.5,
              border: 1,
              borderColor: statusFilter === OrderStatus.DRAFT ? 'warning.main' : 'divider',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: 'warning.main'
              },
              backgroundColor: statusFilter === OrderStatus.DRAFT ? 'warning.50' : 'white',
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
              <Avatar sx={{ bgcolor: 'grey.400', color: 'white', width: 32, height: 32 }}>
                <EditIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" color="text.secondary">Draft</Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ ml: 1, fontWeight: 'bold' }}>{draftOrders}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => setStatusFilter(statusFilter === OrderStatus.CONFIRMED ? 'all' : OrderStatus.CONFIRMED)}
            elevation={1}
            sx={{
              borderRadius: borderRadius.md, // 16px - Modern rounded cards
              p: 0.5,
              border: 1,
              borderColor: statusFilter === OrderStatus.CONFIRMED ? 'info.main' : 'divider',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: 'info.main'
              },
              backgroundColor: statusFilter === OrderStatus.CONFIRMED ? 'info.50' : 'white',
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
              <Avatar sx={{ bgcolor: 'info.light', color: 'info.contrastText', width: 32, height: 32 }}>
                <PendingIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" color="text.secondary">Confirmed</Typography>
                  <Typography variant="h6" color="info.main" sx={{ ml: 1, fontWeight: 'bold' }}>{confirmedOrders}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => setStatusFilter(statusFilter === OrderStatus.FULFILLED ? 'all' : OrderStatus.FULFILLED)}
            elevation={1}
            sx={{
              borderRadius: borderRadius.md, // 16px - Modern rounded cards
              p: 0.5,
              border: 1,
              borderColor: statusFilter === OrderStatus.FULFILLED ? 'success.main' : 'divider',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: 'success.main'
              },
              backgroundColor: statusFilter === OrderStatus.FULFILLED ? 'success.50' : 'white',
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
              <Avatar sx={{ bgcolor: 'success.light', color: 'success.contrastText', width: 32, height: 32 }}>
                <FulfillIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" color="text.secondary">Fulfilled</Typography>
                  <Typography variant="h6" color="success.main" sx={{ ml: 1, fontWeight: 'bold' }}>{fulfilledOrders}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters - Desktop */}
      {!isMobile && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search orders..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Customer</InputLabel>
                <Select
                  value={filters.customerId || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, customerId: e.target.value || undefined })
                  }
                  label="Customer"
                >
                  <MenuItem value="">All Customers</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                size="small"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                size="small"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Mobile Filters Drawer */}
      {isMobile && (
        <Drawer
          anchor="right"
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        >
          <Box sx={{ width: 280, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={() => setFiltersOpen(false)}>
                <SearchIcon />
              </IconButton>
            </Box>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Search orders..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Customer</InputLabel>
                <Select
                  value={filters.customerId || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, customerId: e.target.value || undefined })
                  }
                  label="Customer"
                >
                  <MenuItem value="">All Customers</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                size="small"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="End Date"
                type="date"
                size="small"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  handleSearch();
                  setFiltersOpen(false);
                }}
                fullWidth
              >
                Apply Filters
              </Button>
            </Stack>
          </Box>
        </Drawer>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 2, py: 1.5 } }}>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Delivery Date</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Total Price</TableCell>
              <TableCell align="center">Items</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow 
                  key={order.id} 
                  hover
                  onClick={() => handleViewOrder(order.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {order.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {order.customer?.name || 'Unknown Customer'}
                  </TableCell>
                  <TableCell>
                    {formatDate(order.expectedDeliveryDate)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${order.totalPrice?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={order.items?.length || 0}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, order);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredOrders.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage={isMobile ? "Items:" : "Items per page:"}
        sx={{ px: 2 }}
      />
    </Paper>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {paginatedOrders.map((order) => (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <Card
                  elevation={2}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: borderRadius.md,
                    position: 'relative'
                  }}
                  onClick={() => handleViewOrder(order.id)}
                >
                  <CardHeader
                    avatar={
                      <Avatar 
                        sx={{ bgcolor: getAvatarColor(order.customer?.name || 'Unknown'), width: 40, height: 40 }}
                      >
                        {getCustomerInitials(order.customer?.name || 'UK')}
                      </Avatar>
                    }
                    title={
                      <Typography variant="subtitle1" fontWeight="medium">
                        {order.orderNumber}
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary">
                        {order.customer?.name || 'Unknown Customer'}
                      </Typography>
                    }
                    action={
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    }
                    sx={{ pb: 1 }}
                  />

                  <Divider />

                  <CardContent sx={{ pt: 2, pb: 1, flexGrow: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Delivery Date
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(order.expectedDeliveryDate)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Price
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="primary">
                          ${order.totalPrice?.toFixed(2) || '0.00'}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Items
                        </Typography>
                        <Typography variant="body2">
                          {order.items?.length || 0} item(s)
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Markup
                        </Typography>
                        <Typography variant="body2">
                          {order.priceMarkupPercentage?.toFixed(0) || 0}%
                        </Typography>
                      </Grid>

                      {order.notes && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Notes
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {order.notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>

                  <CardActions sx={{ px: 2, py: 1, justifyContent: 'flex-end', bgcolor: 'background.default' }}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, order)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination for card view */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              component="div"
              count={filteredOrders.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Items per page:"
            />
          </Box>
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 180 }
        }}
      >
        <MenuItem onClick={() => handleMenuAction('view')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        {selectedOrder?.status === OrderStatus.DRAFT && (
          <MenuItem onClick={() => handleMenuAction('edit')}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Order</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => handleMenuAction('export')}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Word</ListItemText>
        </MenuItem>

        {selectedOrder?.status === OrderStatus.DRAFT && (
          <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete order "{orderToDelete?.orderNumber}"?
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Only orders in DRAFT status can be deleted.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Language Selection Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon />
            Export Order
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select the language for your export document:
          </DialogContentText>
          <List>
            {exportLanguages.map((lang) => (
              <ListItem key={lang.code} disablePadding>
                <ListItemButton
                  onClick={() => handleExportOrder(lang.code)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ fontSize: '1.5rem', minWidth: 40 }}>
                    {lang.flag}
                  </ListItemIcon>
                  <ListItemText
                    primary={lang.name}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default CustomerOrders;
