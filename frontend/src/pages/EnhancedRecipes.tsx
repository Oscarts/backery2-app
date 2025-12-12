import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  alpha,
  Fade,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  ViewModule as CardViewIcon,
  ViewList as ListViewIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Recipe, CategoryType } from '../types';
import { recipesApi, categoriesApi, rawMaterialsApi, finishedProductsApi, unitsApi } from '../services/realApi';
import { EnhancedRecipeCard } from '../components/Recipe/EnhancedRecipeCard';
import { RecipeDetailView } from '../components/Recipe/RecipeDetailView';
import { EnhancedRecipeForm } from '../components/Recipe/EnhancedRecipeForm';
import { borderRadius } from '../theme/designTokens';

type ViewMode = 'card' | 'list';
type SortOption = 'name' | 'created' | 'cost' | 'difficulty';

const EnhancedRecipes: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'card' : 'card');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeForCost, setSelectedRecipeForCost] = useState<string | null>(null);

  // Data queries
  const { data: recipesResponse, isLoading: recipesLoading, refetch: refetchRecipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesApi.getAll
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll
  });

  const { data: rawMaterialsResponse } = useQuery({
    queryKey: ['raw-materials'],
    queryFn: rawMaterialsApi.getAll
  });

  const { data: finishedProductsResponse } = useQuery({
    queryKey: ['finished-products'],
    queryFn: finishedProductsApi.getAll
  });

  const { data: unitsResponse } = useQuery({
    queryKey: ['units'],
    queryFn: unitsApi.getAll
  });

  const { data: recipeCostResponse } = useQuery({
    queryKey: ['recipe-cost', selectedRecipeForCost],
    queryFn: () => recipesApi.getCost(selectedRecipeForCost!),
    enabled: !!selectedRecipeForCost
  });

  // Extract data from responses
  const recipes = recipesResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const rawMaterials = rawMaterialsResponse?.data || [];
  const finishedProducts = finishedProductsResponse?.data || [];
  const units = unitsResponse?.data || [];
  const recipeCost = recipeCostResponse?.data || null;

  // Filter categories for recipe form (only RECIPE type)
  const recipeCategories = categories.filter((cat: any) => cat.type === CategoryType.RECIPE);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('recipe-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('recipe-favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  // Filter and sort recipes
  const filteredAndSortedRecipes = React.useMemo(() => {
    let filtered = recipes.filter((recipe: Recipe) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = recipe.name.toLowerCase().includes(searchLower);
        const descMatch = recipe.description?.toLowerCase().includes(searchLower);
        const categoryMatch = recipe.category?.name.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch && !categoryMatch) return false;
      }

      // Category filter
      if (selectedCategory && recipe.categoryId !== selectedCategory) {
        return false;
      }

      // Favorites filter
      if (showFavoritesOnly && !favorites.has(recipe.id)) {
        return false;
      }

      return true;
    });

    // Sort recipes
    filtered.sort((a: Recipe, b: Recipe) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'cost':
          return (b.estimatedCost || 0) - (a.estimatedCost || 0);
        case 'difficulty':
          const difficultyOrder = { EASY: 1, MEDIUM: 2, HARD: 3 };
          return (difficultyOrder[a.difficulty || 'MEDIUM'] || 2) - (difficultyOrder[b.difficulty || 'MEDIUM'] || 2);
        default:
          return 0;
      }
    });

    return filtered;
  }, [recipes, searchTerm, selectedCategory, sortBy, showFavoritesOnly, favorites]);

  // Handlers
  const handleCreateRecipe = () => {
    setEditingRecipe(null);
    setFormOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormOpen(true);
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setSelectedRecipeForCost(recipe.id);
    setDetailOpen(true);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await recipesApi.delete(recipeId);
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
      } catch (error) {
        console.error('Failed to delete recipe:', error);
      }
    }
  };

  const handleToggleFavorite = (recipeId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(recipeId)) {
        newFavorites.delete(recipeId);
      } else {
        newFavorites.add(recipeId);
      }
      return newFavorites;
    });
  };

  const handleSaveRecipe = async (recipeData: any) => {
    try {
      if (editingRecipe) {
        await recipesApi.update(editingRecipe.id, recipeData);
      } else {
        await recipesApi.create(recipeData);
      }
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setFormOpen(false);
      setErrorMessage(null); // Clear any previous errors
    } catch (error: any) {
      console.error('Failed to save recipe:', error);
      // Extract error message from API response
      const message = error?.response?.data?.error || error?.message || 'Failed to save recipe';
      setErrorMessage(message);
    }
  };

  const handleCalculateCost = async (_recipeData: any) => {
    // Mock cost calculation for preview
    // In a real implementation, this would call the API with the form data
    return {
      totalMaterialCost: 5.00,
      overheadCost: 1.00,
      totalProductionCost: 6.00,
      ingredients: []
    };
  };

  const handleUpdateOverhead = async (recipeId: string, overheadPercentage: number) => {
    try {
      await recipesApi.update(recipeId, { overheadPercentage } as any);
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe-cost', recipeId] });
    } catch (error) {
      console.error('Failed to update overhead:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2
        }}
      >
        <Box>
          <Typography
            variant={isMobile ? "h4" : "h3"}
            sx={{
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1
            }}
          >
            <MenuBookIcon sx={{ fontSize: '1.2em', color: 'primary.main' }} />
            Recipe Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Create, manage, and analyze your bakery recipes with detailed cost breakdowns
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleCreateRecipe}
          sx={{
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {isMobile ? 'Create' : 'Create Recipe'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {recipes.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Recipes
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {favorites.size}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Favorites
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {recipes.filter((r: Recipe) => r.estimatedCost).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              With Costs
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
            <Typography variant="h4" color="info.main" fontWeight="bold">
              {categories.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categories
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Bar */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: borderRadius.lg, // 20px - Modern rounded search bar
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.md, // 16px - Modern rounded inputs
                  bgcolor: theme.palette.background.paper
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{ borderRadius: borderRadius.md }} // 16px - Modern rounded select
              >
                <MenuItem value="">All Categories</MenuItem>
                {recipeCategories.map((category: any) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                sx={{ borderRadius: borderRadius.md }} // 16px - Modern rounded select
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="created">Recently Created</MenuItem>
                <MenuItem value="cost">Cost</MenuItem>
                <MenuItem value="difficulty">Difficulty</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant={showFavoritesOnly ? 'contained' : 'outlined'}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              startIcon={showFavoritesOnly ? <StarIcon /> : <StarBorderIcon />}
              sx={{ borderRadius: borderRadius.md, py: 1.7 }} // 16px - Modern rounded button
            >
              Favorites
            </Button>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="card" aria-label="card view">
                  <CardViewIcon />
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  <ListViewIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <IconButton
                onClick={() => refetchRecipes()}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Recipes Display */}
      <Box sx={{ mb: 3 }}>
        {recipesLoading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Loading recipes...
            </Typography>
          </Box>
        ) : filteredAndSortedRecipes.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8, bgcolor: alpha(theme.palette.grey[50], 0.5) }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {searchTerm || selectedCategory || showFavoritesOnly
                ? 'No recipes match your filters'
                : 'No recipes found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {!searchTerm && !selectedCategory && !showFavoritesOnly
                ? 'Create your first recipe to get started'
                : 'Try adjusting your search or filters'}
            </Typography>
            {!searchTerm && !selectedCategory && !showFavoritesOnly && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateRecipe}
              >
                Create First Recipe
              </Button>
            )}
          </Card>
        ) : (
          <Fade in>
            <Grid container spacing={3}>
              {filteredAndSortedRecipes.map((recipe: Recipe) => (
                <Grid
                  item
                  xs={12}
                  sm={viewMode === 'card' ? 6 : 12}
                  md={viewMode === 'card' ? 4 : 12}
                  lg={viewMode === 'card' ? 3 : 12}
                  key={recipe.id}
                >
                  <EnhancedRecipeCard
                    recipe={recipe}
                    onView={handleViewRecipe}
                    onEdit={handleEditRecipe}
                    onDelete={handleDeleteRecipe}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.has(recipe.id)}
                    showCostAnalysis={true}
                  />
                </Grid>
              ))}
            </Grid>
          </Fade>
        )}
      </Box>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add recipe"
          onClick={handleCreateRecipe}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Recipe Detail View */}
      <RecipeDetailView
        open={detailOpen}
        recipe={selectedRecipe}
        recipeCost={recipeCost}
        onClose={() => {
          setDetailOpen(false);
          setSelectedRecipe(null);
          setSelectedRecipeForCost(null);
        }}
        onEdit={handleEditRecipe}
        onUpdateOverhead={handleUpdateOverhead}
      />

      {/* Recipe Form */}
      <EnhancedRecipeForm
        open={formOpen}
        recipe={editingRecipe}
        categories={recipeCategories}
        rawMaterials={rawMaterials}
        finishedProducts={finishedProducts}
        units={units}
        onClose={() => {
          setFormOpen(false);
          setEditingRecipe(null);
          setErrorMessage(null); // Clear error when closing
        }}
        onSave={handleSaveRecipe}
        onCalculateCost={handleCalculateCost}
      />

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedRecipes;