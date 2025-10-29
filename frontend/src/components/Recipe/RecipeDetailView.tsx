import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Restaurant as RestaurantIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  Settings as SettingsIcon,
  Photo as PhotoIcon,
  Edit as EditIcon,
  MonetizationOn as MoneyIcon,
  Inventory as InventoryIcon,
  LocalOffer as PriceTagIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { Recipe, IngredientCost } from '../../types';

interface RecipeDetailViewProps {
  open: boolean;
  recipe: Recipe | null;
  recipeCost: any; // Recipe cost breakdown from API
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onUpdateOverhead: (recipeId: string, overheadPercentage: number) => void;
}

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({
  open,
  recipe,
  recipeCost,
  onClose,
  onEdit,
  onUpdateOverhead
}) => {
  const theme = useTheme();
  const [overheadPercentage, setOverheadPercentage] = useState(20);
  const [showOverheadSettings, setShowOverheadSettings] = useState(false);

  useEffect(() => {
    if (recipe?.overheadPercentage) {
      setOverheadPercentage(recipe.overheadPercentage);
    }
  }, [recipe]);

  if (!recipe) return null;

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const materialCost = recipeCost?.totalMaterialCost || 0;
  const calculatedOverheadCost = (materialCost * overheadPercentage) / 100;
  const totalCost = materialCost + calculatedOverheadCost;
  const costPerUnit = recipe.yieldQuantity > 0 ? totalCost / recipe.yieldQuantity : 0;

  const profitabilityScore = totalCost > 0 ? Math.min(100, (totalCost / 10) * 100) : 0;

  const handleOverheadChange = (newValue: number) => {
    setOverheadPercentage(newValue);
  };

  const handleSaveOverhead = () => {
    onUpdateOverhead(recipe.id, overheadPercentage);
    setShowOverheadSettings(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: alpha(theme.palette.common.white, 0.2),
              backdropFilter: 'blur(10px)'
            }}
          >
            {recipe.emoji || recipe.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              {recipe.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {recipe.category?.name || 'Uncategorized'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => onEdit(recipe)}
            sx={{ color: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) }}
          >
            <EditIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Grid container>
          {/* Left Panel - Recipe Info */}
          <Grid item xs={12} md={5}>
            <Box sx={{ p: 3, height: '100%', bgcolor: alpha(theme.palette.grey[50], 0.5) }}>
              {/* Recipe Image */}
              <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: 200,
                    background: recipe.imageUrl
                      ? `url(${recipe.imageUrl})`
                      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {!recipe.imageUrl && (
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: alpha(theme.palette.common.white, 0.2),
                        backdropFilter: 'blur(10px)',
                        fontSize: '2rem'
                      }}
                    >
                      {recipe.emoji || <PhotoIcon fontSize="large" />}
                    </Avatar>
                  )}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: alpha(theme.palette.common.white, 0.9),
                      '&:hover': { bgcolor: theme.palette.common.white }
                    }}
                  >
                    <PhotoIcon />
                  </IconButton>
                </Box>
              </Card>

              {/* Recipe Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <RestaurantIcon color="primary" sx={{ mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {recipe.yieldQuantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recipe.yieldUnit}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <ScheduleIcon color="info" sx={{ mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {totalTime || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      minutes
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Recipe Details */}
              <Card sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PieChartIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Recipe Details
                  </Typography>
                </Box>
                
                {recipe.difficulty && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Difficulty:</Typography>
                    <Chip
                      label={recipe.difficulty}
                      size="small"
                      color={
                        recipe.difficulty === 'EASY' ? 'success' :
                        recipe.difficulty === 'MEDIUM' ? 'warning' : 'error'
                      }
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Ingredients:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(recipe.ingredients || []).length} items
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Version:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    v{recipe.version}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Status:</Typography>
                  <Chip
                    label={recipe.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={recipe.isActive ? 'success' : 'default'}
                  />
                </Box>
              </Card>

              {/* Description */}
              {recipe.description && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recipe.description}
                  </Typography>
                </Card>
              )}
            </Box>
          </Grid>

          {/* Right Panel - Cost Analysis */}
          <Grid item xs={12} md={7}>
            <Box sx={{ p: 3 }}>
              {/* Cost Overview Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <MoneyIcon sx={{ color: theme.palette.success.main, mb: 1 }} />
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {formatCurrency(materialCost)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Material Cost
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                    <SettingsIcon sx={{ color: theme.palette.warning.main, mb: 1 }} />
                    <Typography variant="h6" color="warning.main" fontWeight="bold">
                      {formatCurrency(calculatedOverheadCost)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overhead ({overheadPercentage}%)
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <PriceTagIcon sx={{ color: theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {formatCurrency(totalCost)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Cost
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                    <ReceiptIcon sx={{ color: theme.palette.info.main, mb: 1 }} />
                    <Typography variant="h6" color="info.main" fontWeight="bold">
                      {formatCurrency(costPerUnit)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cost per {recipe.yieldUnit}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Overhead Configuration */}
              <Card sx={{ mb: 3, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SettingsIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Overhead Configuration
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => setShowOverheadSettings(!showOverheadSettings)}
                    startIcon={<SettingsIcon />}
                  >
                    Adjust
                  </Button>
                </Box>

                {showOverheadSettings && (
                  <Box sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5), p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Adjust the overhead percentage for labor, utilities, and equipment costs:
                    </Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider
                        value={overheadPercentage}
                        onChange={(_, value) => handleOverheadChange(value as number)}
                        min={0}
                        max={100}
                        step={5}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 20, label: '20%' },
                          { value: 50, label: '50%' },
                          { value: 100, label: '100%' }
                        ]}
                        valueLabelDisplay="on"
                        valueLabelFormat={(value) => `${value}%`}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button size="small" onClick={handleSaveOverhead} variant="contained">
                        Save
                      </Button>
                      <Button size="small" onClick={() => setShowOverheadSettings(false)}>
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}

                <Typography variant="body2" color="text.secondary">
                  Current overhead rate: <strong>{overheadPercentage}%</strong> of material cost
                </Typography>
              </Card>

              {/* Profitability Indicator */}
              <Card sx={{ mb: 3, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Profitability Analysis
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(profitabilityScore, 100)}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    mb: 1,
                    bgcolor: alpha(theme.palette.grey[300], 0.3),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      bgcolor: profitabilityScore > 70 
                        ? theme.palette.success.main
                        : profitabilityScore > 40 
                        ? theme.palette.warning.main 
                        : theme.palette.error.main
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Profitability Score: <strong>{Math.round(profitabilityScore)}%</strong>
                </Typography>
              </Card>

              {/* Ingredients Cost Breakdown */}
              {recipeCost?.ingredients && recipeCost.ingredients.length > 0 && (
                <Card sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <InventoryIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        Ingredient Cost Breakdown
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Ingredient</TableCell>
                            <TableCell align="center">Type</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Unit Cost</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recipeCost.ingredients.map((ingredient: IngredientCost, index: number) => (
                            <TableRow key={ingredient.id || index}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {ingredient.name}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={ingredient.type === 'RAW_MATERIAL' ? 'Raw' : 'Finished'}
                                  size="small"
                                  color={ingredient.type === 'RAW_MATERIAL' ? 'primary' : 'secondary'}
                                />
                              </TableCell>
                              <TableCell align="right">
                                {ingredient.quantity} {ingredient.unit}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(ingredient.unitCost)}
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(ingredient.totalCost)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha(theme.palette.grey[50], 0.5) }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button onClick={() => onEdit(recipe)} variant="contained" startIcon={<EditIcon />}>
          Edit Recipe
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecipeDetailView;