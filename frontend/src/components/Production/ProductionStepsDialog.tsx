import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
    Stack,
    Alert,
    Divider,
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Schedule as TimeIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';

import { CreateProductionStepData } from '../../types';

interface ProductionStep {
    id: string;
    name: string;
    description: string;
    estimatedMinutes: number;
    stepOrder: number;
    isDefault?: boolean;
    isCustom?: boolean;
}

interface ProductionStepsDialogProps {
    open: boolean;
    recipe: any;
    onClose: () => void;
    onConfirm: (steps: CreateProductionStepData[]) => void;
}

const ProductionStepsDialog: React.FC<ProductionStepsDialogProps> = ({
    open,
    recipe,
    onClose,
    onConfirm,
}) => {
    const [steps, setSteps] = useState<ProductionStep[]>([]);
    const [editingStep, setEditingStep] = useState<string | null>(null);
    const [newStepName, setNewStepName] = useState('');
    const [newStepDescription, setNewStepDescription] = useState('');
    const [newStepMinutes, setNewStepMinutes] = useState(15);
    const [showAddStep, setShowAddStep] = useState(false);

    useEffect(() => {
        if (open && recipe) {
            loadDefaultSteps();
        }
    }, [open, recipe]);

    const loadDefaultSteps = async () => {
        if (!recipe?.id) {
            console.error('No recipe ID available');
            return;
        }

        try {
            // Call API to get recipe-specific step templates
            const response = await fetch(`http://localhost:8000/api/production/step-templates/recipe/${recipe.id}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch step templates');
            }

            const data = await response.json();
            
            if (data.success && data.data) {
                setSteps(data.data);
                console.log('Loaded recipe-specific steps:', data.meta);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error loading step templates from API:', error);
            
            // Fallback to basic defaults only if API fails
            setSteps([
                {
                    id: 'prep',
                    name: 'Preparation',
                    description: 'Gather and prepare all ingredients',
                    estimatedMinutes: 15,
                    stepOrder: 1,
                    isDefault: true
                },
                {
                    id: 'production',
                    name: 'Production',
                    description: 'Mix, bake, or process according to recipe',
                    estimatedMinutes: 60,
                    stepOrder: 2,
                    isDefault: true
                },
                {
                    id: 'quality',
                    name: 'Quality Check',
                    description: 'Inspect product quality and standards',
                    estimatedMinutes: 10,
                    stepOrder: 3,
                    isDefault: true
                },
                {
                    id: 'packaging',
                    name: 'Packaging',
                    description: 'Package finished products for inventory',
                    estimatedMinutes: 15,
                    stepOrder: 4,
                    isDefault: true
                }
            ]);
        }
    };

    const handleAddStep = () => {
        if (!newStepName.trim()) return;

        const newStep: ProductionStep = {
            id: `custom-${Date.now()}`,
            name: newStepName.trim(),
            description: newStepDescription.trim(),
            estimatedMinutes: newStepMinutes,
            stepOrder: steps.length + 1,
            isCustom: true
        };

        setSteps([...steps, newStep]);
        setNewStepName('');
        setNewStepDescription('');
        setNewStepMinutes(15);
        setShowAddStep(false);
    };

    const handleRemoveStep = (stepId: string) => {
        const updatedSteps = steps
            .filter(step => step.id !== stepId)
            .map((step, index) => ({
                ...step,
                stepOrder: index + 1
            }));
        setSteps(updatedSteps);
    };

    const handleEditStep = (stepId: string, field: string, value: any) => {
        setSteps(steps.map(step =>
            step.id === stepId
                ? { ...step, [field]: value }
                : step
        ));
    };

    const moveStep = (stepId: string, direction: 'up' | 'down') => {
        const currentIndex = steps.findIndex(step => step.id === stepId);
        if (
            (direction === 'up' && currentIndex <= 0) ||
            (direction === 'down' && currentIndex >= steps.length - 1)
        ) {
            return;
        }

        const newSteps = [...steps];
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        [newSteps[currentIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[currentIndex]];

        // Update step orders
        newSteps.forEach((step, index) => {
            step.stepOrder = index + 1;
        });

        setSteps(newSteps);
    };

    const getTotalTime = () => {
        return steps.reduce((total, step) => total + step.estimatedMinutes, 0);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, maxHeight: '90vh' }
            }}
        >
            <DialogTitle sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative'
            }}>
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
                <Typography variant="h5" sx={{ fontWeight: 'bold', pr: 5 }}>
                    🛠️ Customize Production Steps
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 0.5 }}>
                    {recipe?.name} • {getTotalTime()} minutes total
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Customize your production workflow. You can add, remove, or reorder steps as needed.
                </Alert>

                {/* Current Steps */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Production Steps
                    </Typography>

                    <Stack spacing={2}>
                        {steps.map((step, index) => (
                            <Card key={step.id} variant="outlined" sx={{ position: 'relative' }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => moveStep(step.id, 'up')}
                                                disabled={index === 0}
                                            >
                                                ↑
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => moveStep(step.id, 'down')}
                                                disabled={index === steps.length - 1}
                                            >
                                                ↓
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Chip
                                                    label={`Step ${step.stepOrder}`}
                                                    size="small"
                                                    color="primary"
                                                />
                                                {step.isDefault && (
                                                    <Chip label="Default" size="small" variant="outlined" />
                                                )}
                                                {step.isCustom && (
                                                    <Chip label="Custom" size="small" color="secondary" />
                                                )}
                                            </Box>

                                            {editingStep === step.id ? (
                                                <Stack spacing={2}>
                                                    <TextField
                                                        fullWidth
                                                        value={step.name}
                                                        onChange={(e) => handleEditStep(step.id, 'name', e.target.value)}
                                                        size="small"
                                                        label="Step Name"
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        value={step.description}
                                                        onChange={(e) => handleEditStep(step.id, 'description', e.target.value)}
                                                        size="small"
                                                        label="Description"
                                                        multiline
                                                        rows={2}
                                                    />
                                                    <TextField
                                                        type="number"
                                                        value={step.estimatedMinutes}
                                                        onChange={(e) => handleEditStep(step.id, 'estimatedMinutes', Number(e.target.value))}
                                                        size="small"
                                                        label="Estimated Minutes"
                                                        sx={{ width: 150 }}
                                                    />
                                                    <Box>
                                                        <Button
                                                            startIcon={<SaveIcon />}
                                                            onClick={() => setEditingStep(null)}
                                                            size="small"
                                                            sx={{ mr: 1 }}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            startIcon={<CancelIcon />}
                                                            onClick={() => setEditingStep(null)}
                                                            size="small"
                                                            color="secondary"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </Box>
                                                </Stack>
                                            ) : (
                                                <>
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                        {step.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        {step.description}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <TimeIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            {step.estimatedMinutes} minutes
                                                        </Typography>
                                                    </Box>
                                                </>
                                            )}
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {editingStep !== step.id && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setEditingStep(step.id)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleRemoveStep(step.id)}
                                                disabled={step.isDefault && steps.filter(s => s.isDefault).length <= 2}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Add Custom Step */}
                <Box>
                    {!showAddStep ? (
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => setShowAddStep(true)}
                            variant="outlined"
                            fullWidth
                            sx={{ py: 2 }}
                        >
                            Add Custom Step
                        </Button>
                    ) : (
                        <Card variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Add Custom Step
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    value={newStepName}
                                    onChange={(e) => setNewStepName(e.target.value)}
                                    label="Step Name"
                                    placeholder="e.g., Special Decoration"
                                />
                                <TextField
                                    fullWidth
                                    value={newStepDescription}
                                    onChange={(e) => setNewStepDescription(e.target.value)}
                                    label="Description"
                                    placeholder="Describe what happens in this step"
                                    multiline
                                    rows={2}
                                />
                                <TextField
                                    type="number"
                                    value={newStepMinutes}
                                    onChange={(e) => setNewStepMinutes(Number(e.target.value))}
                                    label="Estimated Minutes"
                                    sx={{ width: 200 }}
                                />
                                <Box>
                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={handleAddStep}
                                        variant="contained"
                                        disabled={!newStepName.trim()}
                                        sx={{ mr: 1 }}
                                    >
                                        Add Step
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowAddStep(false);
                                            setNewStepName('');
                                            setNewStepDescription('');
                                            setNewStepMinutes(15);
                                        }}
                                        color="secondary"
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Stack>
                        </Card>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        const convertedSteps: CreateProductionStepData[] = steps.map(step => ({
                            name: step.name,
                            description: step.description,
                            stepOrder: step.stepOrder,
                            estimatedMinutes: step.estimatedMinutes
                        }));
                        onConfirm(convertedSteps);
                    }}
                    variant="contained"
                    disabled={steps.length === 0}
                >
                    Use These Steps ({steps.length} steps • {getTotalTime()} min)
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductionStepsDialog;
