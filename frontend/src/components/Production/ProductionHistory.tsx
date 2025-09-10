import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Box,
    IconButton,
    Card,
    CardContent,
    Chip,
    Grid,
    Avatar,
    Button,
    CircularProgress,
    Alert,
    Stack,
    Divider,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle as CompleteIcon,
    Kitchen as KitchenIcon,
    Schedule as ScheduleIcon,
    TrendingUp as TrendingUpIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { ProductionRun, ProductionStepStatus } from '../../types';
import { productionApi } from '../../services/realApi';

interface ProductionHistoryProps {
    open: boolean;
    onClose: () => void;
}

const ProductionHistory: React.FC<ProductionHistoryProps> = ({ open, onClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [completedProductions, setCompletedProductions] = useState<ProductionRun[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 10;

    useEffect(() => {
        if (open) {
            loadCompletedProductions(true); // Reset on open
        }
    }, [open]);

    const loadCompletedProductions = async (reset = false) => {
        try {
            setLoading(true);
            setError(null);

            const currentOffset = reset ? 0 : offset;
            const response = await productionApi.getCompletedRuns(limit, currentOffset);

            if (response.success && response.data) {
                const newData = response.data;

                if (reset) {
                    setCompletedProductions(newData);
                    setOffset(limit);
                } else {
                    setCompletedProductions(prev => [...prev, ...newData]);
                    setOffset(prev => prev + limit);
                }

                // Check if there's more data
                const meta = (response as any).meta;
                if (meta && meta.total) {
                    setHasMore(currentOffset + newData.length < meta.total);
                } else {
                    setHasMore(newData.length === limit);
                }
            } else {
                setError('Failed to load production history');
            }
        } catch (error) {
            console.error('Error loading production history:', error);
            setError('Failed to load production history');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            loadCompletedProductions(false);
        }
    };

    const calculateProgress = (production: ProductionRun) => {
        if (!production.steps || production.steps.length === 0) return 100;
        const completedSteps = production.steps.filter(step => step.status === ProductionStepStatus.COMPLETED);
        return Math.round((completedSteps.length / production.steps.length) * 100);
    };

    const getTotalDuration = (production: ProductionRun) => {
        if (!production.startedAt || !production.completedAt) return 'N/A';
        const start = new Date(production.startedAt);
        const end = new Date(production.completedAt);
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
            sx={{
                '& .MuiDialog-paper': {
                    borderRadius: isMobile ? 0 : 2,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider',
                pb: 2
            }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                        <CompleteIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Production History
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View completed production runs and their performance
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" gap={1}>
                    <IconButton
                        onClick={() => loadCompletedProductions(true)}
                        disabled={loading}
                        size="small"
                    >
                        <RefreshIcon />
                    </IconButton>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {error && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {error}
                    </Alert>
                )}

                {completedProductions.length === 0 && !loading ? (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        py={8}
                        px={3}
                    >
                        <CompleteIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No completed productions yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            Complete your first production run to see it here in the history.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                            {completedProductions.map((production) => (
                                <Grid item xs={12} md={6} lg={4} key={production.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            border: 1,
                                            borderColor: 'success.light',
                                            '&:hover': {
                                                boxShadow: 4,
                                                borderColor: 'success.main'
                                            }
                                        }}
                                    >
                                        <CardContent>
                                            {/* Header with status */}
                                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                                <Typography variant="h6" fontWeight="bold" flex={1}>
                                                    {production.name}
                                                </Typography>
                                                <Chip
                                                    label={production.status}
                                                    color={getStatusColor(production.status) as any}
                                                    size="small"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </Box>

                                            {/* Recipe info */}
                                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                <KitchenIcon color="action" fontSize="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {production.recipe?.name}
                                                </Typography>
                                            </Box>

                                            {/* Production details */}
                                            <Stack spacing={1} mb={2}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Target Quantity:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight="medium">
                                                        {production.targetQuantity} {production.targetUnit}
                                                    </Typography>
                                                </Box>

                                                {production.finalQuantity && (
                                                    <Box display="flex" justifyContent="space-between">
                                                        <Typography variant="caption" color="text.secondary">
                                                            Final Quantity:
                                                        </Typography>
                                                        <Typography variant="caption" fontWeight="medium">
                                                            {production.finalQuantity} {production.targetUnit}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Duration:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight="medium">
                                                        {getTotalDuration(production)}
                                                    </Typography>
                                                </Box>

                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Steps Progress:
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight="medium">
                                                        {calculateProgress(production)}%
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            <Divider sx={{ my: 1 }} />

                                            {/* Completion info */}
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <ScheduleIcon color="action" fontSize="small" />
                                                <Typography variant="caption" color="text.secondary">
                                                    Completed {production.completedAt &&
                                                        formatDistanceToNow(new Date(production.completedAt), { addSuffix: true })
                                                    }
                                                </Typography>
                                            </Box>

                                            {production.completedAt && (
                                                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                                    {format(new Date(production.completedAt), 'MMM dd, yyyy • HH:mm')}
                                                </Typography>
                                            )}

                                            {/* Cost info if available */}
                                            {production.actualCost && (
                                                <Box display="flex" alignItems="center" gap={1} mt={1}>
                                                    <TrendingUpIcon color="action" fontSize="small" />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Cost: ${production.actualCost.toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Load more button */}
                        {hasMore && (
                            <Box display="flex" justifyContent="center" mt={3}>
                                <Button
                                    variant="outlined"
                                    onClick={loadMore}
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={16} /> : null}
                                >
                                    {loading ? 'Loading...' : 'Load More'}
                                </Button>
                            </Box>
                        )}

                        {loading && completedProductions.length === 0 && (
                            <Box display="flex" justifyContent="center" py={4}>
                                <CircularProgress />
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ProductionHistory;
