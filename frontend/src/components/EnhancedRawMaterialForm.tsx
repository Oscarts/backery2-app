import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Box,
  Chip,
  Alert,
  Typography,
  Tooltip,
} from '@mui/material';
import { AutoAwesome as AutoIcon, CheckCircle as CheckIcon, Label as LabelIcon, Lock as LockIcon, Edit as EditIcon } from '@mui/icons-material';
import { CreateRawMaterialData, RawMaterial, SkuReference } from '../types';
import api from '../utils/api';

interface EnhancedRawMaterialFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRawMaterialData) => void;
  material?: RawMaterial | null;
  categories: any[];
  suppliers: any[];
  storageLocations: any[];
  units: any[];
  qualityStatuses: any[];
  skuReferences?: SkuReference[];
}

interface SkuSuggestion {
  name: string;
  sku: string;
}

interface Defaults {
  storageLocationId: string | null;
  qualityStatusId: string | null;
  supplierId: string | null;
  categoryId: string | null;
  batchNumber: string | null;
}

const EnhancedRawMaterialForm: React.FC<EnhancedRawMaterialFormProps> = ({
  open,
  onClose,
  onSubmit,
  material,
  categories,
  suppliers,
  storageLocations,
  units,
  qualityStatuses,
  skuReferences = [],
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateRawMaterialData>({
    name: '',
    sku: '',
    categoryId: '',
    supplierId: '',
    batchNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    quantity: 0,
    unit: '',
    costPerUnit: 0,
    reorderLevel: 0,
    storageLocationId: '',
    qualityStatusId: '',
  });

  const [skuSuggestions, setSkuSuggestions] = useState<SkuSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  // SKU Reference selection state
  const [selectedSku, setSelectedSku] = useState<SkuReference | null>(null);

  // Load defaults on mount
  useEffect(() => {
    if (open && !material) {
      loadDefaults();
    }
  }, [open, material]);

  // Separate effect for batch number generation after defaults are loaded
  useEffect(() => {
    if (!material && defaults?.supplierId && open) {
      // Calculate default expiration date (30 days from now)
      const defaultExpirationDate = new Date();
      defaultExpirationDate.setDate(defaultExpirationDate.getDate() + 30);
      const expirationDateStr = defaultExpirationDate.toISOString().split('T')[0];

      // Generate batch number
      regenerateBatchNumber(defaults.supplierId, expirationDateStr);
    }
  }, [defaults, material, open]);  // Load form data from material when editing
  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        sku: material.sku || '',
        categoryId: material.categoryId || '',
        supplierId: material.supplierId,
        batchNumber: material.batchNumber,
        purchaseDate: material.purchaseDate ? new Date(material.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expirationDate: new Date(material.expirationDate).toISOString().split('T')[0],
        quantity: material.quantity,
        unit: material.unit,
        costPerUnit: material.unitPrice,
        reorderLevel: material.reorderLevel,
        storageLocationId: material.storageLocationId,
        qualityStatusId: material.qualityStatusId || '',
      });
      setAutoFilledFields(new Set());
    } else if (defaults) {
      // Reset form for new material
      // Calculate default expiration date (30 days from now)
      const defaultExpirationDate = new Date();
      defaultExpirationDate.setDate(defaultExpirationDate.getDate() + 30);
      const expirationDateStr = defaultExpirationDate.toISOString().split('T')[0];

      const initialData: CreateRawMaterialData = {
        name: '',
        sku: '',
        categoryId: defaults?.categoryId || '',
        supplierId: defaults?.supplierId || '',
        batchNumber: '', // Will be auto-generated in separate effect
        purchaseDate: new Date().toISOString().split('T')[0],
        expirationDate: expirationDateStr,
        quantity: 0,
        unit: '',
        costPerUnit: 0,
        reorderLevel: 0,
        storageLocationId: defaults?.storageLocationId || '',
        qualityStatusId: defaults?.qualityStatusId || '',
      };
      setFormData(initialData);

      // Mark fields that were auto-filled
      const autoFilled = new Set<string>();
      if (defaults?.storageLocationId) autoFilled.add('storageLocationId');
      if (defaults?.qualityStatusId) autoFilled.add('qualityStatusId');
      if (defaults?.supplierId) autoFilled.add('supplierId');
      if (defaults?.categoryId) autoFilled.add('categoryId');
      autoFilled.add('expirationDate'); // Mark expiration date as auto-filled
      setAutoFilledFields(autoFilled);
    }
  }, [material, open, defaults]);

  const loadDefaults = async () => {
    setLoadingDefaults(true);
    try {
      const response = await api.get('/raw-materials/defaults');
      if (response.data.success) {
        setDefaults(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load defaults:', error);
    } finally {
      setLoadingDefaults(false);
    }
  };

  const fetchSkuSuggestions = useCallback(
    async (name: string) => {
      if (name.length < 2) {
        setSkuSuggestions([]);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const response = await api.get('/raw-materials/sku-suggestions', {
          params: { name },
        });
        if (response.data.success) {
          setSkuSuggestions(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch SKU suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    []
  );

  const handleNameChange = async (_event: any, newValue: string | SkuSuggestion | null) => {
    if (typeof newValue === 'string') {
      // User typed a value
      setFormData((prev) => ({ ...prev, name: newValue }));

      // Auto-generate SKU if it's a new material
      if (!material && newValue.length >= 2) {
        // First, check if this name already exists and has a SKU
        try {
          const response = await api.get('/raw-materials/sku-suggestions', {
            params: { name: newValue },
          });

          if (response.data.success && response.data.data.length > 0) {
            // Material name already exists - reuse existing SKU
            const existingSku = response.data.data[0].sku;
            setFormData((prev) => ({ ...prev, sku: existingSku }));
            setAutoFilledFields((prev) => new Set(prev).add('sku'));
          } else {
            // New material - generate SKU without random suffix
            // Generate SKU in format: RM-PRODUCTNAME (consistent for same name)
            const cleanName = newValue
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .substring(0, 20); // Allow more space for name

            const generatedSku = `RM-${cleanName}`;

            setFormData((prev) => ({ ...prev, sku: generatedSku }));
            setAutoFilledFields((prev) => new Set(prev).add('sku'));
          }
        } catch (error) {
          console.error('Failed to check SKU:', error);
          // Fallback: generate SKU without random suffix
          const cleanName = newValue
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 20);

          const generatedSku = `RM-${cleanName}`;
          setFormData((prev) => ({ ...prev, sku: generatedSku }));
          setAutoFilledFields((prev) => new Set(prev).add('sku'));
        }
      }

      // Fetch suggestions
      fetchSkuSuggestions(newValue);
    } else if (newValue && typeof newValue === 'object') {
      // User selected a suggestion
      setFormData((prev) => ({
        ...prev,
        name: newValue.name,
        sku: newValue.sku,
      }));
      setAutoFilledFields((prev) => new Set(prev).add('sku'));
      setSkuSuggestions([]);
    }
  };

  const regenerateBatchNumber = async (supplierId: string, expirationDate: string) => {
    if (!supplierId || !expirationDate || material) return;

    try {
      const response = await api.get('/raw-materials/generate-batch-number', {
        params: { supplierId, expirationDate },
      });
      if (response.data.success && response.data.data.batchNumber) {
        setFormData((prev) => ({ ...prev, batchNumber: response.data.data.batchNumber }));
        setAutoFilledFields((prev) => new Set(prev).add('batchNumber'));
      }
    } catch (error) {
      console.error('Failed to generate batch number:', error);
      // Silently fail - user can still manually enter batch number
    }
  };

  // SKU Reference auto-fill handler
  const handleSkuSelect = (sku: SkuReference | null) => {
    setSelectedSku(sku);

    if (!sku) {
      // User cleared selection - keep existing form data, just remove auto-fill indicators
      setAutoFilledFields(prev => {
        const newSet = new Set(prev);
        ['name', 'categoryId', 'storageLocationId', 'unit', 'costPerUnit', 'reorderLevel'].forEach(field => newSet.delete(field));
        return newSet;
      });
      return;
    }

    // Auto-fill fields from SKU reference
    const fieldsToFill = new Set<string>();
    const updates: Partial<CreateRawMaterialData> = {};

    if (sku.name) {
      updates.name = sku.name;
      fieldsToFill.add('name');
    }

    // Handle category - check both direct categoryId and nested category.id
    const categoryId = sku.categoryId || sku.category?.id;

    if (categoryId) {
      updates.categoryId = categoryId;
      fieldsToFill.add('categoryId');
    }

    if (sku.storageLocationId) {
      updates.storageLocationId = sku.storageLocationId;
      fieldsToFill.add('storageLocationId');
    }

    if (sku.unit) {
      updates.unit = sku.unit;
      fieldsToFill.add('unit');
    }

    if (sku.unitPrice !== null && sku.unitPrice !== undefined) {
      updates.costPerUnit = sku.unitPrice;
      fieldsToFill.add('costPerUnit');
    }

    if (sku.reorderLevel !== null && sku.reorderLevel !== undefined) {
      updates.reorderLevel = sku.reorderLevel;
      fieldsToFill.add('reorderLevel');
    }

    // Also copy the SKU field itself
    if (sku.sku) {
      updates.sku = sku.sku;
      fieldsToFill.add('sku');
    }

    // Apply the updates to form data
    setFormData(prev => ({ ...prev, ...updates }));
    setAutoFilledFields(fieldsToFill);
  };

  const handleSupplierChange = async (event: any) => {
    const newSupplierId = event.target.value;
    setFormData((prev) => ({ ...prev, supplierId: newSupplierId }));

    // Remove auto-fill indicator if user manually changes
    setAutoFilledFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete('supplierId');
      return newSet;
    });

    // Regenerate batch number if we have expiration date
    if (newSupplierId && formData.expirationDate) {
      await regenerateBatchNumber(newSupplierId, formData.expirationDate);
    }
  };

  const handleExpirationDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newExpirationDate = event.target.value;
    setFormData((prev) => ({ ...prev, expirationDate: newExpirationDate }));

    // Remove auto-fill indicator
    setAutoFilledFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete('expirationDate');
      return newSet;
    });

    // Regenerate batch number if we have supplier
    if (formData.supplierId && newExpirationDate) {
      regenerateBatchNumber(formData.supplierId, newExpirationDate);
    }
  };

  // Handle numeric input with validation (no negative numbers, only digits and decimal point)
  const handleNumericChange = (field: keyof CreateRawMaterialData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    // Allow empty string for clearing the field
    if (value === '') {
      setFormData((prev) => ({ ...prev, [field]: 0 }));
      return;
    }

    // Only allow numbers and one decimal point
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(value)) {
      return; // Reject invalid characters
    }

    // Parse and validate
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData((prev) => ({ ...prev, [field]: value })); // Store as string to preserve decimal input
    } else if (value.endsWith('.') || value.endsWith('0')) {
      // Allow trailing dot or zero for better UX while typing
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Remove auto-fill indicator if user manually changes
    setAutoFilledFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
  };

  const handleChange = (field: keyof CreateRawMaterialData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Remove auto-fill indicator if user manually changes
    setAutoFilledFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert string numbers to actual numbers before submitting
    const submissionData = {
      ...formData,
      quantity: typeof formData.quantity === 'string' ? parseFloat(formData.quantity) || 0 : formData.quantity,
      costPerUnit: typeof formData.costPerUnit === 'string' ? parseFloat(formData.costPerUnit) || 0 : formData.costPerUnit,
      reorderLevel: typeof formData.reorderLevel === 'string' ? parseFloat(formData.reorderLevel) || 0 : formData.reorderLevel,
      // Include skuReferenceId if an SKU reference is selected (for create) or if editing material with SKU reference
      skuReferenceId: selectedSku?.id || material?.skuReferenceId || null,
    };

    onSubmit(submissionData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={false}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: '100vh', sm: '90vh' }
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ p: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {material ? 'Edit Raw Material' : 'Add New Raw Material'}
              </Typography>
              {!material && loadingDefaults && <CircularProgress size={20} />}
            </Box>
            <Box display="flex" gap={1}>
              <Button onClick={onClose} size="small">Cancel</Button>
              <Button type="submit" variant="contained" color="primary" size="small">
                {material ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Edit Mode: Show warning if material has SKU reference */}
          {material && material.skuReferenceId && (
            <Alert severity="warning" sx={{ mb: 3 }} icon={<LockIcon />}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Product details are locked from SKU Reference
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Only purchase details (supplier, batch, quantity, dates, storage, status) can be edited
                  </Typography>
                </Box>
                <Tooltip title="Edit SKU Reference to change product details">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      onClose();
                      navigate('/sku-reference', {
                        state: {
                          openEditDialog: true,
                          skuId: material.skuReferenceId
                        }
                      });
                    }}
                    sx={{ ml: 2, flexShrink: 0 }}
                  >
                    Edit SKU
                  </Button>
                </Tooltip>
              </Box>
            </Alert>
          )}

          {/* Create Mode: SKU selection */}
          {!material && (
            <>
              {!selectedSku && (
                <Alert severity="info" sx={{ mb: 3 }} icon={<AutoIcon />}>
                  <Typography variant="body2" fontWeight="medium">
                    Select an SKU Reference to auto-fill product details
                  </Typography>
                </Alert>
              )}

              {selectedSku && (
                <Alert severity="success" sx={{ mb: 3 }} icon={<LockIcon />}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Product details locked from SKU Reference
                      </Typography>
                    </Box>
                    <Tooltip title="Edit SKU Reference to change product details">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          onClose(); // Close the current dialog
                          navigate('/sku-reference', {
                            state: {
                              openEditDialog: true,
                              skuId: selectedSku.id
                            }
                          });
                        }}
                        sx={{ ml: 2, whiteSpace: 'nowrap' }}
                      >
                        Edit SKU
                      </Button>
                    </Tooltip>
                  </Box>
                </Alert>
              )}

              {skuReferences.length > 0 && (
                <Box sx={{
                  mb: 3,
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)',
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: 'primary.light',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <Autocomplete
                    options={skuReferences}
                    getOptionLabel={(option) => `${option.sku} - ${option.name}`}
                    value={selectedSku}
                    onChange={(_, newValue) => handleSkuSelect(newValue)}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={option.sku} size="small" color="primary" variant="outlined" />
                            <Typography variant="body2" fontWeight="medium">{option.name}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {option.category && (
                              <Typography variant="caption" color="text.secondary">
                                📦 {option.category.name}
                              </Typography>
                            )}
                            {option.unit && option.unitPrice && (
                              <Typography variant="caption" color="text.secondary">
                                💰 ${option.unitPrice?.toFixed(2)}/{option.unit}
                              </Typography>
                            )}
                            {option.reorderLevel && (
                              <Typography variant="caption" color="text.secondary">
                                🔔 Reorder: {option.reorderLevel}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="🔍 Search SKU Reference"
                        placeholder="Type product name or SKU code..."
                        helperText={selectedSku ? "✅ SKU selected! Fields below are auto-filled." : "Select to auto-fill name, category, unit, price, and reorder level"}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
                              <LabelIcon sx={{ color: 'primary.main', mr: 0.5 }} />
                              {params.InputProps.startAdornment}
                            </Box>
                          ),
                        }}
                      />
                    )}
                  />
                </Box>
              )}

              {defaults && !selectedSku && (
                <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon />}>
                  Smart defaults applied! Fields marked with{' '}
                  <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" sx={{ mx: 0.5 }} />{' '}
                  have been pre-filled.
                </Alert>
              )}
            </>
          )}

          {/* Two-Panel Layout: SKU Data (Left) vs Purchase Data (Right) */}
          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mt: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* LEFT PANEL: SKU Reference Data (Locked when SKU selected or editing with SKU reference) */}
            {(() => {
              // Helper: Check if SKU-related fields should be locked
              const isSkuLocked = !material ? !!selectedSku : !!material?.skuReferenceId;

              return (
                <Box sx={{
                  flex: 1,
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: 2, sm: 3 },
                  border: isSkuLocked ? '2px solid' : '1px dashed',
                  borderColor: isSkuLocked ? 'primary.light' : 'divider',
                  background: isSkuLocked
                    ? 'linear-gradient(135deg, rgba(103, 58, 183, 0.03) 0%, rgba(63, 81, 181, 0.03) 100%)'
                    : 'transparent',
                  boxShadow: isSkuLocked ? '0 4px 12px rgba(103, 58, 183, 0.08)' : 'none'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 } }}>
                    <LabelIcon color="primary" fontSize="small" />
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' }, fontWeight: 600 }}>
                      Product Definition {isSkuLocked && '🔒'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>
                    {isSkuLocked ? 'Locked fields from SKU Reference - ensures consistency' : 'Define product details or use SKU reference'}
                  </Typography>

                  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {/* Name - Read-only if SKU locked */}
                    <Grid item xs={12}>
                      {isSkuLocked ? (
                        <TextField
                          fullWidth
                          label="Product Name"
                          value={formData.name}
                          required
                          disabled
                          InputProps={{
                            startAdornment: (
                              <LockIcon sx={{ mr: 1, color: 'primary.main', opacity: 0.6 }} fontSize="small" />
                            ),
                          }}
                          helperText="🔒 Locked from SKU Reference"
                          sx={{
                            '& .MuiInputBase-root': {
                              bgcolor: 'rgba(103, 58, 183, 0.04)',
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(103, 58, 183, 0.2)' }
                            },
                            '& .Mui-disabled': {
                              color: 'text.primary',
                              WebkitTextFillColor: 'text.primary'
                            }
                          }}
                        />
                      ) : (
                        <Autocomplete
                          freeSolo
                          options={skuSuggestions}
                          getOptionLabel={(option) =>
                            typeof option === 'string' ? option : `${option.name} (${option.sku})`
                          }
                          value={formData.name}
                          onChange={handleNameChange}
                          onInputChange={(event, newInputValue) => {
                            handleNameChange(event, newInputValue);
                          }}
                          loading={loadingSuggestions}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Product Name"
                              required
                              helperText="Start typing to see suggestions from existing materials"
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {loadingSuggestions ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      )}
                    </Grid>

                    {/* SKU - Read-only if SKU locked */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="SKU Code"
                        value={formData.sku || ''}
                        onChange={handleChange('sku')}
                        disabled={isSkuLocked}
                        required
                        helperText={
                          isSkuLocked
                            ? '🔒 Locked from SKU Reference'
                            : autoFilledFields.has('sku')
                              ? '✨ Auto-generated from name'
                              : 'Will be auto-generated from product name'
                        }
                        InputProps={{
                          startAdornment: isSkuLocked ? (
                            <LockIcon sx={{ mr: 1, color: 'primary.main', opacity: 0.6 }} fontSize="small" />
                          ) : null,
                          endAdornment: autoFilledFields.has('sku') && !isSkuLocked ? (
                            <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" />
                          ) : null,
                        }}
                        sx={isSkuLocked ? {
                          '& .MuiInputBase-root': {
                            bgcolor: 'rgba(103, 58, 183, 0.04)',
                            borderRadius: 2,
                            '& fieldset': { borderColor: 'rgba(103, 58, 183, 0.2)' }
                          },
                          '& .Mui-disabled': {
                            color: 'text.primary',
                            WebkitTextFillColor: 'text.primary'
                          }
                        } : {}}
                      />
                    </Grid>

                    {/* Category - Read-only if SKU locked */}
                    <Grid item xs={12}>
                      {isSkuLocked ? (
                        <TextField
                          fullWidth
                          label="Category"
                          value={
                            categories.find(c => c.id === formData.categoryId)?.name ||
                            (material?.category?.name) ||
                            (selectedSku?.category?.name) ||
                            'None'
                          }
                          disabled
                          InputProps={{
                            startAdornment: (
                              <LockIcon sx={{ mr: 1, color: 'primary.main', opacity: 0.6 }} fontSize="small" />
                            ),
                          }}
                          helperText="🔒 Locked from SKU Reference"
                          sx={{
                            '& .MuiInputBase-root': {
                              bgcolor: 'rgba(103, 58, 183, 0.04)',
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(103, 58, 183, 0.2)' }
                            },
                            '& .Mui-disabled': {
                              color: 'text.primary',
                              WebkitTextFillColor: 'text.primary'
                            }
                          }}
                        />
                      ) : (
                        <FormControl fullWidth>
                          <InputLabel>Category</InputLabel>
                          <Select value={formData.categoryId} label="Category" onChange={handleChange('categoryId')}>
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {categories.map((category) => (
                              <MenuItem key={category.id} value={category.id}>
                                {category.name}
                                {autoFilledFields.has('categoryId') && category.id === formData.categoryId && (
                                  <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" sx={{ ml: 1 }} />
                                )}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Grid>

                    {/* Unit - Read-only if SKU locked */}
                    <Grid item xs={12}>
                      {isSkuLocked ? (
                        <TextField
                          fullWidth
                          label="Unit"
                          value={formData.unit || ''}
                          required
                          disabled
                          InputProps={{
                            startAdornment: (
                              <LockIcon sx={{ mr: 1, color: 'primary.main', opacity: 0.6 }} fontSize="small" />
                            ),
                          }}
                          helperText="🔒 Locked from SKU Reference"
                          sx={{
                            '& .MuiInputBase-root': {
                              bgcolor: 'rgba(103, 58, 183, 0.04)',
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(103, 58, 183, 0.2)' }
                            },
                            '& .Mui-disabled': {
                              color: 'text.primary',
                              WebkitTextFillColor: 'text.primary'
                            }
                          }}
                        />
                      ) : (
                        <FormControl fullWidth required>
                          <InputLabel>Unit</InputLabel>
                          <Select value={formData.unit} label="Unit" onChange={handleChange('unit')}>
                            {units.map((unit) => (
                              <MenuItem key={unit.id} value={unit.symbol}>
                                {unit.name} ({unit.symbol})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Grid>

                    {/* Cost Per Unit - Read-only if SKU locked */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Cost Per Unit"
                        value={formData.costPerUnit}
                        onChange={handleChange('costPerUnit')}
                        disabled={isSkuLocked}
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: isSkuLocked ? (
                            <LockIcon sx={{ mr: 1, color: 'primary.main', opacity: 0.6 }} fontSize="small" />
                          ) : null,
                        }}
                        helperText={isSkuLocked ? '🔒 Locked from SKU Reference' : 'Price per unit'}
                        sx={isSkuLocked ? {
                          '& .MuiInputBase-root': {
                            bgcolor: 'rgba(103, 58, 183, 0.04)',
                            borderRadius: 2,
                            '& fieldset': { borderColor: 'rgba(103, 58, 183, 0.2)' }
                          },
                          '& .Mui-disabled': {
                            color: 'text.primary',
                            WebkitTextFillColor: 'text.primary'
                          }
                        } : {}}
                      />
                    </Grid>

                    {/* Reorder Level - Read-only if SKU locked */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Reorder Level"
                        value={formData.reorderLevel}
                        onChange={handleChange('reorderLevel')}
                        disabled={isSkuLocked}
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: isSkuLocked ? (
                            <LockIcon sx={{ mr: 1, color: 'primary.main', opacity: 0.6 }} fontSize="small" />
                          ) : null,
                        }}
                        helperText={isSkuLocked ? '🔒 Locked from SKU Reference' : 'Minimum stock level to trigger alert'}
                        sx={isSkuLocked ? {
                          '& .MuiInputBase-root': {
                            bgcolor: 'rgba(103, 58, 183, 0.04)',
                            borderRadius: 2,
                            '& fieldset': { borderColor: 'rgba(103, 58, 183, 0.2)' }
                          },
                          '& .Mui-disabled': {
                            color: 'text.primary',
                            WebkitTextFillColor: 'text.primary'
                          }
                        } : {}}
                      />
                    </Grid>
                  </Grid>
                </Box>
              );
            })()}

            {/* RIGHT PANEL: Purchase-Specific Data (Always Editable) */}
            <Box sx={{
              flex: 1,
              p: { xs: 2, sm: 3 },
              borderRadius: { xs: 2, sm: 3 },
              border: '2px solid',
              borderColor: 'success.light',
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.02) 0%, rgba(139, 195, 74, 0.02) 100%)',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.06)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 } }}>
                <CheckIcon color="success" fontSize="small" />
                <Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' }, fontWeight: 600 }}>
                  Purchase Details ✅
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>
                These fields are always editable - enter purchase-specific information
              </Typography>

              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {/* Supplier */}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Supplier</InputLabel>
                    <Select
                      value={formData.supplierId}
                      label="Supplier"
                      onChange={handleSupplierChange}
                    >
                      {suppliers.map((supplier) => (
                        <MenuItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                          {autoFilledFields.has('supplierId') && supplier.id === formData.supplierId && (
                            <Chip size="small" label="Default" icon={<CheckIcon />} color="primary" sx={{ ml: 1 }} />
                          )}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Quantity */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    type="text"
                    label="Quantity"
                    value={formData.quantity}
                    onChange={handleNumericChange('quantity')}
                    placeholder="Enter quantity"
                    helperText="Enter a positive number"
                    inputProps={{
                      inputMode: 'decimal',
                      pattern: '[0-9]*\\.?[0-9]*',
                    }}
                  />
                </Grid>

                {/* Purchase Date */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Purchase Date"
                    value={formData.purchaseDate}
                    onChange={handleChange('purchaseDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Expiration Date */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Expiration Date"
                    value={formData.expirationDate}
                    onChange={handleExpirationDateChange}
                    InputLabelProps={{ shrink: true }}
                    helperText={
                      autoFilledFields.has('expirationDate')
                        ? '\u2728 Auto-set to 30 days from now'
                        : 'Used to generate batch number'
                    }
                    InputProps={{
                      endAdornment: autoFilledFields.has('expirationDate') ? (
                        <Chip size="small" label="Auto" icon={<CheckIcon />} color="success" />
                      ) : null,
                    }}
                  />
                </Grid>

                {/* Batch Number */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Batch Number"
                    value={formData.batchNumber}
                    onChange={handleChange('batchNumber')}
                    helperText={
                      autoFilledFields.has('batchNumber')
                        ? '\u2728 Auto-generated from expiration date'
                        : 'Format: SUPPLIER-YYYYMMDD-SEQ'
                    }
                    InputProps={{
                      endAdornment: autoFilledFields.has('batchNumber') ? (
                        <Chip size="small" label="Auto" icon={<CheckIcon />} color="success" />
                      ) : null,
                    }}
                  />
                </Grid>

                {/* Storage Location */}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Storage Location</InputLabel>
                    <Select
                      value={formData.storageLocationId}
                      label="Storage Location"
                      onChange={handleChange('storageLocationId')}
                    >
                      {storageLocations.map((location) => (
                        <MenuItem key={location.id} value={location.id}>
                          {location.name}
                          {autoFilledFields.has('storageLocationId') && location.id === formData.storageLocationId && (
                            <Chip size="small" label="Default" icon={<CheckIcon />} color="success" sx={{ ml: 1 }} />
                          )}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Quality Status */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Quality Status</InputLabel>
                    <Select
                      value={formData.qualityStatusId}
                      label="Quality Status"
                      onChange={handleChange('qualityStatusId')}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {qualityStatuses.map((status) => (
                        <MenuItem key={status.id} value={status.id}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: status.color,
                              }}
                            />
                            {status.name}
                            {autoFilledFields.has('qualityStatusId') && status.id === formData.qualityStatusId && (
                              <Chip size="small" label="Default" icon={<CheckIcon />} color="success" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default EnhancedRawMaterialForm;
