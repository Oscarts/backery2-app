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
    Add as AddIcon,
    Delete as DeleteIcon,
    Celebration as CelebrationIcon,
    CheckCircle as CheckCircleIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { ProductionRun, ProductionStep, ProductionStepStatus, ProductionStatus } from '../../types/index';
import { productionApi } from '../../services/realApi';
import Confetti from 'react-confetti';
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

    // Step management state
    const [addStepDialogOpen, setAddStepDialogOpen] = useState(false);
    const [insertAfterStepId, setInsertAfterStepId] = useState<string | null>(null);
    const [newStepData, setNewStepData] = useState({
        name: '',
        description: '',
        estimatedMinutes: 30
    });

    // Production completion celebration state
    const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
    const [completedProductionData, setCompletedProductionData] = useState<any>(null);

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
                
                // Debug: Log the complete response to understand the structure
                console.log('🔍 Complete API response:', response);
                console.log('🔍 Response data:', response.data);
                
                // Check if production is completed (from API response)
                if (response.data && (response.data as any).productionCompleted === true) {
                    
                    console.log('🎉 Production auto-completed! Triggering celebration...');
                    
                    // Use completedProductionRun if available, otherwise use production data
                    const productionData = (response.data as any).completedProductionRun || production;
                    console.log('📊 Using production data for celebration:', productionData);
                    
                    // Trigger celebration immediately for automatic completion
                    setCompletedProductionData(productionData);
                    setShowCompletionCelebration(true);
                } else {
                    console.log('⏳ Production not completed yet, step finished successfully');
                    console.log('   - productionCompleted:', (response.data as any)?.productionCompleted);
                    console.log('   - completedProductionRun:', !!(response.data as any)?.completedProductionRun);
                }
                
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

    // Step management functions
    const handleAddStep = async () => {
        if (!production?.id || !newStepData.name.trim()) return;

        try {
            setLoading(true);
            const response = await productionApi.addStep(production.id, {
                name: newStepData.name.trim(),
                description: newStepData.description.trim(),
                estimatedMinutes: newStepData.estimatedMinutes,
                insertAfterStepId: insertAfterStepId || undefined
            });

            if (response.success && response.data) {
                setSteps(response.data.allSteps);
                setAddStepDialogOpen(false);
                setNewStepData({ name: '', description: '', estimatedMinutes: 30 });
                setInsertAfterStepId(null);
                onProductionUpdated?.();
            } else {
                setError('Failed to add step');
            }
        } catch (error) {
            console.error('Error adding step:', error);
            setError('Failed to add step');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStep = async (stepId: string) => {
        if (!stepId) return;

        try {
            setLoading(true);
            const response = await productionApi.removeStep(stepId);

            if (response.success && response.data) {
                setSteps(response.data.allSteps);
                onProductionUpdated?.();
            } else {
                setError('Failed to remove step');
            }
        } catch (error) {
            console.error('Error removing step:', error);
            setError('Failed to remove step');
        } finally {
            setLoading(false);
        }
    };

    const canRemoveStep = (step: ProductionStep) => {
        return step.status === ProductionStepStatus.PENDING && 
               production?.status !== 'COMPLETED' && 
               production?.status !== 'CANCELLED';
    };

    const canAddSteps = () => {
        return production?.status !== 'COMPLETED' && 
               production?.status !== 'CANCELLED';
    };

    // Check if we should show the finish production button
    // Show when: all steps completed OR only one step remaining (to give user control)
    const allStepsCompleted = () => {
        if (steps.length === 0) return false;
        if (production?.status === 'COMPLETED') return false;
        
        const completedSteps = steps.filter(step => step.status === ProductionStepStatus.COMPLETED);
        const inProgressSteps = steps.filter(step => step.status === ProductionStepStatus.IN_PROGRESS);
        const pendingSteps = steps.filter(step => step.status === ProductionStepStatus.PENDING);
        
        // Show button if all steps are completed (manual finish needed)
        if (completedSteps.length === steps.length) {
            console.log('🎯 All steps completed - showing finish button');
            return true;
        }
        
        // Show button if only one step remains (giving user control before auto-completion)
        if (pendingSteps.length === 1 && inProgressSteps.length === 0) {
            console.log('🎯 One step remaining - showing finish button for user control');
            return true;
        }
        
        return false;
    };

    // Handle manual production completion with proper UX flow
    const handleFinishProduction = async () => {
        if (!production?.id) {
            console.error('❌ No production ID available for finishing');
            return;
        }

        console.log('🎯 User initiated production completion for:', production.id);
        console.log('📊 Current production status:', production.status);
        console.log('✅ All steps completed, proceeding with manual finish...');

        try {
            setLoading(true);
            
            // Call API to manually finish the production
            const response = await productionApi.updateRun(production.id, {
                status: 'COMPLETED' as any,
                completedAt: new Date().toISOString(),
                notes: 'Production manually completed by user'
            });

            console.log('🔄 API response received:', response);

            if (response.success && response.data) {
                console.log('🎉 Production successfully completed, triggering celebration!');
                
                // Trigger celebration with the completed production data
                setCompletedProductionData(response.data);
                setShowCompletionCelebration(true);
                
                // Refresh production data
                onProductionUpdated?.();
                
                console.log('🎊 Celebration state activated');
            } else {
                console.error('❌ Failed to complete production:', response);
                setError('Failed to finish production. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error finishing production:', error);
            setError('Failed to finish production. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle completion celebration
    const handleCompletionCelebration = () => {
        console.log('🎊 Starting completion celebration timer...');
        // Auto-close after celebration
        setTimeout(() => {
            console.log('🎊 Celebration timer finished, closing dialog...');
            setShowCompletionCelebration(false);
            setCompletedProductionData(null);
            onClose(); // Close the production tracker
        }, 3000); // Keep celebration open for 3 seconds
    };

    // Trigger celebration effect when completion dialog opens
    useEffect(() => {
        console.log('🎊 Celebration useEffect triggered:', { 
            showCompletionCelebration, 
            hasCompletedData: !!completedProductionData 
        });
        if (showCompletionCelebration && completedProductionData) {
            console.log('🎊 Triggering celebration handler...');
            handleCompletionCelebration();
        }
    }, [showCompletionCelebration, completedProductionData]);

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

                        {/* Step Management Buttons */}
                        {canAddSteps() && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setInsertAfterStepId(step.id);
                                    setAddStepDialogOpen(true);
                                }}
                            >
                                Add After
                            </Button>
                        )}

                        {canRemoveStep(step) && (
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleRemoveStep(step.id)}
                                disabled={loading}
                            >
                                Remove
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
                            <Box sx={{ position: 'relative' }}>
                                {steps.map((step, index) => renderStepCard(step, index))}
                                
                                {/* Finish Production Confirmation Button */}
                                {allStepsCompleted() && (
                                    <Card 
                                        sx={{ 
                                            mt: 2, 
                                            border: '3px solid',
                                            borderColor: 'success.main',
                                            bgcolor: 'success.light',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                                            '&:hover': {
                                                bgcolor: 'success.main',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                                                '& .MuiTypography-root': {
                                                    color: 'white'
                                                },
                                                '& .MuiSvgIcon-root': {
                                                    color: 'white'
                                                }
                                            }
                                        }}
                                        onClick={handleFinishProduction}
                                    >
                                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                            <CelebrationIcon sx={{ fontSize: 56, color: 'success.dark', mb: 1 }} />
                                            {steps.every(step => step.status === ProductionStepStatus.COMPLETED) ? (
                                                <>
                                                    <Typography variant="h5" color="success.dark" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                        🎉 Finish Production
                                                    </Typography>
                                                    <Typography variant="body1" color="success.dark" sx={{ mb: 1, fontWeight: 500 }}>
                                                        All steps completed successfully!
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Click to finish this production and celebrate 🎊
                                                    </Typography>
                                                </>
                                            ) : (
                                                <>
                                                    <Typography variant="h5" color="success.dark" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                        🚀 Ready to Finish
                                                    </Typography>
                                                    <Typography variant="body1" color="success.dark" sx={{ mb: 1, fontWeight: 500 }}>
                                                        Production is almost complete!
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Finish now or add more steps as needed
                                                    </Typography>
                                                </>
                                            )}
                                            <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                You can still add more steps if needed before finishing
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Add Step at End Button */}
                                {canAddSteps() && (
                                    <Card 
                                        sx={{ 
                                            mt: 2, 
                                            border: '2px dashed',
                                            borderColor: 'primary.main',
                                            bgcolor: 'action.hover',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: 'action.selected',
                                            }
                                        }}
                                        onClick={() => {
                                            setInsertAfterStepId(null);
                                            setAddStepDialogOpen(true);
                                        }}
                                    >
                                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                            <AddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                            <Typography variant="h6" color="primary">
                                                Add New Step
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Click to add a step at the end
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                )}
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

            {/* Add Step Dialog */}
            <Dialog
                open={addStepDialogOpen}
                onClose={() => setAddStepDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogContent>
                    <Typography variant="h6" gutterBottom>
                        Add New Production Step
                    </Typography>
                    {insertAfterStepId && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            This step will be inserted after: {steps.find(s => s.id === insertAfterStepId)?.name}
                        </Typography>
                    )}

                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            label="Step Name"
                            value={newStepData.name}
                            onChange={(e) => setNewStepData({
                                ...newStepData,
                                name: e.target.value
                            })}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Description"
                            value={newStepData.description}
                            onChange={(e) => setNewStepData({
                                ...newStepData,
                                description: e.target.value
                            })}
                            multiline
                            rows={2}
                            fullWidth
                        />

                        <TextField
                            label="Estimated Minutes"
                            type="number"
                            value={newStepData.estimatedMinutes}
                            onChange={(e) => setNewStepData({
                                ...newStepData,
                                estimatedMinutes: parseInt(e.target.value) || 30
                            })}
                            fullWidth
                            inputProps={{ min: 1, max: 999 }}
                        />

                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button 
                                onClick={() => {
                                    setAddStepDialogOpen(false);
                                    setNewStepData({ name: '', description: '', estimatedMinutes: 30 });
                                    setInsertAfterStepId(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleAddStep}
                                disabled={!newStepData.name.trim() || loading}
                                startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
                            >
                                Add Step
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Production Completion Celebration Dialog */}
            <Dialog
                open={showCompletionCelebration}
                maxWidth="md"
                fullWidth
                disableEscapeKeyDown
                PaperProps={{
                    sx: {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        textAlign: 'center',
                        borderRadius: 3,
                        overflow: 'visible',
                        position: 'relative',
                        minHeight: '400px'
                    }
                }}
                sx={{
                    zIndex: 10000,
                    '& .MuiBackdrop-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)'
                    }
                }}
            >
                {/* Confetti Effect */}
                {showCompletionCelebration && (
                    <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}>
                        <Confetti
                            width={typeof window !== 'undefined' ? window.innerWidth : 1000}
                            height={typeof window !== 'undefined' ? window.innerHeight : 800}
                            recycle={false}
                            numberOfPieces={200}
                            gravity={0.3}
                        />
                    </Box>
                )}
                
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%)',
                        backgroundSize: '20px 20px',
                        animation: 'sparkle 2s linear infinite',
                        '@keyframes sparkle': {
                            '0%': { backgroundPosition: '0 0, 0 0' },
                            '100%': { backgroundPosition: '20px 20px, -20px 20px' }
                        }
                    }}
                />
                
                <DialogContent sx={{ py: 6, px: 4, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ mb: 3 }}>
                        <Box
                            sx={{
                                fontSize: '6rem',
                                mb: 2,
                                animation: 'bounce 1s ease-in-out infinite alternate',
                                '@keyframes bounce': {
                                    '0%': { transform: 'translateY(0)' },
                                    '100%': { transform: 'translateY(-10px)' }
                                }
                            }}
                        >
                            🎉
                        </Box>
                        
                        <Typography 
                            variant="h3" 
                            sx={{ 
                                fontWeight: 'bold', 
                                mb: 2,
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                animation: 'fadeInUp 0.8s ease-out',
                                '@keyframes fadeInUp': {
                                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                                    '100%': { opacity: 1, transform: 'translateY(0)' }
                                }
                            }}
                        >
                            Production Complete!
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                            <StarIcon sx={{ 
                                fontSize: '2rem', 
                                color: '#FFD700', 
                                animation: 'twinkle 1.5s ease-in-out infinite alternate',
                                '@keyframes twinkle': {
                                    '0%': { transform: 'scale(1) rotate(0deg)', opacity: 0.7 },
                                    '100%': { transform: 'scale(1.2) rotate(180deg)', opacity: 1 }
                                }
                            }} />
                            <StarIcon sx={{ 
                                fontSize: '2rem', 
                                color: '#FFD700', 
                                animation: 'twinkle 1.5s ease-in-out infinite alternate 0.3s',
                                '@keyframes twinkle': {
                                    '0%': { transform: 'scale(1) rotate(0deg)', opacity: 0.7 },
                                    '100%': { transform: 'scale(1.2) rotate(180deg)', opacity: 1 }
                                }
                            }} />
                            <StarIcon sx={{ 
                                fontSize: '2rem', 
                                color: '#FFD700', 
                                animation: 'twinkle 1.5s ease-in-out infinite alternate 0.6s',
                                '@keyframes twinkle': {
                                    '0%': { transform: 'scale(1) rotate(0deg)', opacity: 0.7 },
                                    '100%': { transform: 'scale(1.2) rotate(180deg)', opacity: 1 }
                                }
                            }} />
                        </Box>
                    </Box>

                    {completedProductionData && (
                        <Box
                            sx={{
                                background: 'rgba(255,255,255,0.15)',
                                borderRadius: 2,
                                p: 3,
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                animation: 'slideInUp 1s ease-out 0.5s both',
                                '@keyframes slideInUp': {
                                    '0%': { opacity: 0, transform: 'translateY(50px)' },
                                    '100%': { opacity: 1, transform: 'translateY(0)' }
                                }
                            }}
                        >
                            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                                🧁 {completedProductionData.name}
                            </Typography>
                            
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        Quantity Produced
                                    </Typography>
                                    <Typography variant="h6">
                                        {completedProductionData.finalQuantity || completedProductionData.targetQuantity} {completedProductionData.targetUnit}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        Total Time
                                    </Typography>
                                    <Typography variant="h6">
                                        {completedProductionData.actualMinutes || 'N/A'} minutes
                                    </Typography>
                                </Grid>
                            </Grid>

                            {completedProductionData.actualCost && (
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    💰 Total Cost: ${completedProductionData.actualCost.toFixed(2)}
                                </Typography>
                            )}
                        </Box>
                    )}

                    <Typography 
                        variant="h6" 
                        sx={{ 
                            mt: 3, 
                            opacity: 0.9,
                            animation: 'fadeIn 1s ease-out 1s both',
                            '@keyframes fadeIn': {
                                '0%': { opacity: 0 },
                                '100%': { opacity: 0.9 }
                            }
                        }}
                    >
                        Your delicious products are ready! 🍰
                    </Typography>

                    <Typography 
                        variant="body2" 
                        sx={{ 
                            mt: 2, 
                            opacity: 0.7,
                            animation: 'fadeIn 1s ease-out 1.5s both'
                        }}
                    >
                        Automatically closing in 3 seconds...
                    </Typography>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default EnhancedProductionTracker;
