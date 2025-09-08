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
    CircularProgress,
    Grid,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
} from '@mui/material';
import {
    Close as CloseIcon,
    PlayArrow as PlayIcon,
    Check as CheckIcon,
    VerifiedUser as QualityIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { ProductionRun, ProductionStep, ProductionStepStatus, ProductionStatus } from '../../types/index';
import { productionApi } from '../../services/realApi';
import { format } from 'date-fns';

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

interface QualityCheckpointData {
    checkpointType: string;
    qualityStatus: 'PASS' | 'FAIL' | 'WARNING';
    measurements: Record<string, number>;
    notes: string;
    photos: string[];
}

const EnhancedProductionTracker: React.FC<ProductionTrackerProps> = ({
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

    // Quality tracking state
    const [qualityDialogOpen, setQualityDialogOpen] = useState(false);
    const [selectedStepForQuality, setSelectedStepForQuality] = useState<ProductionStep | null>(null);
    const [qualityCheckData, setQualityCheckData] = useState<QualityCheckpointData>({
        checkpointType: 'mid-process',
        qualityStatus: 'PASS',
        measurements: { temperature: 0, weight: 0, ph: 7 },
        notes: '',
        photos: []
    });

    // Load production steps when dialog opens or production changes
    useEffect(() => {
        if (open && production?.id) {
            loadProductionSteps();
            // Set up auto-refresh for real-time monitoring
            const interval = setInterval(loadProductionSteps, 30000); // Refresh every 30 seconds
            return () => clearInterval(interval);
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
                await loadProductionSteps();
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
                qualityCheckPassed: step.qualityCheckPassed,
            });

            if (response.success) {
                await loadProductionSteps();
                setStepNotes({ ...stepNotes, [step.id]: '' });
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

    const handleOpenQualityCheck = (step: ProductionStep) => {
        setSelectedStepForQuality(step);
        setQualityDialogOpen(true);
    };

    const handleLogQualityCheckpoint = async () => {
        if (!selectedStepForQuality?.id) return;

        try {
            const response = await productionApi.logQualityCheckpoint(
                selectedStepForQuality.id,
                qualityCheckData
            );

            if (response.success) {
                await loadProductionSteps();
                setQualityDialogOpen(false);
                setSelectedStepForQuality(null);
                // Reset quality form
                setQualityCheckData({
                    checkpointType: 'mid-process',
                    qualityStatus: 'PASS',
                    measurements: { temperature: 0, weight: 0, ph: 7 },
                    notes: '',
                    photos: []
                });
            } else {
                setError('Failed to log quality checkpoint');
            }
        } catch (error) {
            console.error('Error logging quality checkpoint:', error);
            setError('Failed to log quality checkpoint');
        }
    };

    const getStepStatusColor = (status: ProductionStepStatus) => {
        switch (status) {
            case ProductionStepStatus.COMPLETED:
                return 'success';
            case ProductionStepStatus.IN_PROGRESS:
                return 'primary';
            case ProductionStepStatus.PENDING:
                return 'default';
            default:
                return 'default';
        }
    };

    const renderStepCard = (step: ProductionStep, index: number) => {
        const isUpdating = updatingSteps.has(step.id);
        const canStart = step.status === ProductionStepStatus.PENDING &&
            (index === 0 || steps[index - 1]?.status === ProductionStepStatus.COMPLETED);
        const canComplete = step.status === ProductionStepStatus.IN_PROGRESS;
        const isActive = step.status === ProductionStepStatus.IN_PROGRESS;

        return (
            <Card
                key={step.id}
                sx={{
                    mb: 2,
                    border: isActive ? `2px solid ${theme.palette.primary.main}` : 'none',
                    boxShadow: isActive ? theme.shadows[8] : theme.shadows[2]
                }}
            >
                <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                                sx={{
                                    bgcolor: isActive ? 'primary.main' : 'grey.300',
                                    width: 32,
                                    height: 32
                                }}
                            >
                                {index + 1}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {step.name}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip
                                        label={step.status.replace('_', ' ')}
                                        size="small"
                                        color={getStepStatusColor(step.status)}
                                    />
                                    {step.qualityCheckPassed === false && (
                                        <WarningIcon color="error" fontSize="small" />
                                    )}
                                    {step.qualityCheckPassed === true && (
                                        <QualityIcon color="success" fontSize="small" />
                                    )}
                                </Stack>
                            </Box>
                        </Box>

                        {isActive && (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="primary">
                                    {timer}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    minutes
                                </Typography>
                            </Box>
                        )}
                    </Stack>

                    {step.description && (
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            {step.description}
                        </Typography>
                    )}

                    {/* Progress and timing info */}
                    <Grid container spacing={2} mb={2}>
                        <Grid item xs={6}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Estimated Time
                                </Typography>
                                <Typography variant="body2">
                                    {step.estimatedMinutes || 'N/A'} min
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            {step.actualMinutes && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Actual Time
                                    </Typography>
                                    <Typography variant="body2">
                                        {step.actualMinutes} min
                                    </Typography>
                                </Box>
                            )}
                        </Grid>
                    </Grid>

                    {/* Action buttons */}
                    <Stack direction="row" spacing={1} mb={2}>
                        {canStart && (
                            <Button
                                variant="contained"
                                startIcon={isUpdating ? <CircularProgress size={16} /> : <PlayIcon />}
                                onClick={() => handleStartStep(step)}
                                disabled={isUpdating}
                                size="small"
                            >
                                Start
                            </Button>
                        )}

                        {canComplete && (
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={isUpdating ? <CircularProgress size={16} /> : <CheckIcon />}
                                onClick={() => handleCompleteStep(step)}
                                disabled={isUpdating}
                                size="small"
                            >
                                Complete
                            </Button>
                        )}

                        {isActive && (
                            <Button
                                variant="outlined"
                                startIcon={<QualityIcon />}
                                onClick={() => handleOpenQualityCheck(step)}
                                size="small"
                            >
                                Quality Check
                            </Button>
                        )}
                    </Stack>

                    {/* Notes input for active step */}
                    {isActive && (
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Add notes for this step..."
                            value={stepNotes[step.id] || ''}
                            onChange={(e) => setStepNotes({
                                ...stepNotes,
                                [step.id]: e.target.value
                            })}
                            multiline
                            rows={2}
                        />
                    )}

                    {/* Timing information */}
                    {(step.startedAt || step.completedAt) && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Timing Information
                            </Typography>
                            {step.startedAt && (
                                <Typography variant="caption" display="block">
                                    Started: {format(new Date(step.startedAt), 'MMM dd, HH:mm')}
                                </Typography>
                            )}
                            {step.completedAt && (
                                <Typography variant="caption" display="block">
                                    Completed: {format(new Date(step.completedAt), 'MMM dd, HH:mm')}
                                </Typography>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                TransitionComponent={Transition}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        height: isMobile ? '100vh' : '90vh',
                        maxHeight: isMobile ? '100vh' : '90vh',
                    }
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    {/* Header */}
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: 'primary.main',
                            color: 'white',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1
                        }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography variant="h6">
                                    {production?.name || 'Production Tracking'}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Real-time Production Monitoring
                                </Typography>
                            </Box>
                            <IconButton onClick={onClose} sx={{ color: 'white' }}>
                                <CloseIcon />
                            </IconButton>
                        </Stack>
                    </Box>

                    {/* Content */}
                    <Box sx={{ p: 2 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box>
                                {steps.map((step, index) => renderStepCard(step, index))}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Quality Check Dialog */}
            <Dialog
                open={qualityDialogOpen}
                onClose={() => setQualityDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogContent>
                    <Typography variant="h6" gutterBottom>
                        Quality Checkpoint - {selectedStepForQuality?.name}
                    </Typography>

                    <Stack spacing={3} sx={{ mt: 2 }}>
                        {/* Checkpoint type */}
                        <FormControl fullWidth>
                            <InputLabel>Checkpoint Type</InputLabel>
                            <Select
                                value={qualityCheckData.checkpointType}
                                onChange={(e) => setQualityCheckData({
                                    ...qualityCheckData,
                                    checkpointType: e.target.value
                                })}
                            >
                                <MenuItem value="pre-process">Pre-Process</MenuItem>
                                <MenuItem value="mid-process">Mid-Process</MenuItem>
                                <MenuItem value="post-process">Post-Process</MenuItem>
                                <MenuItem value="final-inspection">Final Inspection</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Quality status */}
                        <FormControl fullWidth>
                            <InputLabel>Quality Status</InputLabel>
                            <Select
                                value={qualityCheckData.qualityStatus}
                                onChange={(e) => setQualityCheckData({
                                    ...qualityCheckData,
                                    qualityStatus: e.target.value as 'PASS' | 'FAIL' | 'WARNING'
                                })}
                            >
                                <MenuItem value="PASS">Pass</MenuItem>
                                <MenuItem value="WARNING">Warning</MenuItem>
                                <MenuItem value="FAIL">Fail</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Measurements */}
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Measurements
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <TextField
                                        label="Temperature °F"
                                        type="number"
                                        value={qualityCheckData.measurements.temperature}
                                        onChange={(e) => setQualityCheckData({
                                            ...qualityCheckData,
                                            measurements: {
                                                ...qualityCheckData.measurements,
                                                temperature: Number(e.target.value)
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField
                                        label="Weight (g)"
                                        type="number"
                                        value={qualityCheckData.measurements.weight}
                                        onChange={(e) => setQualityCheckData({
                                            ...qualityCheckData,
                                            measurements: {
                                                ...qualityCheckData.measurements,
                                                weight: Number(e.target.value)
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField
                                        label="pH Level"
                                        type="number"
                                        value={qualityCheckData.measurements.ph}
                                        onChange={(e) => setQualityCheckData({
                                            ...qualityCheckData,
                                            measurements: {
                                                ...qualityCheckData.measurements,
                                                ph: Number(e.target.value)
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                        inputProps={{ step: 0.1, min: 0, max: 14 }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Notes */}
                        <TextField
                            label="Notes"
                            multiline
                            rows={3}
                            value={qualityCheckData.notes}
                            onChange={(e) => setQualityCheckData({
                                ...qualityCheckData,
                                notes: e.target.value
                            })}
                            fullWidth
                        />

                        {/* Action buttons */}
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button onClick={() => setQualityDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleLogQualityCheckpoint}
                                startIcon={<QualityIcon />}
                            >
                                Log Checkpoint
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default EnhancedProductionTracker;
