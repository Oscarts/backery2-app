import { useState, useCallback } from 'react';
import { ConfirmationDialogProps } from '../components/dialogs/ConfirmationDialog';

interface UseConfirmationDialogOptions {
    onConfirm?: () => void | Promise<void>;
    defaultVariant?: ConfirmationDialogProps['variant'];
    defaultSeverity?: ConfirmationDialogProps['severity'];
}

interface ConfirmationDialogState {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationDialogProps['variant'];
    severity?: ConfirmationDialogProps['severity'];
    loading?: boolean;
    itemType?: string;
    itemName?: string;
    action?: ConfirmationDialogProps['action'];
    consequences?: string[];
    additionalInfo?: React.ReactNode;
    onConfirm?: () => void | Promise<void>;
}

export const useConfirmationDialog = (options?: UseConfirmationDialogOptions) => {
    const [dialogState, setDialogState] = useState<ConfirmationDialogState>({
        open: false,
        title: '',
        message: '',
        variant: options?.defaultVariant || 'warning',
        severity: options?.defaultSeverity || 'medium',
        loading: false,
    });

    const openConfirmationDialog = useCallback((config: Omit<ConfirmationDialogState, 'open' | 'loading'>) => {
        setDialogState({
            ...config,
            open: true,
            loading: false,
            variant: config.variant || options?.defaultVariant || 'warning',
            severity: config.severity || options?.defaultSeverity || 'medium',
        });
    }, [options]);

    const closeConfirmationDialog = useCallback(() => {
        if (!dialogState.loading) {
            setDialogState(prev => ({ ...prev, open: false }));
        }
    }, [dialogState.loading]);

    const handleConfirm = useCallback(async () => {
        if (dialogState.onConfirm) {
            setDialogState(prev => ({ ...prev, loading: true }));

            try {
                await dialogState.onConfirm();
                setDialogState(prev => ({ ...prev, open: false, loading: false }));
            } catch (error) {
                setDialogState(prev => ({ ...prev, loading: false }));
                // Error handling is done by the calling component
            }
        } else if (options?.onConfirm) {
            setDialogState(prev => ({ ...prev, loading: true }));

            try {
                await options.onConfirm();
                setDialogState(prev => ({ ...prev, open: false, loading: false }));
            } catch (error) {
                setDialogState(prev => ({ ...prev, loading: false }));
            }
        } else {
            setDialogState(prev => ({ ...prev, open: false }));
        }
    }, [dialogState.onConfirm, options?.onConfirm]);

    // Predefined confirmation dialogs for common actions
    const confirmCreate = useCallback((
        itemType: string,
        itemName?: string,
        customMessage?: string,
        consequences?: string[]
    ) => {
        openConfirmationDialog({
            title: `Create ${itemType}`,
            message: customMessage || `Are you sure you want to create this ${itemType.toLowerCase()}?`,
            confirmText: 'Create',
            variant: 'info',
            severity: 'low',
            action: 'create',
            itemType,
            itemName,
            consequences,
            onConfirm: options?.onConfirm,
        });
    }, [openConfirmationDialog, options?.onConfirm]);

    const confirmUpdate = useCallback((
        itemType: string,
        itemName?: string,
        customMessage?: string,
        consequences?: string[]
    ) => {
        openConfirmationDialog({
            title: `Update ${itemType}`,
            message: customMessage || `Are you sure you want to update this ${itemType.toLowerCase()}?`,
            confirmText: 'Update',
            variant: 'warning',
            severity: 'medium',
            action: 'update',
            itemType,
            itemName,
            consequences,
            onConfirm: options?.onConfirm,
        });
    }, [openConfirmationDialog, options?.onConfirm]);

    const confirmDelete = useCallback((
        itemType: string,
        itemName?: string,
        customMessage?: string,
        consequences?: string[]
    ) => {
        openConfirmationDialog({
            title: `Delete ${itemType}`,
            message: customMessage || `Are you sure you want to delete this ${itemType.toLowerCase()}? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'error',
            severity: 'high',
            action: 'delete',
            itemType,
            itemName,
            consequences: consequences || ['This action cannot be undone'],
            onConfirm: options?.onConfirm,
        });
    }, [openConfirmationDialog, options?.onConfirm]);

    const confirmSkuModification = useCallback((
        action: 'create' | 'update' | 'delete',
        skuName?: string,
        customMessage?: string,
        onConfirmAction?: () => void | Promise<void>
    ) => {
        const actionText = action.charAt(0).toUpperCase() + action.slice(1);
        const consequences = [
            'SKU references may be updated across the system',
            'Related inventory items will be affected',
            'Production recipes using this SKU may need review',
            'Cost calculations may be recalculated',
        ];

        if (action === 'delete') {
            consequences.push('All associated data will be permanently removed');
        }

        openConfirmationDialog({
            title: `${actionText} SKU Reference`,
            message: customMessage || `Are you sure you want to ${action} this SKU reference? This will affect related inventory and production data.`,
            confirmText: actionText,
            variant: action === 'delete' ? 'error' : action === 'update' ? 'warning' : 'info',
            severity: action === 'delete' ? 'high' : 'medium',
            action,
            itemType: 'SKU Reference',
            itemName: skuName,
            consequences,
            onConfirm: onConfirmAction || options?.onConfirm,
        });
    }, [openConfirmationDialog, options?.onConfirm]);

    const confirmInventoryModification = useCallback((
        action: 'create' | 'update' | 'delete',
        itemType: 'Raw Material' | 'Finished Product',
        itemName?: string,
        customMessage?: string,
        additionalConsequences?: string[],
        onConfirmAction?: () => void | Promise<void>
    ) => {
        const actionText = action.charAt(0).toUpperCase() + action.slice(1);
        const baseConsequences = [
            'Inventory levels will be updated',
            'Cost calculations may be affected',
        ];

        if (itemType === 'Raw Material') {
            baseConsequences.push('Production recipes may be impacted');
            baseConsequences.push('Supply chain planning may need adjustment');
        } else {
            baseConsequences.push('Customer orders may be affected');
            baseConsequences.push('Sales reporting will be updated');
        }

        if (action === 'delete') {
            baseConsequences.push('All historical data will be preserved but item will be marked as inactive');
        }

        const consequences = [...baseConsequences, ...(additionalConsequences || [])];

        openConfirmationDialog({
            title: `${actionText} ${itemType}`,
            message: customMessage || `Are you sure you want to ${action} this ${itemType.toLowerCase()}?`,
            confirmText: actionText,
            variant: action === 'delete' ? 'error' : action === 'update' ? 'warning' : 'info',
            severity: action === 'delete' ? 'high' : 'medium',
            action,
            itemType,
            itemName,
            consequences,
            onConfirm: onConfirmAction || options?.onConfirm,
        });
    }, [openConfirmationDialog, options?.onConfirm]);

    return {
        dialogState,
        openConfirmationDialog,
        closeConfirmationDialog,
        handleConfirm,
        // Predefined confirmations
        confirmCreate,
        confirmUpdate,
        confirmDelete,
        confirmSkuModification,
        confirmInventoryModification,
    };
};

export default useConfirmationDialog;