import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  List,
  ListItem,
  useTheme,
  alpha,
  Fade,
  LinearProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  PhotoCamera as CameraIcon,
  Preview as PreviewIcon,
  Calculate as CalculateIcon,
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  Schedule as TimeIcon,
  Restaurant as YieldIcon,
  LocalOffer as CostIcon
} from '@mui/icons-material';
import { Recipe, Category, RawMaterial, FinishedProduct, Unit } from '../../types';

interface EnhancedRecipeFormProps {
  open: boolean;
  recipe: Recipe | null;
  categories: Category[];
  rawMaterials: RawMaterial[];
  finishedProducts: FinishedProduct[];
  units: Unit[];
  onClose: () => void;
  onSave: (recipeData: any) => void;
  onCalculateCost?: (recipeData: any) => Promise<any>;
}

interface FormData {
  name: string;
  description: string;
  categoryId: string;
  yieldQuantity: number;
  yieldUnit: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  emoji: string;
  imageUrl: string;
  overheadPercentage: number;
  ingredients: Array<{
    id?: string;
    ingredientType: 'RAW' | 'FINISHED';
    ingredientId: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
}

const difficultyOptions = [
  { value: 'EASY', label: 'Easy', color: 'success', icon: '😊' },
  { value: 'MEDIUM', label: 'Medium', color: 'warning', icon: '🤔' },
  { value: 'HARD', label: 'Hard', color: 'error', icon: '😰' }
] as const;

export const EnhancedRecipeForm: React.FC<EnhancedRecipeFormProps> = ({
  open,
  recipe,
  categories,
  rawMaterials,
  finishedProducts,
  units,
  onClose,
  onSave,
  onCalculateCost
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    categoryId: '',
    yieldQuantity: 1,
    yieldUnit: '',
    prepTime: 0,
    cookTime: 0,
    difficulty: 'MEDIUM',
    emoji: '',
    imageUrl: '',
    overheadPercentage: 20,
    ingredients: []
  });
  const [costPreview, setCostPreview] = useState<any>(null);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        description: recipe.description || '',
        categoryId: recipe.categoryId,
        yieldQuantity: recipe.yieldQuantity,
        yieldUnit: recipe.yieldUnit,
        prepTime: recipe.prepTime || 0,
        cookTime: recipe.cookTime || 0,
        difficulty: recipe.difficulty || 'MEDIUM',
        emoji: recipe.emoji || '',
        imageUrl: recipe.imageUrl || '',
        overheadPercentage: recipe.overheadPercentage || 20,
        ingredients: (recipe.ingredients || []).map(ing => ({
          id: ing.id,
          ingredientType: ing.rawMaterialId ? 'RAW' : 'FINISHED',
          ingredientId: ing.rawMaterialId || ing.finishedProductId || '',
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || ''
        }))
      });
      setImagePreview(recipe.imageUrl || '');
    } else {
      // Reset form for new recipe
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        yieldQuantity: 1,
        yieldUnit: '',
        prepTime: 0,
        cookTime: 0,
        difficulty: 'MEDIUM',
        emoji: '',
        imageUrl: '',
        overheadPercentage: 20,
        ingredients: []
      });
      setImagePreview('');
      setCostPreview(null);
      setActiveStep(0);
    }
  }, [recipe, open]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        handleInputChange('imageUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, {
        ingredientType: 'RAW',
        ingredientId: '',
        quantity: 1,
        unit: '',
        notes: ''
      }]
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => {
        if (i !== index) return ing;
        
        const updated = { ...ing, [field]: value };
        
        // Auto-populate unit when ingredient is selected
        if (field === 'ingredientId' || field === 'ingredientType') {
          const ingredientId = field === 'ingredientId' ? value : ing.ingredientId;
          const ingredientType = field === 'ingredientType' ? value : ing.ingredientType;
          
          if (ingredientId && ingredientType) {
            let unit = '';
            if (ingredientType === 'RAW') {
              const rm = rawMaterials.find(r => r.id === ingredientId);
              unit = rm?.unit || '';
            } else {
              const fp = finishedProducts.find(f => f.id === ingredientId);
              unit = fp?.unit || '';
            }
            updated.unit = unit;
          }
        }
        
        return updated;
      })
    }));
  };

  const calculateCost = async () => {
    if (!onCalculateCost) return;
    
    setIsCalculatingCost(true);
    try {
      const result = await onCalculateCost(formData);
      setCostPreview(result);
    } catch (error) {
      console.error('Cost calculation failed:', error);
    } finally {
      setIsCalculatingCost(false);
    }
  };

  const handleSave = () => {
    // Transform ingredients from UI format to backend format
    const dataToSubmit = {
      ...formData,
      ingredients: formData.ingredients.map(ing => ({
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes || '',
        // Convert ingredientId to the correct field based on type
        ...(ing.ingredientType === 'RAW' 
          ? { rawMaterialId: ing.ingredientId }
          : { finishedProductId: ing.ingredientId }
        )
      }))
    };
    
    console.log('🚀 Submitting recipe with transformed ingredients:', JSON.stringify(dataToSubmit.ingredients, null, 2));
    onSave(dataToSubmit);
  };

  const isValid = formData.name && formData.categoryId && formData.yieldQuantity > 0;

  const steps = [
    'Basic Information',
    'Recipe Details',
    'Ingredients',
    'Cost & Preview'
  ];

  const totalTime = formData.prepTime + formData.cookTime;
  const materialCost = costPreview?.totalMaterialCost || 0;
  const overheadCost = (materialCost * formData.overheadPercentage) / 100;
  const totalCost = materialCost + overheadCost;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '95vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.common.white, 0.2),
              backdropFilter: 'blur(10px)'
            }}
          >
            {formData.emoji || (recipe ? <PreviewIcon /> : <AddIcon />)}
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            {recipe ? 'Edit Recipe' : 'Create New Recipe'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Grid container sx={{ height: '70vh' }}>
          {/* Left Panel - Form Steps */}
          <Grid item xs={12} md={8}>
            <Box sx={{ p: 3 }}>
              {/* Step Navigation */}
              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel
                      onClick={() => setActiveStep(index)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Step Content */}
              <Box sx={{ minHeight: 400 }}>
                {/* Step 0: Basic Information */}
                {activeStep === 0 && (
                  <Fade in>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <TrophyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        Basic Recipe Information
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Recipe Name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                            variant="outlined"
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                  borderColor: theme.palette.primary.main
                                }
                              }
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth required>
                            <InputLabel>Category</InputLabel>
                            <Select
                              value={formData.categoryId}
                              label="Category"
                              onChange={(e) => handleInputChange('categoryId', e.target.value)}
                            >
                              {categories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                  {category.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Difficulty</InputLabel>
                            <Select
                              value={formData.difficulty}
                              label="Difficulty"
                              onChange={(e) => handleInputChange('difficulty', e.target.value)}
                            >
                              {difficultyOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{option.icon}</span>
                                    {option.label}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Describe your recipe..."
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Recipe Emoji (optional)"
                            value={formData.emoji}
                            onChange={(e) => handleInputChange('emoji', e.target.value)}
                            placeholder="🍞"
                            inputProps={{ maxLength: 2 }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Fade>
                )}

                {/* Step 1: Recipe Details */}
                {activeStep === 1 && (
                  <Fade in>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <YieldIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        Recipe Details & Timing
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Yield Quantity"
                            type="number"
                            value={formData.yieldQuantity}
                            onChange={(e) => handleInputChange('yieldQuantity', Number(e.target.value))}
                            required
                            inputProps={{ min: 0.1, step: 0.1 }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth required>
                            <InputLabel>Yield Unit</InputLabel>
                            <Select
                              value={formData.yieldUnit}
                              label="Yield Unit"
                              onChange={(e) => handleInputChange('yieldUnit', e.target.value)}
                            >
                              {units.map((unit) => (
                                <MenuItem key={unit.id} value={unit.name}>
                                  {unit.name} ({unit.symbol})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Prep Time (minutes)"
                            type="number"
                            value={formData.prepTime}
                            onChange={(e) => handleInputChange('prepTime', Number(e.target.value))}
                            inputProps={{ min: 0 }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Cook Time (minutes)"
                            type="number"
                            value={formData.cookTime}
                            onChange={(e) => handleInputChange('cookTime', Number(e.target.value))}
                            inputProps={{ min: 0 }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Card sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <TimeIcon color="info" />
                              <Typography variant="body1">
                                Total Time: <strong>{totalTime} minutes</strong>
                              </Typography>
                            </Box>
                          </Card>
                        </Grid>

                        {/* Image Upload */}
                        <Grid item xs={12}>
                          <Box sx={{ textAlign: 'center' }}>
                            <input
                              accept="image/*"
                              style={{ display: 'none' }}
                              id="recipe-image-upload"
                              type="file"
                              onChange={handleImageUpload}
                            />
                            <label htmlFor="recipe-image-upload">
                              <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CameraIcon />}
                                sx={{ mb: 2 }}
                              >
                                Upload Recipe Image
                              </Button>
                            </label>
                            
                            {imagePreview && (
                              <Box sx={{ mt: 2 }}>
                                <img 
                                  src={imagePreview} 
                                  alt="Recipe preview" 
                                  style={{ 
                                    maxWidth: 200, 
                                    maxHeight: 200, 
                                    borderRadius: 8,
                                    objectFit: 'cover'
                                  }} 
                                />
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Fade>
                )}

                {/* Step 2: Ingredients */}
                {activeStep === 2 && (
                  <Fade in>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                          <AddIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                          Recipe Ingredients ({formData.ingredients.length})
                        </Typography>
                        <Button 
                          onClick={addIngredient} 
                          variant="contained" 
                          startIcon={<AddIcon />}
                          size="small"
                        >
                          Add Ingredient
                        </Button>
                      </Box>

                      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {formData.ingredients.map((ingredient, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              mb: 2,
                              bgcolor: alpha(theme.palette.grey[100], 0.5),
                              borderRadius: 2,
                              flexDirection: 'column',
                              alignItems: 'stretch'
                            }}
                          >
                            <Grid container spacing={2} sx={{ p: 1 }}>
                              <Grid item xs={12} md={3}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Type</InputLabel>
                                  <Select
                                    value={ingredient.ingredientType}
                                    label="Type"
                                    onChange={(e) => updateIngredient(index, 'ingredientType', e.target.value)}
                                  >
                                    <MenuItem value="RAW">Raw Material</MenuItem>
                                    <MenuItem value="FINISHED">Finished Product</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>

                              <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Ingredient</InputLabel>
                                  <Select
                                    value={ingredient.ingredientId}
                                    label="Ingredient"
                                    onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                                  >
                                    {(ingredient.ingredientType === 'RAW' ? rawMaterials : finishedProducts)
                                      .map((item) => (
                                        <MenuItem key={item.id} value={item.id}>
                                          {item.name}
                                        </MenuItem>
                                      ))}
                                  </Select>
                                </FormControl>
                              </Grid>

                              <Grid item xs={6} md={2}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Quantity"
                                  type="number"
                                  value={ingredient.quantity}
                                  onChange={(e) => updateIngredient(index, 'quantity', Number(e.target.value))}
                                  inputProps={{ min: 0.01, step: 0.01 }}
                                />
                              </Grid>

                              <Grid item xs={6} md={2}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Unit"
                                  value={ingredient.unit}
                                  InputProps={{ 
                                    readOnly: true,
                                    style: { backgroundColor: '#f5f5f5', cursor: 'not-allowed' }
                                  }}
                                  disabled
                                  helperText="Auto-filled from ingredient"
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      cursor: 'not-allowed !important'
                                    }
                                  }}
                                />
                              </Grid>

                              <Grid item xs={12} md={1}>
                                <IconButton
                                  onClick={() => removeIngredient(index)}
                                  color="error"
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </ListItem>
                        ))}
                      </List>

                      {formData.ingredients.length === 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Add ingredients to calculate recipe cost and nutrition information.
                        </Alert>
                      )}
                    </Box>
                  </Fade>
                )}

                {/* Step 3: Cost & Preview */}
                {activeStep === 3 && (
                  <Fade in>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <CostIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        Cost Analysis & Preview
                      </Typography>

                      {onCalculateCost && (
                        <Box sx={{ mb: 3 }}>
                          <Button
                            onClick={calculateCost}
                            variant="outlined"
                            startIcon={<CalculateIcon />}
                            disabled={isCalculatingCost || formData.ingredients.length === 0}
                            sx={{ mb: 2 }}
                          >
                            {isCalculatingCost ? 'Calculating...' : 'Calculate Cost'}
                          </Button>

                          {isCalculatingCost && <LinearProgress sx={{ mb: 2 }} />}

                          {costPreview && (
                            <Card sx={{ p: 2, mb: 2 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="success.main">
                                      ${materialCost.toFixed(2)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Material Cost
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="warning.main">
                                      ${overheadCost.toFixed(2)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Overhead ({formData.overheadPercentage}%)
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="primary.main">
                                      ${totalCost.toFixed(2)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Total Cost
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="info.main">
                                      ${(totalCost / formData.yieldQuantity).toFixed(2)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Per {formData.yieldUnit}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Card>
                          )}
                        </Box>
                      )}

                      {/* Overhead Configuration */}
                      <Card sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                          Overhead Configuration
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Adjust overhead percentage for labor, utilities, and equipment costs:
                        </Typography>
                        <Box sx={{ px: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Overhead: {formData.overheadPercentage}%
                          </Typography>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={formData.overheadPercentage}
                            onChange={(e) => handleInputChange('overheadPercentage', Number(e.target.value))}
                            style={{ width: '100%', marginBottom: 16 }}
                          />
                        </Box>
                      </Card>
                    </Box>
                  </Fade>
                )}
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(prev => prev - 1)}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (activeStep === steps.length - 1) {
                      handleSave();
                    } else {
                      setActiveStep(prev => prev + 1);
                    }
                  }}
                  disabled={!isValid}
                >
                  {activeStep === steps.length - 1 ? 'Save Recipe' : 'Next'}
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Right Panel - Live Preview */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              p: 3, 
              bgcolor: alpha(theme.palette.grey[50], 0.5),
              height: '100%',
              borderLeft: `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recipe Preview
              </Typography>
              
              <Card sx={{ mb: 2 }}>
                <Box
                  sx={{
                    height: 150,
                    background: imagePreview
                      ? `url(${imagePreview})`
                      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {!imagePreview && (
                    <Avatar sx={{ 
                      width: 60, 
                      height: 60, 
                      bgcolor: alpha(theme.palette.common.white, 0.2),
                      fontSize: '1.5rem'
                    }}>
                      {formData.emoji || formData.name.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                  {formData.difficulty && (
                    <Chip
                      label={formData.difficulty}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: alpha(
                          difficultyOptions.find(d => d.value === formData.difficulty)?.color === 'success'
                            ? theme.palette.success.main
                            : difficultyOptions.find(d => d.value === formData.difficulty)?.color === 'warning'
                            ? theme.palette.warning.main
                            : theme.palette.error.main,
                          0.9
                        ),
                        color: 'white'
                      }}
                    />
                  )}
                </Box>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                    {formData.name || 'Recipe Name'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {categories.find(c => c.id === formData.categoryId)?.name || 'Category'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      icon={<YieldIcon />}
                      label={`${formData.yieldQuantity} ${formData.yieldUnit || 'units'}`}
                      size="small"
                      color="primary"
                    />
                    {totalTime > 0 && (
                      <Chip
                        icon={<TimeIcon />}
                        label={`${totalTime} min`}
                        size="small"
                        color="info"
                      />
                    )}
                    <Chip
                      label={`${formData.ingredients.length} ingredients`}
                      size="small"
                    />
                  </Box>

                  {costPreview && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        Total Cost: ${totalCost.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${(totalCost / formData.yieldQuantity).toFixed(2)} per {formData.yieldUnit}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {formData.description && (
                <Card sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formData.description}
                  </Typography>
                </Card>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedRecipeForm;