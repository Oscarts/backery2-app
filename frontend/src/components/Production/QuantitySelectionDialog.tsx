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
    Slider,
    Card,
    Chip,
    LinearProgress,
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    CheckCircle as CheckIcon,
    TrendingUp as TrendingUpIcon,
    Schedule as TimeIcon,
    AttachMoney as CostIcon,
    Kitchen as KitchenIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface QuantitySelectionDialogProps {
    open: boolean;
    recipe: any;
    onClose: () => void;
    onConfirm: (quantity: number) => void;
}

const QuantitySelectionDialog: React.FC<QuantitySelectionDialogProps> = ({
    open,
    recipe,
    onClose,
    onConfirm,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [quantity, setQuantity] = useState(recipe?.yieldQuantity || 12);

    useEffect(() => {
        if (recipe) {
            setQuantity(recipe.yieldQuantity);
        }
    }, [recipe]);

    if (!recipe) return null;

    const maxQuantity = recipe.maxQuantity || recipe.yieldQuantity * 4;
    const batchMultiplier = quantity / recipe.yieldQuantity;
    const estimatedTime = Math.round((recipe.prepTime + recipe.cookTime) * batchMultiplier);
    const estimatedCost = recipe.estimatedCost * batchMultiplier;

    const handleQuantityChange = (newQuantity: number) => {
        const clampedQuantity = Math.min(Math.max(newQuantity, recipe.yieldQuantity), maxQuantity);
        setQuantity(clampedQuantity);
    };

    const handleSliderChange = (_: Event, newValue: number | number[]) => {
        const value = Array.isArray(newValue) ? newValue[0] : newValue;
        handleQuantityChange(value);
    };

    const quickQuantities = [
        recipe.yieldQuantity,
        recipe.yieldQuantity * 2,
        recipe.yieldQuantity * 3,
        recipe.yieldQuantity * 4,
    ].filter(q => q <= maxQuantity);

    const handleConfirm = () => {
        onConfirm(quantity);
    };

    const getProgressColor = () => {
        if (batchMultiplier <= 1) return 'success';
        if (batchMultiplier <= 2) return 'info';
        if (batchMultiplier <= 3) return 'warning';
        return 'error';
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

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h3" sx={{ fontSize: '3rem' }}>
                            {recipe.emoji}
                        </Typography>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                {recipe.name}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                                How many do you want to make?
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Main Content */}
                <Box sx={{ p: 3 }}>
                    {/* Quick Selection Buttons */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            🎯 Quick Select
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                            {quickQuantities.map((quickQuantity) => (
                                <Button
                                    key={quickQuantity}
                                    variant={quantity === quickQuantity ? 'contained' : 'outlined'}
                                    onClick={() => handleQuantityChange(quickQuantity)}
                                    sx={{
                                        minWidth: 120,
                                        height: 60,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 2,
                                    }}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {quickQuantity}
                                    </Typography>
                                    <Typography variant="caption">
                                        {quickQuantity / recipe.yieldQuantity}x batch
                                    </Typography>
                                </Button>
                            ))}
                        </Stack>
                    </Box>

                    {/* Custom Quantity Slider */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            📏 Custom Amount
                        </Typography>

                        <Card variant="outlined" sx={{ p: 3, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <IconButton
                                    onClick={() => handleQuantityChange(quantity - recipe.yieldQuantity)}
                                    disabled={quantity <= recipe.yieldQuantity}
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        '&:disabled': { bgcolor: 'grey.300' }
                                    }}
                                >
                                    <RemoveIcon />
                                </IconButton>

                                <Box sx={{ flexGrow: 1, mx: 2 }}>
                                    <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 1 }}>
                                        {quantity} {recipe.yieldUnit}
                                    </Typography>
                                    <Slider
                                        value={quantity}
                                        onChange={handleSliderChange}
                                        min={recipe.yieldQuantity}
                                        max={maxQuantity}
                                        step={recipe.yieldQuantity}
                                        valueLabelDisplay="auto"
                                        sx={{
                                            height: 8,
                                            '& .MuiSlider-thumb': {
                                                width: 24,
                                                height: 24,
                                            },
                                            '& .MuiSlider-track': {
                                                border: 'none',
                                            },
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                        <Typography variant="caption">
                                            Min: {recipe.yieldQuantity}
                                        </Typography>
                                        <Typography variant="caption">
                                            Max: {maxQuantity}
                                        </Typography>
                                    </Box>
                                </Box>

                                <IconButton
                                    onClick={() => handleQuantityChange(quantity + recipe.yieldQuantity)}
                                    disabled={quantity >= maxQuantity}
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        '&:disabled': { bgcolor: 'grey.300' }
                                    }}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>

                            {/* Batch Multiplier Indicator */}
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">
                                        Recipe Multiplier
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {batchMultiplier.toFixed(1)}x
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min((batchMultiplier / 4) * 100, 100)}
                                    color={getProgressColor()}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {batchMultiplier <= 1 && "Perfect single batch"}
                                    {batchMultiplier > 1 && batchMultiplier <= 2 && "Easy double batch"}
                                    {batchMultiplier > 2 && batchMultiplier <= 3 && "Large batch - manageable"}
                                    {batchMultiplier > 3 && "Very large batch - consider splitting"}
                                </Typography>
                            </Box>
                        </Card>
                    </Box>

                    {/* Production Estimates */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            📊 Production Estimates
                        </Typography>

                        <Stack spacing={2}>
                            <Card variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TimeIcon color="primary" />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2">Total Time</Typography>
                                        <Typography variant="h6" color="primary">
                                            ~{estimatedTime} minutes
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={estimatedTime > 120 ? "Long session" : estimatedTime > 60 ? "Medium session" : "Quick session"}
                                        color={estimatedTime > 120 ? "error" : estimatedTime > 60 ? "warning" : "success"}
                                        variant="outlined"
                                    />
                                </Box>
                            </Card>

                            <Card variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CostIcon color="primary" />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2">Estimated Cost</Typography>
                                        <Typography variant="h6" color="primary">
                                            ${estimatedCost.toFixed(2)}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`$${(estimatedCost / quantity).toFixed(2)} per ${recipe.yieldUnit.slice(0, -1)}`}
                                        variant="outlined"
                                    />
                                </Box>
                            </Card>

                            <Card variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <KitchenIcon color="primary" />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2">Equipment Check</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {batchMultiplier <= 2 ? "Standard equipment OK" : "May need larger mixing bowls"}
                                        </Typography>
                                    </Box>
                                    <CheckIcon color="success" />
                                </Box>
                            </Card>
                        </Stack>
                    </Box>

                    {/* Availability Warning */}
                    {!recipe.canMake && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                ⚠️ Cannot start production
                            </Typography>
                            <Typography variant="body2">
                                {recipe.shortage}. Please restock ingredients first.
                            </Typography>
                        </Alert>
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
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            sx={{ flex: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleConfirm}
                            disabled={!recipe.canMake}
                            sx={{ flex: 2 }}
                            startIcon={<TrendingUpIcon />}
                        >
                            🚀 Start Production!
                        </Button>
                    </Stack>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default QuantitySelectionDialog;
