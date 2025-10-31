import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Grid,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Check as ConfirmIcon,
  Undo as RevertIcon,
  CheckCircle as FulfillIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { customerOrdersApi } from '../services/realApi';
import { OrderStatus } from '../types';
import { formatDate } from '../utils/api';

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [inventoryCheckOpen, setInventoryCheckOpen] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // Fetch order details
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['customer-order', id],
    queryFn: () => customerOrdersApi.getById(id!),
    enabled: !!id,
  });

  // Fetch inventory check
  const { data: inventoryCheckData, refetch: refetchInventoryCheck } = useQuery({
    queryKey: ['customer-order-inventory', id],
    queryFn: () => customerOrdersApi.checkInventory(id!),
    enabled: false, // Manual trigger only
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: () => customerOrdersApi.confirmOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setConfirmDialogOpen(false);
      showSnackbar('Order confirmed successfully - inventory reserved', 'success');
    },
    onError: (error: Error) => {
      showSnackbar(`Error: ${error.message}`, 'error');
    },
  });

  // Revert mutation
  const revertMutation = useMutation({
    mutationFn: () => customerOrdersApi.revertToDraft(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setRevertDialogOpen(false);
      showSnackbar('Order reverted to draft - inventory released', 'success');
    },
    onError: (error: Error) => {
      showSnackbar(`Error: ${error.message}`, 'error');
    },
  });

  // Fulfill mutation
  const fulfillMutation = useMutation({
    mutationFn: () => customerOrdersApi.fulfillOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setFulfillDialogOpen(false);
      showSnackbar('Order fulfilled successfully - inventory consumed', 'success');
    },
    onError: (error: Error) => {
      showSnackbar(`Error: ${error.message}`, 'error');
    },
  });

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // Export handlers
  const handleCheckInventory = () => {
    refetchInventoryCheck();
    setInventoryCheckOpen(true);
  };

  const handleConfirmClick = async () => {
    // Check inventory before showing confirm dialog
    const result = await refetchInventoryCheck();
    if (result.data?.data?.canFulfill === false) {
      // Show inventory check dialog if insufficient
      setInventoryCheckOpen(true);
      showSnackbar('Cannot confirm: Insufficient inventory for some items', 'error');
    } else {
      // Show confirm dialog if inventory is available
      setConfirmDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading order details...</Typography>
      </Container>
    );
  }

  if (error || !orderData?.data) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Error loading order: {(error as Error)?.message || 'Order not found'}
        </Alert>
      </Container>
    );
  }

  const order = orderData.data;

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

  const inventoryCheck = inventoryCheckData?.data;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/customer-orders')}
          sx={{ mb: 2 }}
        >
          Back to Orders
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Order {order.orderNumber}
            </Typography>
            <Chip label={order.status} color={getStatusColor(order.status)} />
          </Box>
        </Box>
      </Box>

      {/* Order Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Information
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Customer
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {order.customer?.name || 'Unknown'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Expected Delivery
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatDate(order.expectedDeliveryDate)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Created Date
            </Typography>
            <Typography variant="body1">{formatDate(order.createdAt)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1">{formatDate(order.updatedAt)}</Typography>
          </Grid>
        </Grid>

        {order.customer?.email && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Customer Contact
            </Typography>
            <Grid container spacing={2}>
              {order.customer.email && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2">Email: {order.customer.email}</Typography>
                </Grid>
              )}
              {order.customer.phone && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2">Phone: {order.customer.phone}</Typography>
                </Grid>
              )}
              {order.customer.address && (
                <Grid item xs={12}>
                  <Typography variant="body2">Address: {order.customer.address}</Typography>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {order.notes && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Notes
            </Typography>
            <Typography variant="body2">{order.notes}</Typography>
          </>
        )}
      </Paper>

      {/* Order Items */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Cost</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Line Cost</TableCell>
                <TableCell align="right">Line Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.productName}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.productSku || '-'}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">${item.unitProductionCost.toFixed(2)}</TableCell>
                  <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell align="right">${item.lineProductionCost.toFixed(2)}</TableCell>
                  <TableCell align="right">${item.linePrice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Quick Actions - Prominent placement at top */}
      {order.status !== OrderStatus.FULFILLED && (
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: 'primary.50',
            border: '1px solid',
            borderColor: 'primary.main'
          }}
        >
          <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
            Quick Actions
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
            {order.status === OrderStatus.DRAFT && (
              <>
                <Button
                  variant="contained"
                  size="large"
                  color="success"
                  startIcon={<ConfirmIcon />}
                  onClick={handleConfirmClick}
                  sx={{ flexGrow: 1, minWidth: 180 }}
                >
                  Confirm Order
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/customer-orders/${id}/edit`)}
                  sx={{ flexGrow: 1, minWidth: 180 }}
                >
                  Edit Order
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<InventoryIcon />}
                  onClick={handleCheckInventory}
                  sx={{ flexGrow: 1, minWidth: 180 }}
                >
                  Check Inventory
                </Button>
              </>
            )}

            {order.status === OrderStatus.CONFIRMED && (
              <>
                <Button
                  variant="contained"
                  size="large"
                  color="success"
                  startIcon={<FulfillIcon />}
                  onClick={() => setFulfillDialogOpen(true)}
                  sx={{ flexGrow: 1, minWidth: 180 }}
                >
                  Fulfill Order
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  color="warning"
                  startIcon={<RevertIcon />}
                  onClick={() => setRevertDialogOpen(true)}
                  sx={{ flexGrow: 1, minWidth: 180 }}
                >
                  Revert to Draft
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<InventoryIcon />}
                  onClick={handleCheckInventory}
                  sx={{ flexGrow: 1, minWidth: 180 }}
                >
                  Check Inventory
                </Button>
              </>
            )}
          </Stack>
        </Paper>
      )}

      {order.status === OrderStatus.FULFILLED && (
        <Alert severity="success" icon={<FulfillIcon />} sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="medium">
            This order has been fulfilled and delivered to the customer.
          </Typography>
        </Alert>
      )}

      {/* Order Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total Items
              </Typography>
              <Typography variant="h6">{order.items?.length || 0}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total Production Cost
              </Typography>
              <Typography variant="h6">${order.totalProductionCost.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Markup Percentage
              </Typography>
              <Typography variant="h6">{order.priceMarkupPercentage.toFixed(1)}%</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total Price
              </Typography>
              <Typography variant="h6" color="primary">
                ${order.totalPrice.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to confirm this order? This will:
            <ul>
              <li>Change the order status from DRAFT to CONFIRMED</li>
              <li>Reserve the required inventory for this order</li>
              <li>Prevent modifications to order items</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => confirmMutation.mutate()}
            color="success"
            variant="contained"
            disabled={confirmMutation.isPending}
          >
            Confirm Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revert Dialog */}
      <Dialog open={revertDialogOpen} onClose={() => setRevertDialogOpen(false)}>
        <DialogTitle>Revert to Draft</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to revert this order to draft status? This will:
            <ul>
              <li>Change the order status from CONFIRMED to DRAFT</li>
              <li>Release the reserved inventory</li>
              <li>Allow modifications to order items</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevertDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => revertMutation.mutate()}
            color="warning"
            variant="contained"
            disabled={revertMutation.isPending}
          >
            Revert to Draft
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fulfill Dialog */}
      <Dialog open={fulfillDialogOpen} onClose={() => setFulfillDialogOpen(false)}>
        <DialogTitle>Fulfill Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to fulfill this order? This will:
            <ul>
              <li>Change the order status from CONFIRMED to FULFILLED</li>
              <li>Consume the inventory (reduce actual quantities)</li>
              <li>Make the order read-only (cannot be modified or deleted)</li>
            </ul>
            This action should only be done when the order is actually delivered.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFulfillDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => fulfillMutation.mutate()}
            color="success"
            variant="contained"
            disabled={fulfillMutation.isPending}
          >
            Fulfill Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Check Dialog */}
      <Dialog
        open={inventoryCheckOpen}
        onClose={() => setInventoryCheckOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Inventory Availability Check</DialogTitle>
        <DialogContent>
          {inventoryCheck ? (
            inventoryCheck.canFulfill ? (
              <Alert severity="success" icon={<FulfillIcon />}>
                <Typography variant="body1" fontWeight="medium">
                  All items are available in inventory!
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  You can proceed to confirm this order.
                </Typography>
              </Alert>
            ) : (
              <>
                <Alert severity="error" icon={<WarningIcon />}>
                  <Typography variant="body1" fontWeight="medium">
                    Insufficient inventory for some items
                  </Typography>
                </Alert>
                <TableContainer sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Required</TableCell>
                        <TableCell align="right">Available</TableCell>
                        <TableCell align="right">Shortage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryCheck.insufficientProducts?.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="right">{item.required}</TableCell>
                          <TableCell align="right">{item.available}</TableCell>
                          <TableCell align="right">
                            <Typography color="error" fontWeight="medium">
                              {item.shortage}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )
          ) : (
            <Typography>Loading inventory check...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInventoryCheckOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default OrderDetails;
