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
  Calculate as CalculateIcon
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

// Generic API helper
const api = {
  get: async (url: string) => {
    const response = await fetch(`http://localhost:8000/api${url}`);
    return response.json();
  },
  post: async (url: string, data: any) => {
    const response = await fetch(`http://localhost:8000/api${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  put: async (url: string, data: any) => {
    const response = await fetch(`http://localhost:8000/api${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  delete: async (url: string) => {
    const response = await fetch(`http://localhost:8000/api${url}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};

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
  const { data: recipesResponse, isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => api.get('/recipes')
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories')
  });

  const { data: rawMaterialsResponse } = useQuery({
    queryKey: ['raw-materials'],
    queryFn: () => api.get('/raw-materials')
  });

  const { data: intermediateProductsResponse } = useQuery({
    queryKey: ['intermediate-products'],
    queryFn: () => api.get('/intermediate-products')
  });

  const { data: unitsResponse } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.get('/units')
  });

  const { data: whatCanIMakeResponse } = useQuery({
    queryKey: ['what-can-i-make'],
    queryFn: () => api.get('/recipes/what-can-i-make'),
    enabled: currentTab === 1
  });

  const { data: recipeCostResponse } = useQuery({
    queryKey: ['recipe-cost', selectedRecipeForCost],
    queryFn: () => api.get(`/recipes/${selectedRecipeForCost}/cost`),
    enabled: !!selectedRecipeForCost
  });

  // Mutations
  const createRecipeMutation = useMutation({
    mutationFn: (data: CreateRecipeData) => api.post('/recipes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['what-can-i-make'] });
      handleCloseDialog();
    }
  });

  const updateRecipeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRecipeData> }) =>
      api.put(`/recipes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['what-can-i-make'] });
      handleCloseDialog();
    }
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/recipes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['what-can-i-make'] });
    }
  });

  // Data processing - API returns {success: true, data: [...]} structure
  const recipes: Recipe[] = recipesResponse?.data || [];
  const categories: Category[] = categoriesResponse?.data || [];
  const rawMaterials: RawMaterial[] = rawMaterialsResponse?.data || [];
  const intermediateProducts: IntermediateProduct[] = intermediateProductsResponse?.data || [];
  const units: Unit[] = unitsResponse?.data || [];
  const whatCanIMake: WhatCanIMakeAnalysis = whatCanIMakeResponse?.data || null;
  const recipeCost: RecipeCostAnalysis = recipeCostResponse?.data?.data || null;

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
    if (editingRecipe) {
      updateRecipeMutation.mutate({ id: editingRecipe.id, data: formData });
    } else {
      createRecipeMutation.mutate(formData);
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
    if (ingredientForm.itemId && ingredientForm.quantity > 0 && ingredientForm.unit) {
      const newIngredient = {
        [ingredientForm.type === 'raw' ? 'rawMaterialId' : 'intermediateProductId']: ingredientForm.itemId,
        quantity: ingredientForm.quantity,
        unit: ingredientForm.unit,
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
              <Grid item xs={12} md={6} lg={4} key={recipe.recipeId}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {recipe.recipeName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {recipe.category} • {recipe.yieldQuantity} {recipe.yieldUnit}
                    </Typography>
                    
                    {recipe.canMake ? (
                      <Box>
                        <Chip
                          label="Can Make"
                          color="success"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2">
                          Max batches: {recipe.maxBatches}
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Chip
                          label="Missing Ingredients"
                          color="error"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <List dense>
                          {recipe.missingIngredients.map((missing, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={missing.name}
                                secondary={`Need ${missing.needed}, have ${missing.available} (shortage: ${missing.shortage})`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
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
          
          {recipeCost && (
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
                        onChange={(e) => setIngredientForm(prev => ({ ...prev, itemId: e.target.value }))}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Select an item</em>
                        </MenuItem>
                        {ingredientForm.type === 'raw' 
                          ? rawMaterials.map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.name}
                              </MenuItem>
                            ))
                          : intermediateProducts.map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.name}
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
                    <FormControl fullWidth>
                      <InputLabel shrink={!ingredientForm.unit ? true : undefined}>Unit</InputLabel>
                      <Select
                        value={ingredientForm.unit}
                        label="Unit"
                        onChange={(e) => setIngredientForm(prev => ({ ...prev, unit: e.target.value }))}
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
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createRecipeMutation.isPending || updateRecipeMutation.isPending}
          >
            {editingRecipe ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recipes;
