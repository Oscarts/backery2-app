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
    History as HistoryIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ProductionRun, ProductionStatus, ProductionStepStatus } from '../../types';
import { productionApi } from '../../services/realApi';
import { CreateProductionStepData } from '../../types';
import RecipeSelectionDialog from './RecipeSelectionDialog';
import QuantitySelectionDialog from './QuantitySelectionDialog';
import ProductionTracker from './EnhancedProductionTracker';
import ProductionHistory from './ProductionHistory';

const ProductionDashboard: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State management
    const [activeProductions, setActiveProductions] = useState<ProductionRun[]>([]);
    const [productionStats, setProductionStats] = useState({
        active: 0,
        onHold: 0,
        planned: 0,
        completedToday: 0,
        totalTargetQuantity: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRecipeSelection, setShowRecipeSelection] = useState(false);
    const [showQuantitySelection, setShowQuantitySelection] = useState(false);
    const [showProductionTracker, setShowProductionTracker] = useState(false);
    const [showProductionHistory, setShowProductionHistory] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
    const [selectedProduction, setSelectedProduction] = useState<ProductionRun | null>(null);

    // Load active production runs and stats
    useEffect(() => {
        loadActiveProductions();
        loadProductionStats();
    }, []);

    const loadProductionStats = async () => {
        try {
            const response = await productionApi.getStats();
            if (response.success && response.data) {
                setProductionStats(response.data);
            }
        } catch (error) {
            console.error('Error loading production stats:', error);
        }
    };

    const loadActiveProductions = async () => {
        try {
            setLoading(true);
            setError(null);
            const [productionsResponse, statsResponse] = await Promise.all([
                productionApi.getDashboardRuns(),
                productionApi.getStats()
            ]);

            if (productionsResponse.success && productionsResponse.data) {
                setActiveProductions(productionsResponse.data);
            } else {
                setError('Failed to load production runs');
            }

            if (statsResponse.success && statsResponse.data) {
                setProductionStats(statsResponse.data);
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
        setShowRecipeSelection(false); // Close recipe selection dialog
        setShowQuantitySelection(true);
    };

    const handleQuantityConfirmed = async (quantity: number, customSteps?: CreateProductionStepData[]) => {
        try {
            const newProductionData = {
                name: `${quantity} ${selectedRecipe.name}`,
                recipeId: selectedRecipe.id,
                targetQuantity: quantity,
                targetUnit: selectedRecipe.yieldUnit,
                notes: `Production started from dashboard`,
                customSteps: customSteps
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

    const handlePauseProduction = async (productionId: string) => {
        try {
            const response = await productionApi.updateRun(productionId, {
                status: ProductionStatus.ON_HOLD
            });
            
            if (response.success && response.data) {
                // Update local state with the response from server
                setActiveProductions(activeProductions.map(p =>
                    p.id === productionId ? response.data! : p
                ));
                // Reload stats to update indicators
                await loadProductionStats();
            }
        } catch (error) {
            console.error('Error pausing production:', error);
        }
    };

    const handleResumeProduction = async (productionId: string) => {
        try {
            const response = await productionApi.updateRun(productionId, {
                status: ProductionStatus.IN_PROGRESS
            });
            
            if (response.success && response.data) {
                // Update local state with the response from server
                setActiveProductions(activeProductions.map(p =>
                    p.id === productionId ? response.data! : p
                ));
                // Reload stats to update indicators
                await loadProductionStats();
            }
        } catch (error) {
            console.error('Error resuming production:', error);
        }
    };

    const handleCancelProduction = async (productionId: string) => {
        if (!confirm('Are you sure you want to cancel this production run? This cannot be undone.')) {
            return;
        }

        try {
            const response = await productionApi.updateRun(productionId, {
                status: ProductionStatus.CANCELLED
            });
            
            if (response.success && response.data) {
                // Update the production in the list with CANCELLED status
                setActiveProductions(activeProductions.map(p =>
                    p.id === productionId ? response.data! : p
                ));
                // Reload stats to update indicators
                await loadProductionStats();
            }
        } catch (error) {
            console.error('Error cancelling production:', error);
        }
    };

    const handleDeleteProduction = async (productionId: string) => {
        if (!confirm('Are you sure you want to delete this production run? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await productionApi.deleteRun(productionId);
            if (response.success) {
                // Remove from active productions list
                setActiveProductions(activeProductions.filter(p => p.id !== productionId));
                // Reload production stats
                await loadProductionStats();
            } else {
                console.error('Failed to delete production run:', response.error);
                // You could show a toast notification here
            }
        } catch (error) {
            console.error('Error deleting production run:', error);
            // You could show a toast notification here
        }
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
        if (!production.steps || production.steps.length === 0) {
            return 0;
        }
        const completedSteps = production.steps.filter(s => s.status === ProductionStepStatus.COMPLETED).length;
        return (completedSteps / production.steps.length) * 100;
    };

    const getCurrentStep = (production: ProductionRun) => {
        if (!production.steps) return null;
        return production.steps.find(s => s.status === ProductionStepStatus.IN_PROGRESS) ||
            production.steps.find(s => s.status === ProductionStepStatus.PENDING);
    };

    const getTimeElapsed = (production: ProductionRun) => {
        if (!production.steps || production.steps.length === 0) {
            return 'Not started';
        }

        // Find the first step that has actually started
        const firstStartedStep = production.steps
            .filter(s => s.startedAt)
            .sort((a, b) => new Date(a.startedAt!).getTime() - new Date(b.startedAt!).getTime())[0];

        if (!firstStartedStep || !firstStartedStep.startedAt) {
            return 'Not started';
        }

        // If production is completed, use completedAt
        if (production.status === 'COMPLETED' && production.completedAt) {
            const start = new Date(firstStartedStep.startedAt);
            const end = new Date(production.completedAt);
            const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
            return `${minutes} minutes`;
        }

        // For in-progress productions, show elapsed time from first step start
        return formatDistanceToNow(new Date(firstStartedStep.startedAt), { addSuffix: false });
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
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                            <Box>
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

                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="outlined"
                                    startIcon={<HistoryIcon />}
                                    onClick={() => setShowProductionHistory(true)}
                                    sx={{
                                        borderColor: 'success.main',
                                        color: 'success.main',
                                        '&:hover': {
                                            borderColor: 'success.dark',
                                            bgcolor: 'success.light'
                                        }
                                    }}
                                >
                                    History
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleStartNewProduction}
                                    size="large"
                                    sx={{
                                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                        '&:hover': {
                                            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                                        }
                                    }}
                                >
                                    New Production
                                </Button>
                            </Stack>
                        </Box>
                    </Box>

                    {/* Quick Stats */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                                    {productionStats.active}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Active
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                    {productionStats.onHold}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    On Hold
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                                    {productionStats.completedToday}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Completed Today
                                </Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
                                    {productionStats.totalTargetQuantity}
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
                                            onClick={() => production.status !== ProductionStatus.CANCELLED && handleViewProduction(production)}
                                            sx={{
                                                height: '100%',
                                                position: 'relative',
                                                border: 2,
                                                borderColor: production.status === ProductionStatus.IN_PROGRESS
                                                    ? 'primary.light'
                                                    : production.status === ProductionStatus.ON_HOLD
                                                        ? 'warning.light'
                                                        : production.status === ProductionStatus.CANCELLED
                                                            ? 'error.light'
                                                            : 'divider',
                                                cursor: production.status === ProductionStatus.CANCELLED ? 'default' : 'pointer',
                                                opacity: production.status === ProductionStatus.CANCELLED ? 0.6 : 1,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    boxShadow: production.status === ProductionStatus.CANCELLED ? 2 : 8,
                                                    transform: production.status === ProductionStatus.CANCELLED ? 'none' : 'translateY(-4px)',
                                                    borderColor: production.status === ProductionStatus.IN_PROGRESS
                                                        ? 'primary.main'
                                                        : production.status === ProductionStatus.ON_HOLD
                                                            ? 'warning.main'
                                                            : production.status === ProductionStatus.CANCELLED
                                                                ? 'error.light'
                                                                : 'primary.light',
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
                                                        {getTimeElapsed(production)} elapsed
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

                                                    {/* Cancel Production - Subtle button at the end */}
                                                    {(production.status === ProductionStatus.PLANNED ||
                                                      production.status === ProductionStatus.IN_PROGRESS ||
                                                      production.status === ProductionStatus.ON_HOLD) && (
                                                        <Button
                                                            size="small"
                                                            startIcon={<BlockIcon />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCancelProduction(production.id);
                                                            }}
                                                            sx={{
                                                                color: 'text.secondary',
                                                                minWidth: 'auto',
                                                                px: 1.5,
                                                                '&:hover': {
                                                                    color: 'error.main',
                                                                    bgcolor: 'error.lighter'
                                                                }
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}

                                                    {/* Delete Button - Only for truly removing the record */}
                                                    {(production.status === ProductionStatus.CANCELLED ||
                                                      production.status === ProductionStatus.PLANNED) && (
                                                        <Tooltip title="Delete Production Run">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteProduction(production.id);
                                                                }}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {/* View action - only show for active productions */}
                                                    {production.status !== ProductionStatus.CANCELLED && (
                                                        <Typography
                                                            variant="body2"
                                                            color="primary"
                                                            sx={{
                                                                fontWeight: 'medium',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.5
                                                            }}
                                                        >
                                                            <ViewIcon fontSize="small" />
                                                            Click to track
                                                        </Typography>
                                                    )}
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

                    <ProductionHistory
                        open={showProductionHistory}
                        onClose={() => setShowProductionHistory(false)}
                    />
                </>
            )}
        </Box>
    );
};

export default ProductionDashboard;
