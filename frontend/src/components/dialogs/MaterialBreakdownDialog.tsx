import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  IconButton,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Inventory2 as IngredientIcon,
  AttachMoney as CostIcon,
  Scale as QuantityIcon,
  LocalOffer as SkuIcon,
} from '@mui/icons-material';
import { MaterialBreakdown, MaterialAllocation } from '../../types';

interface MaterialBreakdownDialogProps {
  open: boolean;
  onClose: () => void;
  materialBreakdown: MaterialBreakdown | null;
  loading?: boolean;
  error?: string;
}

const MaterialBreakdownDialog: React.FC<MaterialBreakdownDialogProps> = ({
  open,
  onClose,
  materialBreakdown,
  loading = false,
  error,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity.toFixed(2)} ${unit}`;
  };

  const renderMaterialCard = (allocation: MaterialAllocation, index: number) => (
    <Card key={allocation.id} sx={{ mb: 2, position: 'relative', overflow: 'visible' }}>
      <CardContent sx={{ pb: 1 }}>
        {/* Material Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <IngredientIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {allocation.materialName}
            </Typography>
          </Box>
          <Chip 
            label={`#${index + 1}`} 
            size="small" 
            variant="outlined" 
            color="primary" 
          />
        </Box>

        {/* Material Info Grid */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6} sm={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <SkuIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  SKU
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {allocation.materialSku}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <SkuIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Batch
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {allocation.materialBatchNumber || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <QuantityIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Used Quantity
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatQuantity(allocation.quantityConsumed || allocation.quantityAllocated, allocation.unit)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <CostIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Cost
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {formatCurrency(allocation.totalCost)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Unit Cost Info */}
        <Box mt={2} p={1} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="caption" color="text.secondary">
            Unit Cost: {formatCurrency(allocation.unitCost)}/{allocation.unit}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const renderSkeleton = () => (
    <Box>
      {[1, 2, 3].map((i) => (
        <Card key={i} sx={{ mb: 2 }}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={32} />
            <Box mt={2}>
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((j) => (
                  <Grid item xs={6} sm={3} key={j}>
                    <Skeleton variant="text" width="40%" height={20} />
                    <Skeleton variant="text" width="80%" height={24} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '90vh' }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" component="div" fontWeight="bold">
              Material Breakdown
            </Typography>
            {materialBreakdown && (
              <Typography variant="body2" color="text.secondary">
                {materialBreakdown.finishedProduct.name}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && renderSkeleton()}

        {!loading && !error && materialBreakdown && (
          <Box>
            {/* Summary Card */}
            <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Production Cost Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Total Materials
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {materialBreakdown.materials.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Material Cost
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(materialBreakdown.summary.totalMaterialCost)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Cost Per Unit
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(materialBreakdown.summary.costPerUnit)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Total Cost
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(materialBreakdown.summary.totalProductionCost)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Ingredient Details
              </Typography>
            </Divider>

            {/* Material Cards */}
            {materialBreakdown.materials.map((allocation, index) => 
              renderMaterialCard(allocation, index)
            )}
          </Box>
        )}

        {!loading && !error && !materialBreakdown && (
          <Alert severity="info">
            No material breakdown data available for this product.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialBreakdownDialog;