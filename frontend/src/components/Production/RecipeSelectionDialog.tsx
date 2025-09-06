import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Box,
    IconButton,
    Fab,
    Slide,
    useTheme,
    useMediaQuery,
    Stack,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    Schedule as TimeIcon,
    TrendingUp as DifficultyIcon,
    LocalDining as ServingIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { Recipe } from '../../types/index';
import { recipesApi } from '../../services/realApi';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface RecipeSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    onSelectRecipe: (recipe: any) => void;
}

const RecipeSelectionDialog: React.FC<RecipeSelectionDialogProps> = ({
    open,
    onClose,
    onSelectRecipe,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch recipes when dialog opens
    useEffect(() => {
        if (open) {
            loadRecipes();
        }
    }, [open]);

    const loadRecipes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await recipesApi.getAll();
            if (response.success && response.data) {
                setRecipes(response.data);
            } else {
                setError('Failed to load recipes');
            }
        } catch (error) {
            console.error('Error loading recipes:', error);
            setError('Failed to load recipes');
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', ...Array.from(new Set(recipes.map(r => r.category?.name || 'Uncategorized')))];

    const filteredRecipes = selectedCategory === 'All'
        ? recipes
        : recipes.filter(r => (r.category?.name || 'Uncategorized') === selectedCategory);

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'success';
            case 'Medium': return 'warning';
            case 'Hard': return 'error';
            default: return 'default';
        }
    };

    const getRecipeStatusColor = (recipe: any) => {
        return recipe.canMake ? 'success' : 'error';
    };

    const handleRecipeSelect = (recipe: any) => {
        onSelectRecipe(recipe);
        onClose();
    };

    return (
        <Dialog
            fullScreen={isMobile}
            open={open}
            onClose={onClose}
            TransitionComponent={Transition}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 3,
                    maxHeight: isMobile ? '100vh' : '90vh',
                },
            }}
        >
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                {/* Header */}
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        p: 3,
                        position: 'relative',
                    }}
                >
                    <IconButton
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'white',
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
                        🚀 Start Production
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                        Choose what you want to make today
                    </Typography>
                </Box>

                {/* Category Filter */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                        {categories.map((category) => (
                            <Chip
                                key={category}
                                label={category}
                                onClick={() => setSelectedCategory(category)}
                                variant={selectedCategory === category ? 'filled' : 'outlined'}
                                color={selectedCategory === category ? 'primary' : 'default'}
                                sx={{
                                    minWidth: 'fit-content',
                                    whiteSpace: 'nowrap'
                                }}
                            />
                        ))}
                    </Stack>
                </Box>

                {/* Recipe Grid */}
                <Box sx={{ p: 2, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                            <CircularProgress size={60} />
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {!loading && !error && (
                        <Grid container spacing={2}>
                            {filteredRecipes.map((recipe) => (
                                <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                                    <Card
                                        sx={{
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            border: 2,
                                            borderColor: 'success.light', // All recipes are available for now
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 6,
                                            }
                                        }}
                                        onClick={() => onSelectRecipe(recipe)}
                                    >
                                        <CardContent sx={{ p: 2 }}>
                                            {/* Recipe Status Icon */}
                                            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                                <CheckIcon color="success" fontSize="small" />
                                            </Box>

                                            {/* Recipe Icon */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    height: 80,
                                                    mb: 2,
                                                    fontSize: '3rem',
                                                    opacity: 1, // All recipes are available
                                                    filter: 'none' // All recipes are available
                                                }}
                                            >
                                                {recipe.emoji || '🍞'}
                                            </Box>

                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    textAlign: 'center',
                                                    mb: 1,
                                                    color: 'text.primary' // All recipes are available
                                                }}
                                            >
                                                {recipe.name}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ textAlign: 'center', mb: 2, minHeight: 40 }}
                                            >
                                                {recipe.description}
                                            </Typography>

                                            {/* Recipe Stats */}
                                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                                <Chip
                                                    icon={<TimeIcon />}
                                                    label={`${(recipe.estimatedTotalTime || (recipe.prepTime || 0) + (recipe.cookTime || 0))} min`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    icon={<DifficultyIcon />}
                                                    label={recipe.difficulty || 'Unknown'}
                                                    size="small"
                                                    color={getDifficultyColor(recipe.difficulty || 'Unknown') as any}
                                                    variant="outlined"
                                                />
                                            </Stack>

                                            {/* Availability Status */}
                                            <Alert severity="success" sx={{ py: 0.5 }}>
                                                <Typography variant="caption">
                                                    ✅ Ready to make up to {recipe.yieldQuantity} {recipe.yieldUnit}
                                                </Typography>
                                            </Alert>

                                            {/* Cost estimate removed for now */}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
                
                {/* Bottom Action Area */}
                <Box
                    sx={{
                        p: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                        backgroundColor: 'background.paper',
                    }}
                >
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: 'center' }}
                    >
                        Tap any recipe to continue with quantity selection
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default RecipeSelectionDialog;
