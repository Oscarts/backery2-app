import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Typography,
  InputAdornment,
  Stack,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Inventory as InventoryIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { FinishedProduct } from '../../types';

interface EnhancedProductSelectorProps {
  open: boolean;
  products: FinishedProduct[];
  selectedProductIds?: string[];
  onSelect: (product: FinishedProduct) => void;
  onClose: () => void;
}

export const EnhancedProductSelector: React.FC<EnhancedProductSelectorProps> = ({
  open,
  onClose,
  products,
  onSelect,
  selectedProductIds = [],
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products
  const filteredProducts = products.filter((product) => {
    // Exclude already selected products
    if (selectedProductIds.includes(product.id)) return false;

    // Search filter
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    return true;
  });  // Sort by expiration date (earliest first) and available quantity
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aAvailable = a.quantity - a.reservedQuantity;
    const bAvailable = b.quantity - b.reservedQuantity;
    
    // Out of stock products last
    if (aAvailable <= 0 && bAvailable > 0) return 1;
    if (bAvailable <= 0 && aAvailable > 0) return -1;
    
    // Sort by expiration date
    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
  });

  const getStockStatus = (product: FinishedProduct) => {
    const available = product.quantity - product.reservedQuantity;
    
    if (available <= 0) {
      return { label: 'Out of stock', color: 'error' as const, icon: <WarningIcon fontSize="small" /> };
    }
    if (available < 5) {
      return { label: 'Low stock', color: 'warning' as const, icon: <WarningIcon fontSize="small" /> };
    }
    return { label: 'In stock', color: 'success' as const, icon: <CheckIcon fontSize="small" /> };
  };

  const getDaysToExpiration = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (expirationDate: string) => {
    const daysLeft = getDaysToExpiration(expirationDate);
    
    if (daysLeft < 0) {
      return { label: 'Expired', color: 'error' as const, urgent: true };
    }
    if (daysLeft <= 2) {
      return { label: `${daysLeft}d left`, color: 'error' as const, urgent: true };
    }
    if (daysLeft <= 7) {
      return { label: `${daysLeft}d left`, color: 'warning' as const, urgent: false };
    }
    return { label: `${daysLeft}d left`, color: 'success' as const, urgent: false };
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: 800,
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Select Product</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField
            fullWidth
            placeholder="Search by name, SKU, or batch number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            autoFocus
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''} available
          </Typography>
        </Box>

        {/* Products List */}
        {sortedProducts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchQuery ? 'No products match your search' : 'No products available'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {sortedProducts.map((product, index) => {
              const available = product.quantity - product.reservedQuantity;
              const stockStatus = getStockStatus(product);
              const expirationStatus = getExpirationStatus(product.expirationDate);
              const isOutOfStock = available <= 0;
              const isAlreadySelected = selectedProductIds.includes(product.id);

              return (
                <React.Fragment key={product.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    disablePadding
                    sx={{
                      opacity: isOutOfStock ? 0.6 : 1,
                      bgcolor: isAlreadySelected 
                        ? alpha(theme.palette.primary.main, 0.08)
                        : 'transparent',
                    }}
                  >
                    <ListItemButton
                      onClick={() => !isOutOfStock && onSelect(product)}
                      disabled={isOutOfStock}
                      sx={{ py: 2, px: 2 }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: isOutOfStock
                              ? theme.palette.grey[400]
                              : theme.palette.primary.main,
                            width: 56,
                            height: 56,
                          }}
                        >
                          <InventoryIcon />
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="subtitle1" fontWeight="medium">
                              {product.name}
                            </Typography>
                            {isAlreadySelected && (
                              <Chip
                                label="Selected"
                                size="small"
                                color="primary"
                                icon={<CheckIcon />}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {/* SKU and Batch */}
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              SKU: {product.sku} • Batch: {product.batchNumber || 'N/A'}
                            </Typography>
                            
                            {/* Status Chips */}
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                              {/* Stock Status */}
                              <Chip
                                size="small"
                                icon={stockStatus.icon}
                                label={`${available} ${product.unit} available`}
                                color={stockStatus.color}
                                variant="outlined"
                              />
                              
                              {/* Expiration */}
                              <Chip
                                size="small"
                                icon={<CalendarIcon fontSize="small" />}
                                label={expirationStatus.label}
                                color={expirationStatus.color}
                                variant={expirationStatus.urgent ? 'filled' : 'outlined'}
                              />
                              
                              {/* Reserved quantity if any */}
                              {product.reservedQuantity > 0 && (
                                <Tooltip title="Already reserved for other orders">
                                  <Chip
                                    size="small"
                                    label={`${product.reservedQuantity} reserved`}
                                    color="default"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                            </Stack>
                            
                            {/* Cost info */}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Production cost: ${product.costToProduce?.toFixed(2) || '0.00'} / {product.unit}
                              {product.salePrice && ` • Sale price: $${product.salePrice.toFixed(2)} / ${product.unit}`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
        
        {/* Info Alert */}
        {sortedProducts.length > 0 && (
          <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <Alert severity="info" variant="outlined" sx={{ border: 'none' }}>
              Products are sorted by expiration date. Select products expiring soon first to minimize waste.
            </Alert>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
