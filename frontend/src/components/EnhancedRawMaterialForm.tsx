import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import { AutoAwesome as AutoIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { CreateRawMaterialData, RawMaterial } from '../types';
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
}) => {
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

  const handleNameChange = (_event: any, newValue: string | SkuSuggestion | null) => {
    if (typeof newValue === 'string') {
      // User typed a value
      setFormData((prev) => ({ ...prev, name: newValue }));

      // Auto-generate SKU if it's a new material
      if (!material) {
        // Generate SKU in format: RM-PRODUCTNAME-XXX
        const cleanName = newValue
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 15); // Limit to 15 chars for readability

        // Generate a 3-digit random number for uniqueness
        const randomSuffix = Math.floor(Math.random() * 900 + 100); // 100-999

        const generatedSku = `RM-${cleanName}-${randomSuffix}`;

        setFormData((prev) => ({ ...prev, sku: generatedSku }));
        setAutoFilledFields((prev) => new Set(prev).add('sku'));
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

  const handleChange = (field: keyof CreateRawMaterialData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: ['quantity', 'costPerUnit', 'reorderLevel'].includes(field) ? parseFloat(value) || 0 : value,
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
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              {material ? 'Edit Raw Material' : 'Add New Raw Material'}
              {!material && loadingDefaults && <CircularProgress size={20} />}
            </Box>
            <Box>
              <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {material ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {!material && defaults && (
            <Alert severity="info" sx={{ mb: 2 }} icon={<AutoIcon />}>
              Smart defaults applied! Fields marked with{' '}
              <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" sx={{ mx: 0.5 }} />{' '}
              have been pre-filled. You can edit them as needed.
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Name with Autocomplete */}
            <Grid item xs={12} sm={6}>
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
                    label="Name"
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
            </Grid>

            {/* SKU */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku || ''}
                onChange={handleChange('sku')}
                helperText={
                  autoFilledFields.has('sku')
                    ? 'Auto-generated from name'
                    : 'Editable – must remain consistent for same name'
                }
                InputProps={{
                  endAdornment: autoFilledFields.has('sku') ? (
                    <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" />
                  ) : null,
                }}
              />
            </Grid>

            {/* Supplier */}
            <Grid item xs={12} sm={6}>
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

            {/* Category */}
            <Grid item xs={12} sm={6}>
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
                        <Chip size="small" label="Default" icon={<CheckIcon />} color="primary" sx={{ ml: 1 }} />
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Purchase Date */}
            <Grid item xs={12} sm={6}>
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

            {/* Expiration Date - MOVED BEFORE BATCH NUMBER */}
            <Grid item xs={12} sm={6}>
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
                    ? 'Auto-set to 30 days from now'
                    : 'Used to generate batch number. Must be after purchase date'
                }
                InputProps={{
                  endAdornment: autoFilledFields.has('expirationDate') ? (
                    <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" />
                  ) : null,
                }}
              />
            </Grid>

            {/* Batch Number - MOVED AFTER EXPIRATION DATE */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Batch Number"
                value={formData.batchNumber}
                onChange={handleChange('batchNumber')}
                helperText={
                  autoFilledFields.has('batchNumber')
                    ? 'Auto-generated from expiration date'
                    : 'Format: SUPPLIER-YYYYMMDD-SEQ (based on expiration)'
                }
                InputProps={{
                  endAdornment: autoFilledFields.has('batchNumber') ? (
                    <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" />
                  ) : null,
                }}
              />
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Quantity"
                value={formData.quantity}
                onChange={handleChange('quantity')}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Unit */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Unit</InputLabel>
                <Select value={formData.unit} label="Unit" onChange={handleChange('unit')}>
                  {units.map((unit) => (
                    <MenuItem key={unit.id} value={unit.name}>
                      {unit.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Cost Per Unit */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Cost Per Unit"
                value={formData.costPerUnit}
                onChange={handleChange('costPerUnit')}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Reorder Level */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Reorder Level"
                value={formData.reorderLevel}
                onChange={handleChange('reorderLevel')}
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Leave 0 for no reorder alerts"
              />
            </Grid>

            {/* Storage Location */}
            <Grid item xs={12} sm={6}>
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
                        <Chip size="small" label="Default" icon={<CheckIcon />} color="primary" sx={{ ml: 1 }} />
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Quality Status */}
            <Grid item xs={12} sm={6}>
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
                          <Chip size="small" label="Default" icon={<CheckIcon />} color="primary" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default EnhancedRawMaterialForm;
