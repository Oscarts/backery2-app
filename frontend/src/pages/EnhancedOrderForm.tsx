import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
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
  Card,
  CardContent,
  IconButton,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  useTheme,
  alpha,
  InputAdornment,
  Fade,
  Collapse,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Calculate as CalculateIcon,
  ShoppingCart as CartIcon,
  LocalOffer as PriceIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { customersApi, customerOrdersApi, finishedProductsApi } from '../services/realApi';
import { CreateOrderData, CreateOrderItemData, FinishedProduct } from '../types';
import { EnhancedProductSelector } from '../components/CustomerOrder/EnhancedProductSelector';

interface OrderItemForm extends CreateOrderItemData {
  id: string;
  productName?: string;
  unitProductionCost?: number;
  unit?: string;
  availableQuantity?: number;
  expirationDate?: string;
  batchNumber?: string;
}

const EnhancedOrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isEditMode = Boolean(id && id !== 'new');

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [priceMarkupPercentage, setPriceMarkupPercentage] = useState(50);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItemForm[]>([]);
  
  // UI state
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // Fetch data
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['finished-products'],
    queryFn: () => finishedProductsApi.getAll(),
  });

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
          order.items.map((item) => {
            const product = products.find(p => p.id === item.productId);
            return {
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              productName: product?.name,
              unitProductionCost: product?.costToProduce,
              unit: product?.unit,
              availableQuantity: product ? product.quantity - product.reservedQuantity : 0,
              expirationDate: product?.expirationDate,
              batchNumber: product?.batchNumber,
            };
          })
        );
      }
    }
  }, [orderData, products]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateOrderData) => customerOrdersApi.create(data),
    onSuccess: () => {
      showSnackbar('Order created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      setTimeout(() => navigate('/customer-orders'), 1500);
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Failed to create order', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateOrderData }) =>
      customerOrdersApi.update(id, data),
    onSuccess: () => {
      showSnackbar('Order updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-order', id] });
      setTimeout(() => navigate('/customer-orders'), 1500);
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Failed to update order', 'error');
    },
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  // Export order as Word document (DOCX)
  const handleExportOrder = async () => {
    if (!id || !orderData?.data) return;
    
    try {
      const blob = await customerOrdersApi.exportWord(id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `commande-${orderData.data.orderNumber}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSnackbar('Export successful', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showSnackbar('Export failed', 'error');
    }
  };

  const handleProductSelect = (product: FinishedProduct) => {
    // Check if product already added
    if (items.some(item => item.productId === product.id)) {
      showSnackbar('Product already added to order', 'warning');
      setProductSelectorOpen(false);
      return;
    }

    const basePrice = product.costToProduce || 0;
    const unitPrice = basePrice * (1 + priceMarkupPercentage / 100);
    
    const newItem: OrderItemForm = {
      id: `temp-${Date.now()}`,
      productId: product.id,
      quantity: 1,
      unitPrice: Number(unitPrice.toFixed(2)),
      productName: product.name,
      unitProductionCost: product.costToProduce,
      unit: product.unit,
      availableQuantity: product.quantity - product.reservedQuantity,
      expirationDate: product.expirationDate,
      batchNumber: product.batchNumber,
    };

    setItems([...items, newItem]);
    setProductSelectorOpen(false);
    showSnackbar(`${product.name} added to order`, 'success');
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const handleItemChange = (itemId: string, field: keyof OrderItemForm, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleRecalculatePrices = () => {
    if (items.length === 0) return;
    
    setItems(
      items.map((item) => {
        const basePrice = item.unitProductionCost || 0;
        const newPrice = basePrice * (1 + priceMarkupPercentage / 100);
        return { ...item, unitPrice: Number(newPrice.toFixed(2)) };
      })
    );
    showSnackbar('Prices recalculated based on markup percentage', 'info');
  };

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
    
    // Check for quantity issues
    const hasQuantityIssues = items.some((item) => {
      if (item.quantity <= 0) return true;
      if (item.availableQuantity !== undefined && item.quantity > item.availableQuantity) return true;
      return false;
    });
    
    if (hasQuantityIssues) {
      showSnackbar('Please check item quantities - some items exceed available stock', 'error');
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
  const profit = totalPrice - totalCost;

  const getDaysToExpiration = (expirationDate?: string) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/customer-orders')}
          sx={{ mb: 2 }}
        >
          Back to Orders
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              {isEditMode ? 'Edit Order' : 'Create New Order'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isEditMode
                ? 'Update order details and manage items'
                : 'Select customer, add products, and configure pricing'}
            </Typography>
          </Box>
          {isEditMode && orderData?.data && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportOrder}
              sx={{ flexShrink: 0 }}
            >
              Export Word
            </Button>
          )}
        </Box>
      </Box>

      {/* Order Information Card */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="medium">
            Order Information
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
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
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                }}
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
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PriceIcon />
                    </InputAdornment>
                  ),
                }}
                helperText="Default markup applied to all items"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions or notes..."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Order Items Card */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <CartIcon color="primary" />
              <Typography variant="h6" fontWeight="medium">
                Order Items
              </Typography>
              <Chip 
                label={`${items.length} item${items.length !== 1 ? 's' : ''}`} 
                size="small" 
                color="primary"
                variant="outlined"
              />
            </Box>
            <Stack direction="row" spacing={1}>
              {items.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CalculateIcon />}
                  onClick={handleRecalculatePrices}
                >
                  Recalculate
                </Button>
              )}
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => setProductSelectorOpen(true)}
              >
                Add Product
              </Button>
            </Stack>
          </Box>

          {items.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05)
              }}
            >
              No items added yet. Click "Add Product" to start building your order.
            </Alert>
          ) : (
            <List sx={{ mt: 2 }}>
              {items.map((item, index) => {
                const lineTotal = (item.unitPrice || 0) * item.quantity;
                const lineCost = (item.unitProductionCost || 0) * item.quantity;
                const lineProfit = lineTotal - lineCost;
                const lineMargin = lineCost > 0 ? ((lineProfit / lineCost) * 100) : 0;
                const daysToExp = getDaysToExpiration(item.expirationDate);
                const isLowStock = item.availableQuantity !== undefined && item.availableQuantity < 5;
                const exceedsStock = item.availableQuantity !== undefined && item.quantity > item.availableQuantity;

                return (
                  <React.Fragment key={item.id}>
                    {index > 0 && <Divider sx={{ my: 2 }} />}
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        flexDirection: 'column',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      }}
                    >
                      {/* Item Header */}
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {item.productName}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {item.batchNumber && (
                              <Chip label={`Batch: ${item.batchNumber}`} size="small" variant="outlined" />
                            )}
                            {daysToExp !== null && (
                              <Chip 
                                label={`Expires in ${daysToExp}d`}
                                size="small"
                                color={daysToExp <= 2 ? 'error' : daysToExp <= 7 ? 'warning' : 'default'}
                                variant="outlined"
                              />
                            )}
                            {isLowStock && (
                              <Chip label="Low stock" size="small" color="warning" variant="outlined" />
                            )}
                          </Stack>
                        </Box>
                        <IconButton 
                          onClick={() => handleRemoveItem(item.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      {/* Item Fields */}
                      <Grid container spacing={2} sx={{ width: '100%' }}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(item.id, 'quantity', Number(e.target.value))
                            }
                            inputProps={{ min: 1 }}
                            error={exceedsStock}
                            helperText={
                              item.availableQuantity !== undefined
                                ? `${item.availableQuantity} ${item.unit} available`
                                : undefined
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Unit Price"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(item.id, 'unitPrice', Number(e.target.value))
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            helperText={`Cost: $${(item.unitProductionCost || 0).toFixed(2)}`}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              Line Total
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="success.main">
                              ${lineTotal.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Profit: ${lineProfit.toFixed(2)} ({lineMargin.toFixed(0)}%)
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {exceedsStock && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                          Quantity exceeds available stock ({item.availableQuantity} {item.unit})
                        </Alert>
                      )}
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Order Summary Card */}
      {items.length > 0 && (
        <Fade in>
          <Card sx={{ mb: 3, borderRadius: 2, border: `2px solid ${theme.palette.primary.main}` }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="medium">
                  Order Summary
                </Typography>
                <Button
                  size="small"
                  endIcon={showPriceDetails ? <CollapseIcon /> : <ExpandIcon />}
                  onClick={() => setShowPriceDetails(!showPriceDetails)}
                >
                  {showPriceDetails ? 'Hide' : 'Show'} Details
                </Button>
              </Box>

              <Collapse in={showPriceDetails}>
                <Box sx={{ mb: 2 }}>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Total Cost:</Typography>
                      <Typography fontWeight="medium">${totalCost.toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Markup ({actualMarkup.toFixed(1)}%):</Typography>
                      <Typography fontWeight="medium" color="success.main">
                        +${profit.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider />
                  </Stack>
                </Box>
              </Collapse>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight="bold">
                  Total Price:
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  ${totalPrice.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Action Buttons */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {isEditMode 
              ? 'Save your changes to update this order. After saving, you can confirm the order from the order details page.'
              : 'Create this order as a draft. After creation, you can review and confirm it from the order details page.'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/customer-orders')}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="large"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEditMode ? 'Save Changes' : 'Save as Draft'}
          </Button>
        </Box>
      </Paper>

      {/* Product Selector Dialog */}
      <EnhancedProductSelector
        open={productSelectorOpen}
        onClose={() => setProductSelectorOpen(false)}
        products={products}
        onSelect={handleProductSelect}
        selectedProductIds={items.map(item => item.productId)}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EnhancedOrderForm;
