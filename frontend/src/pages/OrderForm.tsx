import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  CardContent,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { customersApi, customerOrdersApi, finishedProductsApi } from '../services/realApi';
import { CreateOrderData, CreateOrderItemData } from '../types';

interface OrderItemForm extends CreateOrderItemData {
  id: string; // Temporary ID for form management
  productName?: string;
  unitProductionCost?: number;
}

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id && id !== 'new');

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [priceMarkupPercentage, setPriceMarkupPercentage] = useState(50);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItemForm[]>([]);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  });

  // Fetch finished products
  const { data: productsData } = useQuery({
    queryKey: ['finished-products'],
    queryFn: () => finishedProductsApi.getAll(),
  });

  // Fetch order if editing
  const { data: orderData } = useQuery({
    queryKey: ['customer-order', id],
    queryFn: () => customerOrdersApi.getById(id!),
    enabled: isEditMode,
  });

  const customers = customersData?.data || [];
  const products = productsData?.data || [];

  // Load order data when editing
  useEffect(() => {
    if (orderData?.data) {
      const order = orderData.data;
      setCustomerId(order.customerId);
      setExpectedDeliveryDate(order.expectedDeliveryDate.split('T')[0]);
      setPriceMarkupPercentage(order.priceMarkupPercentage);
      setNotes(order.notes || '');
      
      if (order.items) {
        setItems(
          order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            productName: item.productName,
            unitProductionCost: item.unitProductionCost,
          }))
        );
      }
    }
  }, [orderData]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: customerOrdersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      showSnackbar('Order created successfully', 'success');
      setTimeout(() => navigate('/customer-orders'), 1500);
    },
    onError: (error: Error) => {
      showSnackbar(`Error: ${error.message}`, 'error');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateOrderData> }) =>
      customerOrdersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
      showSnackbar('Order updated successfully', 'success');
      setTimeout(() => navigate('/customer-orders'), 1500);
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

  // Add new item row
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `temp-${Date.now()}`,
        productId: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  // Update item field
  const handleItemChange = (itemId: string, field: keyof OrderItemForm, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          // If product changed, update product name and calculate unit price
          if (field === 'productId') {
            const product = products.find((p) => p.id === value);
            if (product) {
              updatedItem.productName = product.name;
              updatedItem.unitProductionCost = product.costToProduce || product.salePrice || 0;
              updatedItem.unitPrice = (product.costToProduce || product.salePrice || 0) * (1 + priceMarkupPercentage / 100);
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Recalculate prices based on markup
  const handleRecalculatePrices = () => {
    setItems(
      items.map((item) => {
        if (item.unitProductionCost) {
          return {
            ...item,
            unitPrice: item.unitProductionCost * (1 + priceMarkupPercentage / 100),
          };
        }
        return item;
      })
    );
    showSnackbar('Prices recalculated based on markup percentage', 'info');
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalCost = 0;
    let totalPrice = 0;

    items.forEach((item) => {
      if (item.unitProductionCost && item.quantity) {
        totalCost += item.unitProductionCost * item.quantity;
      }
      if (item.unitPrice && item.quantity) {
        totalPrice += item.unitPrice * item.quantity;
      }
    });

    return { totalCost, totalPrice };
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validation
    if (!customerId) {
      showSnackbar('Please select a customer', 'error');
      return;
    }
    if (!expectedDeliveryDate) {
      showSnackbar('Please select a delivery date', 'error');
      return;
    }
    if (items.length === 0) {
      showSnackbar('Please add at least one item', 'error');
      return;
    }
    if (items.some((item) => !item.productId || item.quantity <= 0)) {
      showSnackbar('Please complete all item details', 'error');
      return;
    }

    const orderData: CreateOrderData = {
      customerId,
      expectedDeliveryDate,
      priceMarkupPercentage,
      notes: notes || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    if (isEditMode) {
      updateMutation.mutate({ id: id!, data: orderData });
    } else {
      createMutation.mutate(orderData);
    }
  };

  const { totalCost, totalPrice } = calculateTotals();
  const actualMarkup = totalCost > 0 ? ((totalPrice - totalCost) / totalCost) * 100 : 0;

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
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Order' : 'Create New Order'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditMode
            ? 'Update order details and items'
            : 'Fill in the order information and add items'}
        </Typography>
      </Box>

      {/* Order Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>Customer</InputLabel>
              <Select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                label="Customer"
              >
                {customers
                  .filter((c) => c.isActive)
                  .map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Expected Delivery Date"
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Markup Percentage"
              type="number"
              value={priceMarkupPercentage}
              onChange={(e) => setPriceMarkupPercentage(Number(e.target.value))}
              InputProps={{
                endAdornment: '%',
              }}
              helperText="Default markup applied to all items"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or notes..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Order Items */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Order Items</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<CalculateIcon />}
              onClick={handleRecalculatePrices}
              disabled={items.length === 0}
            >
              Recalculate Prices
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddItem}>
              Add Item
            </Button>
          </Stack>
        </Box>

        {items.length === 0 ? (
          <Alert severity="info">No items added yet. Click "Add Item" to start.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="35%">Product</TableCell>
                  <TableCell width="15%" align="right">
                    Quantity
                  </TableCell>
                  <TableCell width="15%" align="right">
                    Unit Cost
                  </TableCell>
                  <TableCell width="15%" align="right">
                    Unit Price
                  </TableCell>
                  <TableCell width="15%" align="right">
                    Line Total
                  </TableCell>
                  <TableCell width="5%" align="center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const lineTotal = (item.unitPrice || 0) * item.quantity;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={item.productId}
                            onChange={(e) =>
                              handleItemChange(item.id, 'productId', e.target.value)
                            }
                            displayEmpty
                          >
                            <MenuItem value="" disabled>
                              Select product...
                            </MenuItem>
                            {products
                              .filter((p) => !p.isContaminated)
                              .map((product) => (
                                <MenuItem key={product.id} value={product.id}>
                                  {product.name} ({product.sku})
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(item.id, 'quantity', Number(e.target.value))
                          }
                          inputProps={{ min: 1 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          ${(item.unitProductionCost || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(item.id, 'unitPrice', Number(e.target.value))
                          }
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          ${lineTotal.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
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
        )}
      </Paper>

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
              <Typography variant="h6">{items.length}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total Production Cost
              </Typography>
              <Typography variant="h6">${totalCost.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Actual Markup
              </Typography>
              <Typography variant="h6">{actualMarkup.toFixed(1)}%</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total Price
              </Typography>
              <Typography variant="h6" color="primary">
                ${totalPrice.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/customer-orders')}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {isEditMode ? 'Update Order' : 'Create Order'}
        </Button>
      </Box>

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

export default OrderForm;
