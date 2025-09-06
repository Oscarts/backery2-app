import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Stack,
    Chip,
    Alert,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Smartphone as PhoneIcon,
    Tablet as TabletIcon,
    Computer as DesktopIcon
} from '@mui/icons-material';

const ProductionMobileDemo: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

    const getDeviceInfo = () => {
        if (isMobile) return { icon: <PhoneIcon />, name: 'Mobile', color: 'primary' };
        if (isTablet) return { icon: <TabletIcon />, name: 'Tablet', color: 'secondary' };
        return { icon: <DesktopIcon />, name: 'Desktop', color: 'success' };
    };

    const device = getDeviceInfo();

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📱 Mobile-First Production UI
                </Typography>
                <Chip
                    icon={device.icon}
                    label={`Viewing on ${device.name}`}
                    color={device.color as any}
                    variant="outlined"
                    sx={{ mb: 2 }}
                />
                <Typography variant="body1" color="text.secondary">
                    This interface is optimized for mobile devices and kitchen use
                </Typography>
            </Box>

            <Stack spacing={3}>
                {/* Mobile Features */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            🌟 Mobile-First Features
                        </Typography>
                        <Stack spacing={1}>
                            <Alert severity="info" variant="outlined">
                                ✨ Touch-friendly buttons (minimum 44px touch targets)
                            </Alert>
                            <Alert severity="success" variant="outlined">
                                📱 Responsive design that works on all screen sizes
                            </Alert>
                            <Alert severity="info" variant="outlined">
                                🎨 Visual recipe cards with large emojis
                            </Alert>
                            <Alert severity="success" variant="outlined">
                                ⚡ Real-time progress tracking with animations
                            </Alert>
                            <Alert severity="info" variant="outlined">
                                🔄 Swipe gestures and touch interactions
                            </Alert>
                            <Alert severity="success" variant="outlined">
                                🌙 Dark mode and accessibility support
                            </Alert>
                        </Stack>
                    </CardContent>
                </Card>

                {/* UI Demo Buttons */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            🎯 Touch Interface Demo
                        </Typography>
                        <Stack spacing={2}>
                            <Button
                                variant="contained"
                                fullWidth
                                className="production-action-button"
                                sx={{
                                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #667eea 60%, #764ba2 100%)',
                                    }
                                }}
                            >
                                🚀 Start Production (Primary Action)
                            </Button>

                            <Button
                                variant="outlined"
                                fullWidth
                                className="production-touch-button"
                                color="primary"
                            >
                                📋 View Active Productions
                            </Button>

                            <Button
                                variant="contained"
                                fullWidth
                                className="production-action-button"
                                sx={{
                                    background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                                }}
                            >
                                ✅ Complete Step
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Recipe Card Demo */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            🧁 Recipe Card Example
                        </Typography>
                        <Card
                            className="recipe-card elevated-card"
                            sx={{
                                border: 2,
                                borderColor: 'success.light',
                                cursor: 'pointer',
                                p: 2,
                                textAlign: 'center'
                            }}
                        >
                            <Typography className="recipe-emoji">🧁</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                                Chocolate Cupcakes
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Rich, moist chocolate cupcakes
                            </Typography>
                            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                                <Chip label="Easy" color="success" size="small" />
                                <Chip label="35 min" color="info" size="small" />
                                <Chip label="$2.50" color="primary" size="small" />
                            </Stack>
                            <Alert severity="success" variant="outlined">
                                ✅ Ready to make up to 48 cupcakes
                            </Alert>
                        </Card>
                    </CardContent>
                </Card>

                {/* Progress Demo */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            📊 Production Progress Example
                        </Typography>
                        <Box sx={{ p: 2, border: 1, borderColor: 'primary.light', borderRadius: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                24 Chocolate Cupcakes
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Batch: CC-20250906-001
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Progress</Typography>
                                    <Typography variant="body2" color="primary">60%</Typography>
                                </Box>
                                <Box className="production-progress" sx={{
                                    height: 8,
                                    backgroundColor: 'grey.200',
                                    borderRadius: 4,
                                    overflow: 'hidden'
                                }}>
                                    <Box sx={{
                                        width: '60%',
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                        borderRadius: 4
                                    }} />
                                </Box>
                            </Box>
                            <Alert severity="info" variant="outlined">
                                Current Step: Mix batter (~10 minutes)
                            </Alert>
                        </Box>
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            📖 How to Use
                        </Typography>
                        <Stack spacing={1}>
                            <Typography variant="body2">
                                1. <strong>Tap "Production"</strong> in the navigation to access the production center
                            </Typography>
                            <Typography variant="body2">
                                2. <strong>Tap the big "+" button</strong> to start a new production run
                            </Typography>
                            <Typography variant="body2">
                                3. <strong>Select a recipe</strong> from the visual cards
                            </Typography>
                            <Typography variant="body2">
                                4. <strong>Choose quantity</strong> with the slider or quick buttons
                            </Typography>
                            <Typography variant="body2">
                                5. <strong>Track progress</strong> in real-time with step-by-step guidance
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
};

export default ProductionMobileDemo;
