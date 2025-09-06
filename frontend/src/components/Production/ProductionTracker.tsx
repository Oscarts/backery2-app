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
    Collapse,
} from '@mui/material';
import {
    Close as CloseIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Check as CheckIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Timer as TimerIcon,
    Notes as NotesIcon,
    TrendingUp as ProgressIcon,
    Kitchen as KitchenIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { ProductionRun, ProductionStepStatus, ProductionStatus } from '../../types/index';
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
    production: ProductionRun;
    onClose: () => void;
    onCompleteStep: (stepId: string, data?: any) => void;
    onAddStep: (data: any) => void;
    onPause: () => void;
    onResume: () => void;
    onComplete: () => void;
}

const ProductionTracker: React.FC<ProductionTrackerProps> = ({
    open,
    production,
    onClose,
    onCompleteStep,
    onAddStep,
    onPause,
    onResume,
    onComplete,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [timer, setTimer] = useState(0);
    const [showAddStep, setShowAddStep] = useState(false);
    const [newStepName, setNewStepName] = useState('');
    const [stepNotes, setStepNotes] = useState<{ [key: string]: string }>({});

    const steps = production.steps || [];
    const currentStep = steps.find(s => s.status === ProductionStepStatus.IN_PROGRESS);
    const completedSteps = steps.filter(s => s.status === ProductionStepStatus.COMPLETED).length;
    const progressPercentage = (completedSteps / steps.length) * 100;

    // Timer for current step
    useEffect(() => {
        if (currentStep && production.status === ProductionStatus.IN_PROGRESS) {
            const interval = setInterval(() => {
                const startTime = new Date(currentStep.startedAt!).getTime();
                const now = new Date().getTime();
                setTimer(Math.floor((now - startTime) / 1000 / 60)); // minutes
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [currentStep, production.status]);

    const getStepStatusIcon = (step: any) => {
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

    const getStepStatusColor = (step: any) => {
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

    const handleCompleteStep = (step: any) => {
        const notes = stepNotes[step.id] || '';
        onCompleteStep(step.id, {
            actualMinutes: timer,
            notes: notes.trim() || undefined,
        });
        setStepNotes({ ...stepNotes, [step.id]: '' });
    };

    const handleAddCustomStep = () => {
        if (newStepName.trim()) {
            onAddStep({
                name: newStepName,
                insertAfter: currentStep?.stepOrder || steps.length,
                estimatedMinutes: 10,
            });
            setNewStepName('');
            setShowAddStep(false);
        }
    };

    const allStepsCompleted = steps.every(s =>
        s.status === ProductionStepStatus.COMPLETED || s.status === ProductionStepStatus.SKIPPED
    );

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

                {/* Steps List */}
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

                                            {step.estimatedMinutes && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Estimated: {step.estimatedMinutes} minutes
                                                </Typography>
                                            )}

                                            {/* Step Actions */}
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

                        {/* Add Custom Step */}
                        <Collapse in={showAddStep}>
                            <Card variant="outlined" sx={{ border: '2px dashed', borderColor: 'primary.main' }}>
                                <CardContent>
                                    <TextField
                                        placeholder="What additional step do you need?"
                                        fullWidth
                                        value={newStepName}
                                        onChange={(e) => setNewStepName(e.target.value)}
                                        sx={{ mb: 2 }}
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setShowAddStep(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleAddCustomStep}
                                            disabled={!newStepName.trim()}
                                        >
                                            Add Step
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Collapse>
                    </Stack>
                </Box>

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
                    {!showAddStep && (
                        <Fab
                            color="secondary"
                            onClick={() => setShowAddStep(true)}
                            size="medium"
                        >
                            <AddIcon />
                        </Fab>
                    )}

                    {production.status === ProductionStatus.IN_PROGRESS && (
                        <Fab
                            color="warning"
                            onClick={onPause}
                            size="medium"
                        >
                            <PauseIcon />
                        </Fab>
                    )}

                    {production.status === ProductionStatus.ON_HOLD && (
                        <Fab
                            color="primary"
                            onClick={onResume}
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
                            onClick={onComplete}
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
                            Continue with the current step to progress your production
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
