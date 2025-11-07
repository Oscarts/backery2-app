import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Box,
    IconButton,
    Slide,
    useTheme,
    useMediaQuery,
    Stack,
    Button,
    Alert,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Fab,
    TextField,
    CircularProgress,
} from '@mui/material';
import {
    Close as CloseIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Check as CheckIcon,
    Timer as TimerIcon,
    Kitchen as KitchenIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { ProductionRun, ProductionStep, ProductionStepStatus, ProductionStatus } from '../../types/index';
import { productionApi } from '../../services/realApi';
import { formatDistanceToNow } from 'date-fns';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface ProductionTrackerProps {
    open: boolean;
    production: ProductionRun | null;
    onClose: () => void;
    onProductionUpdated?: () => void;
}

const ProductionTracker: React.FC<ProductionTrackerProps> = ({
    open,
    production,
    onClose,
    onProductionUpdated,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State management
    const [steps, setSteps] = useState<ProductionStep[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);
    const [stepNotes, setStepNotes] = useState<{ [key: string]: string }>({});
    const [updatingSteps, setUpdatingSteps] = useState<Set<string>>(new Set());

    // Load production steps when dialog opens or production changes
    useEffect(() => {
        if (open && production?.id) {
            loadProductionSteps();
        }
    }, [open, production?.id]);

    // Timer for current step
    useEffect(() => {
        const currentStep = steps.find(s => s.status === ProductionStepStatus.IN_PROGRESS);

        if (currentStep?.startedAt && production?.status === ProductionStatus.IN_PROGRESS) {
            const interval = setInterval(() => {
                const startTime = new Date(currentStep.startedAt!).getTime();
                const now = new Date().getTime();
                setTimer(Math.floor((now - startTime) / 1000 / 60)); // minutes
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [steps, production?.status]);

    const loadProductionSteps = async () => {
        if (!production?.id) return;

        try {
            setLoading(true);
            setError(null);
            const response = await productionApi.getSteps(production.id);
            if (response.success && response.data) {
                setSteps(response.data);
            } else {
                setError('Failed to load production steps');
            }
        } catch (error) {
            console.error('Error loading production steps:', error);
            setError('Failed to load production steps');
        } finally {
            setLoading(false);
        }
    };

    const handleStartStep = async (step: ProductionStep) => {
        if (!step.id) return;

        try {
            setUpdatingSteps(prev => new Set(prev).add(step.id));
            const response = await productionApi.startStep(step.id);
            if (response.success) {
                await loadProductionSteps(); // Reload to get updated state
                onProductionUpdated?.();
            } else {
                setError('Failed to start step');
            }
        } catch (error) {
            console.error('Error starting step:', error);
            setError('Failed to start step');
        } finally {
            setUpdatingSteps(prev => {
                const newSet = new Set(prev);
                newSet.delete(step.id);
                return newSet;
            });
        }
    };

    const handleCompleteStep = async (step: ProductionStep) => {
        if (!step.id) return;

        const notes = stepNotes[step.id] || '';

        try {
            setUpdatingSteps(prev => new Set(prev).add(step.id));
            const response = await productionApi.completeStep(step.id, {
                notes: notes.trim() || undefined,
            });

            if (response.success) {
                await loadProductionSteps(); // Reload to get updated state
                setStepNotes({ ...stepNotes, [step.id]: '' }); // Clear notes
                onProductionUpdated?.();
            } else {
                setError('Failed to complete step');
            }
        } catch (error) {
            console.error('Error completing step:', error);
            setError('Failed to complete step');
        } finally {
            setUpdatingSteps(prev => {
                const newSet = new Set(prev);
                newSet.delete(step.id);
                return newSet;
            });
        }
    };

    const handlePauseProduction = async () => {
        if (!production?.id) return;

        try {
            const response = await productionApi.updateRun(production.id, {
                status: ProductionStatus.ON_HOLD
            });
            if (response.success) {
                onProductionUpdated?.();
            } else {
                setError('Failed to pause production');
            }
        } catch (error) {
            console.error('Error pausing production:', error);
            setError('Failed to pause production');
        }
    };

    const handleResumeProduction = async () => {
        if (!production?.id) return;

        try {
            const response = await productionApi.updateRun(production.id, {
                status: ProductionStatus.IN_PROGRESS
            });
            if (response.success) {
                onProductionUpdated?.();
            } else {
                setError('Failed to resume production');
            }
        } catch (error) {
            console.error('Error resuming production:', error);
            setError('Failed to resume production');
        }
    };

    const handleCompleteProduction = async () => {
        if (!production?.id) return;

        try {
            const response = await productionApi.updateRun(production.id, {
                status: ProductionStatus.COMPLETED,
                completedAt: new Date().toISOString(),
                finalQuantity: production.targetQuantity
            });
            if (response.success) {
                onProductionUpdated?.();
                onClose();
            } else {
                setError('Failed to complete production');
            }
        } catch (error) {
            console.error('Error completing production:', error);
            setError('Failed to complete production');
        }
    };

    if (!production) return null;

    const currentStep = steps.find(s => s.status === ProductionStepStatus.IN_PROGRESS);
    const completedSteps = steps.filter(s => s.status === ProductionStepStatus.COMPLETED).length;
    const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
    const allStepsCompleted = steps.length > 0 && steps.every(s =>
        s.status === ProductionStepStatus.COMPLETED || s.status === ProductionStepStatus.SKIPPED
    );

    const getStepStatusIcon = (step: ProductionStep) => {
        if (updatingSteps.has(step.id)) {
            return <CircularProgress size={20} />;
        }

        switch (step.status) {
            case ProductionStepStatus.COMPLETED:
                return <CheckIcon color="success" />;
            case ProductionStepStatus.IN_PROGRESS:
                return <PlayIcon color="primary" />;
            case ProductionStepStatus.PENDING:
                return <TimerIcon color="action" />;
            default:
                return <TimerIcon color="action" />;
        }
    };

    const getStepStatusColor = (step: ProductionStep) => {
        switch (step.status) {
            case ProductionStepStatus.COMPLETED:
                return 'success.light';
            case ProductionStepStatus.IN_PROGRESS:
                return 'primary.light';
            case ProductionStepStatus.PENDING:
                return 'grey.100';
            default:
                return 'grey.100';
        }
    };

    return (
        <Dialog
            fullScreen={isMobile}
            open={open}
            onClose={onClose}
            TransitionComponent={Transition}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 3,
                    maxHeight: isMobile ? '100vh' : '95vh',
                },
            }}
        >
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                {/* Header with Live Status */}
                <Box
                    sx={{
                        background: production.status === ProductionStatus.IN_PROGRESS
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #ffa726 0%, #ff7043 100%)',
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

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                            🧁 {production.name}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                            Target: {production.targetQuantity} {production.targetUnit}
                        </Typography>
                    </Box>

                    {/* Live Progress Bar */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Overall Progress</Typography>
                            <Typography variant="body2">{Math.round(progressPercentage)}%</Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={progressPercentage}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: 'white',
                                },
                            }}
                        />
                    </Box>

                    {/* Status and Time Info */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                            label={production.status.replace('_', ' ')}
                            sx={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontWeight: 'bold',
                            }}
                        />
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Started {formatDistanceToNow(new Date(production.startedAt), { addSuffix: true })}
                        </Typography>
                    </Stack>
                </Box>

                {/* Error Display */}
                {error && (
                    <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Loading State */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                        <CircularProgress size={60} />
                    </Box>
                )}

                {/* Steps List */}
                {!loading && (
                    <Box sx={{ p: 2, maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                        <Stack spacing={2}>
                            {steps.map((step, index) => (
                                <Card
                                    key={step.id}
                                    variant="outlined"
                                    sx={{
                                        borderColor: getStepStatusColor(step),
                                        borderWidth: step.status === ProductionStepStatus.IN_PROGRESS ? 2 : 1,
                                        backgroundColor: step.status === ProductionStepStatus.IN_PROGRESS
                                            ? 'primary.50'
                                            : step.status === ProductionStepStatus.COMPLETED
                                                ? 'success.50'
                                                : 'background.paper',
                                    }}
                                >
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                            {/* Step Icon */}
                                            <Box sx={{ mt: 0.5 }}>
                                                {getStepStatusIcon(step)}
                                            </Box>

                                            {/* Step Content */}
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                        {index + 1}. {step.name}
                                                    </Typography>
                                                    {step.status === ProductionStepStatus.IN_PROGRESS && (
                                                        <Chip
                                                            label={`${timer} min`}
                                                            color="primary"
                                                            size="small"
                                                            sx={{ animation: 'pulse 2s infinite' }}
                                                        />
                                                    )}
                                                </Box>

                                                {step.description && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        {step.description}
                                                    </Typography>
                                                )}

                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                                    {step.estimatedMinutes && (
                                                        <Chip
                                                            icon={<TimerIcon />}
                                                            label={`Est: ${step.estimatedMinutes} min`}
                                                            size="small"
                                                            variant="outlined"
                                                            color="default"
                                                        />
                                                    )}
                                                    
                                                    {step.actualMinutes && step.status === ProductionStepStatus.COMPLETED && (
                                                        <Chip
                                                            icon={<TimerIcon />}
                                                            label={`Actual: ${step.actualMinutes} min`}
                                                            size="small"
                                                            color={
                                                                step.estimatedMinutes && step.actualMinutes <= step.estimatedMinutes 
                                                                    ? 'success' 
                                                                    : step.estimatedMinutes && step.actualMinutes > step.estimatedMinutes * 1.2
                                                                    ? 'error'
                                                                    : 'warning'
                                                            }
                                                        />
                                                    )}
                                                    
                                                    {step.actualMinutes && step.estimatedMinutes && step.status === ProductionStepStatus.COMPLETED && (
                                                        <Chip
                                                            label={
                                                                step.actualMinutes <= step.estimatedMinutes 
                                                                    ? `✓ ${Math.round((step.estimatedMinutes - step.actualMinutes) / step.estimatedMinutes * 100)}% faster`
                                                                    : `⚠ ${Math.round((step.actualMinutes - step.estimatedMinutes) / step.estimatedMinutes * 100)}% slower`
                                                            }
                                                            size="small"
                                                            color={step.actualMinutes <= step.estimatedMinutes ? 'success' : 'warning'}
                                                            variant="filled"
                                                        />
                                                    )}
                                                </Box>

                                                {/* Step Actions */}
                                                {step.status === ProductionStepStatus.PENDING && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <Button
                                                            variant="contained"
                                                            fullWidth
                                                            onClick={() => handleStartStep(step)}
                                                            startIcon={<PlayIcon />}
                                                            disabled={updatingSteps.has(step.id)}
                                                            sx={{
                                                                height: 48,
                                                                fontSize: '1rem',
                                                                fontWeight: 'bold',
                                                            }}
                                                        >
                                                            ▶️ Start Step
                                                        </Button>
                                                    </Box>
                                                )}

                                                {step.status === ProductionStepStatus.IN_PROGRESS && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <TextField
                                                            placeholder="Add notes for this step..."
                                                            multiline
                                                            rows={2}
                                                            fullWidth
                                                            size="small"
                                                            value={stepNotes[step.id] || ''}
                                                            onChange={(e) => setStepNotes({
                                                                ...stepNotes,
                                                                [step.id]: e.target.value
                                                            })}
                                                            sx={{ mb: 2 }}
                                                        />
                                                        <Button
                                                            variant="contained"
                                                            fullWidth
                                                            onClick={() => handleCompleteStep(step)}
                                                            startIcon={<CheckIcon />}
                                                            disabled={updatingSteps.has(step.id)}
                                                            sx={{
                                                                height: 48,
                                                                fontSize: '1rem',
                                                                fontWeight: 'bold',
                                                            }}
                                                        >
                                                            ✅ Complete Step
                                                        </Button>
                                                    </Box>
                                                )}

                                                {/* Completed Step Info */}
                                                {step.status === ProductionStepStatus.COMPLETED && (
                                                    <Box sx={{ mt: 1, p: 1, backgroundColor: 'success.50', borderRadius: 1 }}>
                                                        <Typography variant="caption" color="success.dark">
                                                            ✅ Completed in {step.actualMinutes || 'unknown'} minutes
                                                            {step.completedAt && ` at ${new Date(step.completedAt).toLocaleTimeString()}`}
                                                        </Typography>
                                                        {step.notes && (
                                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                                📝 {step.notes}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}

                            {steps.length === 0 && !loading && (
                                <Alert severity="info">
                                    No production steps found. Steps should be automatically created when starting production.
                                </Alert>
                            )}
                        </Stack>
                    </Box>
                )}

                {/* Floating Action Buttons */}
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {production.status === ProductionStatus.IN_PROGRESS && (
                        <Fab
                            color="warning"
                            onClick={handlePauseProduction}
                            size="medium"
                        >
                            <PauseIcon />
                        </Fab>
                    )}

                    {production.status === ProductionStatus.ON_HOLD && (
                        <Fab
                            color="primary"
                            onClick={handleResumeProduction}
                            size="medium"
                        >
                            <PlayIcon />
                        </Fab>
                    )}
                </Box>

                {/* Bottom Action Area */}
                <Box
                    sx={{
                        p: 3,
                        borderTop: 1,
                        borderColor: 'divider',
                        backgroundColor: 'background.paper',
                        position: 'sticky',
                        bottom: 0,
                    }}
                >
                    {allStepsCompleted ? (
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleCompleteProduction}
                            size="large"
                            startIcon={<KitchenIcon />}
                            sx={{
                                height: 56,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                            }}
                        >
                            🎉 Complete Production & Add to Inventory
                        </Button>
                    ) : (
                        <Alert severity="info" sx={{ textAlign: 'center' }}>
                            {steps.length === 0
                                ? 'Loading production steps...'
                                : currentStep
                                    ? `Currently working on: ${currentStep.name}`
                                    : 'Continue with the current step to progress your production'
                            }
                        </Alert>
                    )}
                </Box>
            </DialogContent>

            {/* Add CSS animation for pulse effect */}
            <style>
                {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
            </style>
        </Dialog>
    );
};
export default ProductionTracker;
