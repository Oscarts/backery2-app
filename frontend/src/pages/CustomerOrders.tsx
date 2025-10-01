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
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Check as ConfirmIcon,
  Undo as RevertIcon,
  CheckCircle as FulfillIcon,
  FileDownload as ExportIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { customerOrdersApi, customersApi } from '../services/realApi';
import { CustomerOrder, OrderStatus, Customer } from '../types';
import { formatDate } from '../utils/api';

const CustomerOrders: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState<{
    status?: OrderStatus;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>({});

  const [searchInput, setSearchInput] = useState('');

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<CustomerOrder | null>(null);

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

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: customerOrdersApi.confirmOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      showSnackbar('Order confirmed successfully', 'success');
    },
    onError: (error: Error) => {
      showSnackbar(`Error: ${error.message}`, 'error');
    },
  });

  // Revert mutation
  const revertMutation = useMutation({
    mutationFn: customerOrdersApi.revertToDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      showSnackbar('Order reverted to draft', 'success');
    },
    onError: (error: Error) => {
      showSnackbar(`Error: ${error.message}`, 'error');
    },
  });

  // Fulfill mutation
  const fulfillMutation = useMutation({
    mutationFn: customerOrdersApi.fulfillOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      showSnackbar('Order fulfilled successfully', 'success');
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

  const handleConfirmOrder = (orderId: string) => {
    confirmMutation.mutate(orderId);
  };

  const handleRevertOrder = (orderId: string) => {
    revertMutation.mutate(orderId);
  };

  const handleFulfillOrder = (orderId: string) => {
    fulfillMutation.mutate(orderId);
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/customer-orders/${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    navigate(`/customer-orders/${orderId}/edit`);
  };

  // Pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedOrders = orders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Error loading orders: {(error as Error).message}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Customer Orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage customer orders and track their status
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search orders..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value as OrderStatus || undefined })
                }
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value={OrderStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={OrderStatus.CONFIRMED}>Confirmed</MenuItem>
                <MenuItem value={OrderStatus.FULFILLED}>Fulfilled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
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
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/customer-orders/new')}
              >
                New Order
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <TableContainer component={Paper}>
        <Table>
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
                <TableRow key={order.id} hover>
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
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {order.status === OrderStatus.DRAFT && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditOrder(order.id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Confirm Order">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleConfirmOrder(order.id)}
                            >
                              <ConfirmIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(order)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {order.status === OrderStatus.CONFIRMED && (
                        <>
                          <Tooltip title="Revert to Draft">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleRevertOrder(order.id)}
                            >
                              <RevertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Fulfill Order">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleFulfillOrder(order.id)}
                            >
                              <FulfillIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

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
