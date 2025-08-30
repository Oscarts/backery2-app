import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Restaurant as RecipeIcon,
  Calculate as CalculateIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Recipe,
  Category,
  RawMaterial,
  IntermediateProduct,
  CreateRecipeData,
  RecipeCostAnalysis,
  WhatCanIMakeAnalysis,
  Unit
} from '../types';
import {
  recipesApi,
  categoriesApi,
  rawMaterialsApi,
  intermediateProductsApi,
  unitsApi
} from '../services/realApi';
import { formatDate, formatQuantity, formatCurrency } from '../utils/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`recipe-tabpanel-${index}`}
      aria-labelledby={`recipe-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Recipes: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeForCost, setSelectedRecipeForCost] = useState<string | null>(null);
  const [selectedRecipeForIngredients, setSelectedRecipeForIngredients] = useState<string | null>(null);
  const [ingredientsDialogOpen, setIngredientsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateRecipeData>({
    name: '',
    description: '',
    categoryId: '',
    yieldQuantity: 1,
    yieldUnit: '',
    prepTime: 0,
    cookTime: 0,
    instructions: [],
    ingredients: [],
    isActive: true
  });
  const [ingredientForm, setIngredientForm] = useState({
    type: 'raw', // 'raw' or 'intermediate'
    itemId: '',
    quantity: 0,
    unit: '',
    notes: ''
  });
  const [instructionText, setInstructionText] = useState('');

  // Fetch data
  const { data: recipesResponse, isLoading: recipesLoading, refetch: refetchRecipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => recipesApi.getAll(),
    staleTime: 0 // Force refetch on each render
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll()
  });

  const { data: rawMaterialsResponse } = useQuery({
    queryKey: ['raw-materials'],
    queryFn: () => rawMaterialsApi.getAll()
  });

  const { data: intermediateProductsResponse } = useQuery({
    queryKey: ['intermediate-products'],
    queryFn: () => intermediateProductsApi.getAll()
  });

  const { data: unitsResponse } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitsApi.getAll()
  });

  const { data: whatCanIMakeResponse } = useQuery({
    queryKey: ['what-can-i-make'],
    queryFn: () => recipesApi.getWhatCanIMake(),
    enabled: currentTab === 1
  });

  const { data: recipeCostResponse } = useQuery({
    queryKey: ['recipe-cost', selectedRecipeForCost],
    queryFn: () => recipesApi.getCost(selectedRecipeForCost!),
    enabled: !!selectedRecipeForCost
  });

  // Query for selected recipe details
  const { data: selectedRecipeDetailsResponse } = useQuery({
    queryKey: ['recipe-details', selectedRecipeForIngredients],
    queryFn: () => recipesApi.getById(selectedRecipeForIngredients!),
    enabled: !!selectedRecipeForIngredients
  });

  // Mutations
  const createRecipeMutation = useMutation({
    mutationFn: (data: CreateRecipeData) => recipesApi.create(data),
    onSuccess: async (response) => {
      // Check if the response indicates success
      if (!response || !response.success) {
        console.error('Recipe creation failed:', response);
        alert(response.error || 'Failed to create recipe');
        return;
      }

      // First invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      await queryClient.invalidateQueries({ queryKey: ['what-can-i-make'] });

      // Then force refetch to ensure we have the latest data
      await refetchRecipes();

      // Finally close the dialog
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('Error creating recipe:', error);
      alert(`Recipe creation failed: ${error.message || 'Unknown error'}`);
    }
  });

  const updateRecipeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRecipeData> }) =>
      recipesApi.update(id, data),
    onSuccess: async (response) => {
      if (!response || !response.success) {
        console.error('Recipe update failed:', response);
        alert(response.error || 'Failed to update recipe');
        return;
      }

      // First invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      await queryClient.invalidateQueries({ queryKey: ['what-can-i-make'] });

      // Then force refetch to ensure we have the latest data
      await refetchRecipes();

      // Finally close the dialog
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('Error updating recipe:', error);
      alert(`Recipe update failed: ${error.message || 'Unknown error'}`);
    }
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: (id: string) => recipesApi.delete(id),
    onSuccess: async (response) => {
      if (!response || !response.success) {
        console.error('Recipe deletion failed:', response);
        alert(response.error || 'Failed to delete recipe');
        return;
      }

      // First invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      await queryClient.invalidateQueries({ queryKey: ['what-can-i-make'] });

      // Then force refetch to ensure we have the latest data
      await refetchRecipes();
    },
    onError: (error: any) => {
      console.error('Error deleting recipe:', error);
      alert(`Recipe deletion failed: ${error.message || 'Unknown error'}`);
    }
  });

  // Data processing from API responses
  const recipes: Recipe[] = recipesResponse?.data || [];
  const categories: Category[] = categoriesResponse?.data || [];
  const rawMaterials: RawMaterial[] = rawMaterialsResponse?.data || [];
  const intermediateProducts: IntermediateProduct[] = intermediateProductsResponse?.data || [];
  const units: Unit[] = unitsResponse?.data || [];

  // Handle special case responses
  const whatCanIMake = whatCanIMakeResponse?.data || {
    totalRecipes: 0,
    canMakeCount: 0,
    recipes: []
  } as WhatCanIMakeAnalysis;

  const recipeCost = recipeCostResponse?.data || null;
  const selectedRecipeDetails = selectedRecipeDetailsResponse?.data || null;

  // Debug log to track recipes data
  React.useEffect(() => {
    console.log('Current recipes:', recipes);
  }, [recipes]);

  // Filter categories for recipes (RECIPE type)
  const recipeCategories = categories.filter(cat => cat.type === 'RECIPE');

  // Filter recipes based on search and category
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || recipe.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenDialog = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);

      // Handle instructions - they might come as string, array, or null from JSON field
      let instructions: string[] = [];
      if (recipe.instructions) {
        if (Array.isArray(recipe.instructions)) {
          instructions = recipe.instructions;
        } else if (typeof recipe.instructions === 'string') {
          try {
            const parsed = JSON.parse(recipe.instructions);
            instructions = Array.isArray(parsed) ? parsed : [];
          } catch {
            instructions = [];
          }
        }
      }

      setFormData({
        name: recipe.name,
        description: recipe.description || '',
        categoryId: recipe.categoryId,
        yieldQuantity: recipe.yieldQuantity,
        yieldUnit: recipe.yieldUnit,
        prepTime: recipe.prepTime || 0,
        cookTime: recipe.cookTime || 0,
        instructions: instructions,
        ingredients: recipe.ingredients?.map(ing => ({
          rawMaterialId: ing.rawMaterialId,
          intermediateProductId: ing.intermediateProductId,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes
        })) || [],
        isActive: recipe.isActive
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        yieldQuantity: 1,
        yieldUnit: '',
        prepTime: 0,
        cookTime: 0,
        instructions: [],
        ingredients: [],
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRecipe(null);
    setInstructionText('');
    setIngredientForm({
      type: 'raw',
      itemId: '',
      quantity: 0,
      unit: '',
      notes: ''
    });
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name) {
      alert('Recipe name is required');
      return;
    }

    if (!formData.categoryId) {
      alert('Category is required');
      return;
    }

    if (!formData.yieldQuantity || formData.yieldQuantity <= 0) {
      alert('Valid yield quantity is required');
      return;
    }

    if (!formData.yieldUnit) {
      alert('Yield unit is required');
      return;
    }

    // Ensure instructions is always an array
    const dataToSubmit = {
      ...formData,
      instructions: Array.isArray(formData.instructions) ? formData.instructions : [],
      // Make sure ingredients is always an array
      ingredients: Array.isArray(formData.ingredients) ? formData.ingredients : []
    };

    // Log what we're about to send
    console.log('Submitting recipe data:', dataToSubmit);

    if (editingRecipe) {
      updateRecipeMutation.mutate({ id: editingRecipe.id, data: dataToSubmit });
    } else {
      createRecipeMutation.mutate(dataToSubmit);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      deleteRecipeMutation.mutate(id);
    }
  };

  const addInstruction = () => {
    if (instructionText.trim()) {
      setFormData(prev => ({
        ...prev,
        instructions: [...(prev.instructions || []), instructionText.trim()]
      }));
      setInstructionText('');
    }
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions?.filter((_, i) => i !== index) || []
    }));
  };

  const addIngredient = () => {
    // Now we only check for itemId and quantity since unit is automatically set
    if (ingredientForm.itemId && ingredientForm.quantity > 0) {
      const newIngredient = {
        [ingredientForm.type === 'raw' ? 'rawMaterialId' : 'intermediateProductId']: ingredientForm.itemId,
        quantity: ingredientForm.quantity,
        unit: ingredientForm.unit, // Unit is now automatically set when an item is selected
        notes: ingredientForm.notes
      };

      setFormData(prev => ({
        ...prev,
        ingredients: [...(prev.ingredients || []), newIngredient]
      }));

      setIngredientForm({
        type: 'raw',
        itemId: '',
        quantity: 0,
        unit: '',
        notes: ''
      });
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index) || []
    }));
  };

  const getIngredientName = (ingredient: any) => {
    if (ingredient.rawMaterialId) {
      const rawMaterial = rawMaterials.find(rm => rm.id === ingredient.rawMaterialId);
      return rawMaterial?.name || 'Unknown Raw Material';
    } else if (ingredient.intermediateProductId) {
      const intermediate = intermediateProducts.find(ip => ip.id === ingredient.intermediateProductId);
      return intermediate?.name || 'Unknown Intermediate Product';
    }
    return 'Unknown Ingredient';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (recipesLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading recipes...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <RecipeIcon color="primary" />
        Recipe Management
      </Typography>

      <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Recipes" />
        <Tab label="What Can I Make?" />
        <Tab label="Cost Analysis" />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        {/* Recipe Management Tab */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search recipes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {recipeCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              fullWidth
            >
              Add Recipe
            </Button>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Yield</TableCell>
                <TableCell>Prep Time</TableCell>
                <TableCell>Cook Time</TableCell>
                <TableCell>Ingredients</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{recipe.name}</Typography>
                    {recipe.description && (
                      <Typography variant="body2" color="textSecondary">
                        {recipe.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {recipe.category?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {recipe.yieldQuantity} {recipe.yieldUnit}
                  </TableCell>
                  <TableCell>
                    {recipe.prepTime ? `${recipe.prepTime} min` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {recipe.cookTime ? `${recipe.cookTime} min` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${recipe.ingredients?.length || 0} ingredients`}
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={recipe.isActive ? 'Active' : 'Inactive'}
                      color={recipe.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedRecipeForCost(recipe.id)}
                      title="View Cost"
                    >
                      <CalculateIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(recipe)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(recipe.id)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* What Can I Make Tab */}
        {whatCanIMake && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                You can make {whatCanIMake.canMakeCount} out of {whatCanIMake.totalRecipes} recipes
              </Alert>
            </Grid>

            {whatCanIMake.recipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={recipe.recipeId}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      bgcolor: 'background.default'
                    }
                  }}
                  onClick={() => {
                    setSelectedRecipeForIngredients(recipe.recipeId);
                    setIngredientsDialogOpen(true);
                  }}
                >
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    flexGrow: 1,
                    height: '100%',
                    pb: 1 // Reduce padding at bottom for status indicator
                  }}>
                    {/* Recipe name */}
                    <Typography variant="h6" gutterBottom>
                      {recipe.recipeName}
                    </Typography>
                    
                    {/* Essential information in a compact layout */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      {/* Left column: Category */}
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Category
                        </Typography>
                        <Typography variant="body2" noWrap>
                          {recipe.category}
                        </Typography>
                      </Grid>
                      
                      {/* Right column: Yield per batch */}
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Yield per Batch
                        </Typography>
                        <Typography variant="body2">
                          {recipe.yieldQuantity} {recipe.yieldUnit}
                        </Typography>
                      </Grid>
                    </Grid>

                    {recipe.canMake ? (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Production Capacity
                        </Typography>
                        <Typography variant="body2">
                          <strong>{recipe.maxBatches}</strong> batches ({recipe.maxBatches * recipe.yieldQuantity} {recipe.yieldUnit} total)
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Missing Ingredients
                        </Typography>
                        {recipe.missingIngredients.length > 0 ? (
                          <Box sx={{ maxHeight: '120px', overflow: 'auto' }}>
                            {recipe.missingIngredients.map((missing, index) => (
                              <Box key={index} sx={{ mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {missing.name}
                                </Typography>
                                <Typography variant="caption" color="error.main">
                                  Need {missing.needed}, have {missing.available}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2">None</Typography>
                        )}
                      </Box>
                    )}
                    
                    {/* Clear status indicator */}
                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Chip
                        label={recipe.canMake ? "Ready to Make" : "Cannot Make"}
                        color={recipe.canMake ? "success" : "error"}
                        size="small"
                        variant="outlined"
                        sx={{ width: '100%', justifyContent: 'center' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Cost Analysis Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Recipe</InputLabel>
              <Select
                value={selectedRecipeForCost || ''}
                label="Select Recipe"
                onChange={(e) => setSelectedRecipeForCost(e.target.value)}
              >
                {recipes.map((recipe) => (
                  <MenuItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {recipeCost && recipeCost.recipeName && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cost Analysis: {recipeCost.recipeName}
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="textSecondary">
                        Total Cost
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(recipeCost.totalCost)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="textSecondary">
                        Cost per Unit
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(recipeCost.costPerUnit)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="textSecondary">
                        Yield
                      </Typography>
                      <Typography variant="h6">
                        {recipeCost.yieldQuantity} {recipeCost.yieldUnit}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="textSecondary">
                        Can Make
                      </Typography>
                      <Chip
                        label={recipeCost.canMakeRecipe ? 'Yes' : 'No'}
                        color={recipeCost.canMakeRecipe ? 'success' : 'error'}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="h6" gutterBottom>
                    Ingredient Breakdown
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ingredient</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit Cost</TableCell>
                          <TableCell>Total Cost</TableCell>
                          <TableCell>Available</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recipeCost.ingredientCosts.map((ingredient) => (
                          <TableRow key={ingredient.ingredientId}>
                            <TableCell>{ingredient.name}</TableCell>
                            <TableCell>
                              {ingredient.quantity} {ingredient.unit}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(ingredient.unitCost)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(ingredient.totalCost)}
                            </TableCell>
                            <TableCell>
                              {ingredient.availableQuantity} {ingredient.unit}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={ingredient.canMake ? 'Available' : 'Insufficient'}
                                color={ingredient.canMake ? 'success' : 'error'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Recipe Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recipe Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel shrink={!formData.categoryId ? true : undefined}>Category</InputLabel>
                <Select
                  value={formData.categoryId}
                  label="Category"
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Select a category</em>
                  </MenuItem>
                  {recipeCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
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
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Yield Quantity"
                type="number"
                value={formData.yieldQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, yieldQuantity: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel shrink={!formData.yieldUnit ? true : undefined}>Yield Unit</InputLabel>
                <Select
                  value={formData.yieldUnit}
                  label="Yield Unit"
                  onChange={(e) => setFormData(prev => ({ ...prev, yieldUnit: e.target.value }))}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Select a unit</em>
                  </MenuItem>
                  {units.map((unit) => (
                    <MenuItem key={unit.id} value={unit.symbol}>
                      {unit.name} ({unit.symbol})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Prep Time (min)"
                type="number"
                value={formData.prepTime}
                onChange={(e) => setFormData(prev => ({ ...prev, prepTime: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Cook Time (min)"
                type="number"
                value={formData.cookTime}
                onChange={(e) => setFormData(prev => ({ ...prev, cookTime: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active Recipe"
              />
            </Grid>

            {/* Instructions Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Instructions</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add instruction step"
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInstruction()}
                />
                <Button onClick={addInstruction} variant="outlined">Add</Button>
              </Box>
              <List>
                {(formData.instructions && Array.isArray(formData.instructions) ? formData.instructions : []).map((instruction, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${index + 1}. ${instruction}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => removeInstruction(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Ingredients Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Ingredients</Typography>

              {/* Current Ingredients List */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Added Ingredients ({formData.ingredients?.length || 0})
                </Typography>
                {formData.ingredients && formData.ingredients.length > 0 ? (
                  <Paper elevation={1} sx={{ p: 1 }}>
                    <List dense>
                      {formData.ingredients.map((ingredient, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight="medium">
                                {getIngredientName(ingredient)}
                              </Typography>
                            }
                            secondary={`${ingredient.quantity} ${ingredient.unit}${ingredient.notes ? ` - ${ingredient.notes}` : ''}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton size="small" onClick={() => removeIngredient(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No ingredients added yet
                  </Typography>
                )}
              </Box>

              {/* Add Ingredient Form */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Add New Ingredient
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={3}>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={ingredientForm.type}
                        label="Type"
                        onChange={(e) => setIngredientForm(prev => ({
                          ...prev,
                          type: e.target.value,
                          itemId: ''
                        }))}
                      >
                        <MenuItem value="raw">Raw Material</MenuItem>
                        <MenuItem value="intermediate">Intermediate Product</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={3}>
                    <FormControl fullWidth>
                      <InputLabel shrink={!ingredientForm.itemId ? true : undefined}>Item</InputLabel>
                      <Select
                        value={ingredientForm.itemId}
                        label="Item"
                        onChange={(e) => {
                          const itemId = e.target.value;
                          let unit = '';

                          // If an item is selected, automatically set the unit based on the item type
                          if (itemId) {
                            if (ingredientForm.type === 'raw') {
                              // Find the selected raw material
                              const selectedRawMaterial = rawMaterials.find(item => item.id === itemId);
                              if (selectedRawMaterial) {
                                unit = selectedRawMaterial.unit;
                              }
                            } else {
                              // Find the selected intermediate product
                              const selectedIntermediateProduct = intermediateProducts.find(item => item.id === itemId);
                              if (selectedIntermediateProduct) {
                                unit = selectedIntermediateProduct.unit;
                              }
                            }
                          }

                          setIngredientForm(prev => ({
                            ...prev,
                            itemId: itemId,
                            unit: unit // Automatically set the unit
                          }));
                        }}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Select an item</em>
                        </MenuItem>
                        {ingredientForm.type === 'raw'
                          ? rawMaterials.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name} ({item.unit})
                            </MenuItem>
                          ))
                          : intermediateProducts.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name} ({item.unit})
                            </MenuItem>
                          ))
                        }
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={ingredientForm.quantity}
                      onChange={(e) => setIngredientForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      label="Unit"
                      value={ingredientForm.unit}
                      InputProps={{
                        readOnly: !!ingredientForm.itemId, // Make read-only when an item is selected
                      }}
                      disabled={!!ingredientForm.itemId} // Disable when an item is selected
                      helperText={ingredientForm.itemId ? "Unit is determined by selected item" : ""}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button onClick={addIngredient} variant="outlined" fullWidth>
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
          {(createRecipeMutation.isError || updateRecipeMutation.isError) && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
              Error: {(createRecipeMutation.error as Error)?.message || (updateRecipeMutation.error as Error)?.message || 'Failed to save recipe'}
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={handleCloseDialog} sx={{ mr: 1 }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={createRecipeMutation.isPending || updateRecipeMutation.isPending}
            >
              {createRecipeMutation.isPending || updateRecipeMutation.isPending
                ? 'Processing...'
                : editingRecipe ? 'Update' : 'Create'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Recipe Ingredients Dialog */}
      <Dialog
        open={ingredientsDialogOpen}
        onClose={() => {
          setIngredientsDialogOpen(false);
          setSelectedRecipeForIngredients(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Recipe Ingredients
          <IconButton
            aria-label="close"
            onClick={() => {
              setIngredientsDialogOpen(false);
              setSelectedRecipeForIngredients(null);
            }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRecipeDetails ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedRecipeDetails.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {selectedRecipeDetails.category?.name || 'Unknown Category'} • {selectedRecipeDetails.yieldQuantity} {selectedRecipeDetails.yieldUnit}
              </Typography>
              {selectedRecipeDetails.description && (
                <Typography variant="body1" paragraph>
                  {selectedRecipeDetails.description}
                </Typography>
              )}

              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                Ingredients Needed:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ingredient</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Available</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRecipeDetails.ingredients?.map((ingredient) => {
                      const isRawMaterial = !!ingredient.rawMaterialId;
                      const ingredientItem = isRawMaterial
                        ? ingredient.rawMaterial
                        : ingredient.intermediateProduct;

                      const availableQuantity = ingredientItem?.quantity || 0;
                      const hasEnough = availableQuantity >= ingredient.quantity;

                      return (
                        <TableRow key={ingredient.id}>
                          <TableCell>
                            {getIngredientName(ingredient)}
                          </TableCell>
                          <TableCell>
                            {isRawMaterial ? 'Raw Material' : 'Intermediate Product'}
                          </TableCell>
                          <TableCell>
                            {ingredient.quantity} {ingredient.unit}
                          </TableCell>
                          <TableCell>
                            {availableQuantity} {ingredient.unit}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={hasEnough ? 'Available' : 'Insufficient'}
                              color={hasEnough ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell>
                            {ingredient.notes || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {selectedRecipeDetails.instructions && Array.isArray(selectedRecipeDetails.instructions) && selectedRecipeDetails.instructions.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 3, fontWeight: 'bold' }}>
                    Instructions:
                  </Typography>
                  <List>
                    {selectedRecipeDetails.instructions.map((instruction, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={`${idx + 1}. ${instruction}`} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              <Typography variant="subtitle1" sx={{ mt: 2, color: 'text.secondary' }}>
                Time Required: {selectedRecipeDetails.prepTime || 0} min prep + {selectedRecipeDetails.cookTime || 0} min cooking
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Loading recipe details...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIngredientsDialogOpen(false);
              setSelectedRecipeForIngredients(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recipes;
