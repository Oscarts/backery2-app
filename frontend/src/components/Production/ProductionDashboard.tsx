import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    LinearProgress,
    IconButton,
    Tooltip,
    Stack,
    useTheme,
    useMediaQuery,
    Fab,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Add as AddIcon,
    Visibility as ViewIcon,
    Kitchen as KitchenIcon,
    Timer as TimerIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ProductionRun, ProductionStatus, ProductionStepStatus } from '../../types';
import { productionApi } from '../../services/realApi';
import RecipeSelectionDialog from './RecipeSelectionDialog';
import QuantitySelectionDialog from './QuantitySelectionDialog';
import ProductionTracker from './ProductionTracker';

const ProductionDashboard: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State management
    const [activeProductions, setActiveProductions] = useState<ProductionRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRecipeSelection, setShowRecipeSelection] = useState(false);
    const [showQuantitySelection, setShowQuantitySelection] = useState(false);
    const [showProductionTracker, setShowProductionTracker] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
    const [selectedProduction, setSelectedProduction] = useState<ProductionRun | null>(null);

    // Load active production runs
    useEffect(() => {
        loadActiveProductions();
    }, []);

    const loadActiveProductions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await productionApi.getDashboardRuns();
            if (response.success && response.data) {
                setActiveProductions(response.data);
            } else {
                setError('Failed to load production runs');
            }
        } catch (error) {
            console.error('Error loading productions:', error);
            setError('Failed to load production runs');
        } finally {
            setLoading(false);
        }
    };

    // Production handlers
    const handleStartNewProduction = () => {
        setShowRecipeSelection(true);
    };

    const handleRecipeSelected = (recipe: any) => {
        setSelectedRecipe(recipe);
        setShowQuantitySelection(true);
    };

    const handleQuantityConfirmed = async (quantity: number) => {
        try {
            const newProductionData = {
                name: `${quantity} ${selectedRecipe.name}`,
                recipeId: selectedRecipe.id,
                targetQuantity: quantity,
                targetUnit: selectedRecipe.yieldUnit,
                notes: `Production started from dashboard`
            };

            const response = await productionApi.createRun(newProductionData);
            if (response.success && response.data) {
                // Reload productions to get the updated list
                await loadActiveProductions();

                // Auto-open production tracker for new production
                setSelectedProduction(response.data);
                setShowProductionTracker(true);
            } else {
                setError('Failed to create production run');
            }
        } catch (error) {
            console.error('Error creating production:', error);
            setError('Failed to create production run');
        }

        setShowQuantitySelection(false);
        setSelectedRecipe(null);
    };

    const handleViewProduction = (production: ProductionRun) => {
        setSelectedProduction(production);
        setShowProductionTracker(true);
    };

    const handlePauseProduction = (productionId: string) => {
        setActiveProductions(activeProductions.map(p =>
            p.id === productionId
                ? { ...p, status: ProductionStatus.ON_HOLD }
                : p
        ));
    };

    const handleResumeProduction = (productionId: string) => {
        setActiveProductions(activeProductions.map(p =>
            p.id === productionId
                ? { ...p, status: ProductionStatus.IN_PROGRESS }
                : p
        ));
    };

    const getStatusColor = (status: ProductionStatus) => {
        switch (status) {
            case ProductionStatus.IN_PROGRESS:
                return 'primary';
            case ProductionStatus.ON_HOLD:
                return 'warning';
            case ProductionStatus.COMPLETED:
                return 'success';
            case ProductionStatus.PLANNED:
                return 'info';
            case ProductionStatus.CANCELLED:
                return 'error';
            default:
                return 'default';
        }
    };

    const calculateProgress = (production: ProductionRun) => {
        if (!production.steps) return 0;
        const completedSteps = production.steps.filter(s => s.status === ProductionStepStatus.COMPLETED).length;
        return (completedSteps / production.steps.length) * 100;
    };

    const getCurrentStep = (production: ProductionRun) => {
        if (!production.steps) return null;
        return production.steps.find(s => s.status === ProductionStepStatus.IN_PROGRESS) ||
            production.steps.find(s => s.status === ProductionStepStatus.PENDING);
    };

    const getTimeElapsed = (startTime: string) => {
        return formatDistanceToNow(new Date(startTime), { addSuffix: false });
    };

    return (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <CircularProgress size={60} />
                </Box>
            )}

            {/* Error State */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {!loading && (
                <>
                    {/* Header */}
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant={isMobile ? "h4" : "h3"}
                            sx={{
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                mb: 1
                            }}
                        >
                            🏭 Production Center
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Manage your bakery production runs in real-time
                        </Typography>
                    </Box>

                    {/* Quick Stats */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                                    {activeProductions.filter(p => p.status === ProductionStatus.IN_PROGRESS).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Active
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                    {activeProductions.filter(p => p.status === ProductionStatus.ON_HOLD).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    On Hold
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                                    0
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Completed Today
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
                                    {activeProductions.reduce((acc, p) => acc + (p.targetQuantity || 0), 0)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Items
                                </Typography>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Active Productions */}
                    {activeProductions.length === 0 ? (
                        <Card sx={{ textAlign: 'center', py: 8 }}>
                            <CardContent>
                                <Typography variant="h5" sx={{ mb: 2, fontSize: '4rem' }}>
                                    🧑‍🍳
                                </Typography>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No active productions
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                                    Ready to start baking? Create your first production run!
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<KitchenIcon />}
                                    onClick={handleStartNewProduction}
                                    sx={{
                                        height: 56,
                                        px: 4,
                                        fontSize: '1.1rem',
                                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                    }}
                                >
                                    🚀 Start Your First Production
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Grid container spacing={3}>
                            {activeProductions.map((production) => {
                                const currentStep = getCurrentStep(production);
                                const progress = calculateProgress(production);

                                return (
                                    <Grid item xs={12} md={6} lg={4} key={production.id}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                position: 'relative',
                                                border: 2,
                                                borderColor: production.status === ProductionStatus.IN_PROGRESS
                                                    ? 'primary.light'
                                                    : production.status === ProductionStatus.ON_HOLD
                                                        ? 'warning.light'
                                                        : 'divider',
                                                '&:hover': {
                                                    boxShadow: 6,
                                                    transform: 'translateY(-2px)',
                                                    transition: 'all 0.3s ease'
                                                }
                                            }}
                                        >
                                            {/* Status Indicator */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    right: 12,
                                                    zIndex: 1,
                                                }}
                                            >
                                                <Chip
                                                    label={production.status.replace('_', ' ')}
                                                    color={getStatusColor(production.status) as any}
                                                    size="small"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </Box>

                                            <CardContent sx={{ pb: 1 }}>
                                                {/* Production Header */}
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, pr: 8 }}>
                                                    {production.name}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Target: {production.targetQuantity} {production.targetUnit}
                                                </Typography>

                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                                    <TimerIcon fontSize="small" color="action" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {getTimeElapsed(production.startedAt)} elapsed
                                                    </Typography>
                                                </Stack>

                                                {/* Progress Bar */}
                                                <Box sx={{ mb: 2 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                            Progress
                                                        </Typography>
                                                        <Typography variant="body2" color="primary">
                                                            {Math.round(progress)}%
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={progress}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            backgroundColor: 'grey.200',
                                                            '& .MuiLinearProgress-bar': {
                                                                borderRadius: 4,
                                                            }
                                                        }}
                                                    />
                                                </Box>

                                                {/* Current Step */}
                                                {currentStep && (
                                                    <Alert
                                                        severity={production.status === ProductionStatus.IN_PROGRESS ? "info" : "warning"}
                                                        variant="outlined"
                                                        sx={{ mb: 2 }}
                                                    >
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                            {production.status === ProductionStatus.IN_PROGRESS ? "Current Step:" : "Next Step:"}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {currentStep.name}
                                                        </Typography>
                                                        {currentStep.estimatedMinutes && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                ~{currentStep.estimatedMinutes} minutes
                                                            </Typography>
                                                        )}
                                                    </Alert>
                                                )}

                                                {/* Cost Info */}
                                                {production.actualCost && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Estimated cost: ${production.actualCost.toFixed(2)}
                                                    </Typography>
                                                )}
                                            </CardContent>

                                            <CardActions sx={{ p: 2, pt: 0 }}>
                                                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                                                    {/* Action Buttons */}
                                                    {production.status === ProductionStatus.IN_PROGRESS && (
                                                        <Tooltip title="Pause Production">
                                                            <IconButton
                                                                size="small"
                                                                color="warning"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePauseProduction(production.id);
                                                                }}
                                                            >
                                                                <PauseIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {production.status === ProductionStatus.ON_HOLD && (
                                                        <Tooltip title="Resume Production">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleResumeProduction(production.id);
                                                                }}
                                                            >
                                                                <PlayIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    <Box sx={{ flexGrow: 1 }} />

                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<ViewIcon />}
                                                        onClick={() => handleViewProduction(production)}
                                                    >
                                                        Track
                                                    </Button>
                                                </Stack>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}

                    {/* Floating Action Button */}
                    <Fab
                        color="primary"
                        sx={{
                            position: 'fixed',
                            bottom: 24,
                            right: 24,
                            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #667eea 60%, #764ba2 100%)',
                            },
                        }}
                        onClick={handleStartNewProduction}
                    >
                        <AddIcon />
                    </Fab>

                    {/* Dialogs */}
                    <RecipeSelectionDialog
                        open={showRecipeSelection}
                        onClose={() => setShowRecipeSelection(false)}
                        onSelectRecipe={handleRecipeSelected}
                    />

                    <QuantitySelectionDialog
                        open={showQuantitySelection}
                        recipe={selectedRecipe}
                        onClose={() => {
                            setShowQuantitySelection(false);
                            setSelectedRecipe(null);
                        }}
                        onConfirm={handleQuantityConfirmed}
                    />

                    {selectedProduction && (
                        <ProductionTracker
                            open={showProductionTracker}
                            production={selectedProduction}
                            onClose={() => {
                                setShowProductionTracker(false);
                                setSelectedProduction(null);
                            }}
                            onProductionUpdated={loadActiveProductions}
                        />
                    )}
                </>
            )}
        </Box>
    );
};

export default ProductionDashboard;
