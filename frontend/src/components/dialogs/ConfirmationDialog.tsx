import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    useTheme,
} from '@mui/material';
import {
    Warning as WarningIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Add as AddIcon,
    ErrorOutline as ErrorIcon,
    Info as InfoIcon,
} from '@mui/icons-material';

export interface ConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'warning' | 'error' | 'info' | 'success';
    severity?: 'high' | 'medium' | 'low';
    loading?: boolean;
    itemType?: string;
    itemName?: string;
    action?: 'create' | 'update' | 'delete';
    consequences?: string[];
    additionalInfo?: React.ReactNode;
}

const getVariantConfig = (variant: ConfirmationDialogProps['variant'], action?: ConfirmationDialogProps['action']) => {
    switch (variant) {
        case 'error':
            return {
                icon: <ErrorIcon sx={{ fontSize: 40, color: 'error.main' }} />,
                titleColor: 'error.main',
                iconBgColor: 'error.light',
                confirmButtonColor: 'error',
            };
        case 'warning':
            return {
                icon: action === 'delete'
                    ? <DeleteIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                    : <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
                titleColor: 'warning.main',
                iconBgColor: 'warning.light',
                confirmButtonColor: 'warning',
            };
        case 'success':
            return {
                icon: action === 'create'
                    ? <AddIcon sx={{ fontSize: 40, color: 'success.main' }} />
                    : <EditIcon sx={{ fontSize: 40, color: 'success.main' }} />,
                titleColor: 'success.main',
                iconBgColor: 'success.light',
                confirmButtonColor: 'success',
            };
        case 'info':
        default:
            return {
                icon: <InfoIcon sx={{ fontSize: 40, color: 'info.main' }} />,
                titleColor: 'info.main',
                iconBgColor: 'info.light',
                confirmButtonColor: 'info',
            };
    }
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'warning',
    severity = 'medium',
    loading = false,
    itemType,
    itemName,
    action,
    consequences = [],
    additionalInfo,
}) => {
    const theme = useTheme();
    const config = getVariantConfig(variant, action);

    const handleConfirm = () => {
        onConfirm();
    };

    const getSeverityAlert = () => {
        if (severity === 'high' && consequences.length > 0) {
            return (
                <Alert severity="warning" sx={{ mt: 2, mb: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        This action will:
                    </Typography>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {consequences.map((consequence, index) => (
                            <li key={index}>
                                <Typography variant="body2">{consequence}</Typography>
                            </li>
                        ))}
                    </ul>
                </Alert>
            );
        }
        return null;
    };

    const getActionText = () => {
        if (!action || !itemType) return '';

        switch (action) {
            case 'create':
                return `Add new ${itemType.toLowerCase()}`;
            case 'update':
                return `Update ${itemType.toLowerCase()}`;
            case 'delete':
                return `Delete ${itemType.toLowerCase()}`;
            default:
                return '';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={!loading ? onClose : undefined}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: theme.shadows[8],
                }
            }}
        >
            <DialogTitle sx={{ pb: 1, textAlign: 'center' }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: config.iconBgColor,
                        opacity: 0.1,
                        mb: 1,
                    }}>
                        {config.icon}
                    </Box>
                </Box>
                <Typography variant="h5" component="h2" sx={{ color: config.titleColor, fontWeight: 600 }}>
                    {title}
                </Typography>
                {getActionText() && (
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {getActionText()}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent sx={{ pt: 0 }}>
                {itemName && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>{itemType}:</strong> {itemName}
                        </Typography>
                    </Alert>
                )}

                <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                    {message}
                </Typography>

                {getSeverityAlert()}

                {additionalInfo && (
                    <Box sx={{ mt: 2 }}>
                        {additionalInfo}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    disabled={loading}
                    sx={{ minWidth: 100 }}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color={config.confirmButtonColor as any}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : undefined}
                    sx={{ minWidth: 100 }}
                >
                    {loading ? 'Processing...' : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationDialog;