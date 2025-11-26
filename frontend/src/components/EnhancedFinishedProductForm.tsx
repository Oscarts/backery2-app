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
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
} from '@mui/material';
import { AutoAwesome as AutoIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { CreateFinishedProductData, FinishedProduct, ProductStatus } from '../types';
import api from '../utils/api';
import { borderRadius } from '../theme/designTokens';

interface EnhancedFinishedProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFinishedProductData) => void;
  product?: FinishedProduct | null;
  categories: any[];
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
  categoryId: string | null;
  batchNumber: string | null;
  shelfLife: number;
  markupPercentage: number;
}

const EnhancedFinishedProductForm: React.FC<EnhancedFinishedProductFormProps> = ({
  open,
  onClose,
  onSubmit,
  product,
  categories,
  storageLocations,
  units,
  qualityStatuses,
}) => {
  // Helper function to normalize unit values
  const normalizeUnit = (unit: string): string => {
    const unitMap: Record<string, string> = {
      'Piece': 'pcs',
      'Pieces': 'pcs',
      'Dozen': 'dz',
      'Kilogram': 'kg',
      'Gram': 'g',
      'Liter': 'L',
      'Milliliter': 'ml',
      'Ounce': 'oz',
      'Pound': 'lb',
      'Cup': 'cup',
      'Tablespoon': 'tbsp',
      'Teaspoon': 'tsp',
      'Package': 'pkg'
    };
    return unitMap[unit] || unit;
  };

  const [formData, setFormData] = useState<CreateFinishedProductData>({
    name: '',
    sku: '',
    categoryId: '',
    batchNumber: '',
    productionDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    shelfLife: 7,
    quantity: 0,
    unit: '',
    salePrice: 0,
    costToProduce: undefined,
    markupPercentage: 50,
    packagingInfo: '',
    storageLocationId: '',
    isContaminated: false,
    qualityStatusId: '',
    status: ProductStatus.IN_PRODUCTION as any,
  });

  const [skuSuggestions, setSkuSuggestions] = useState<SkuSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [currentTab, setCurrentTab] = useState(0);

  // Load defaults on mount
  useEffect(() => {
    if (open && !product) {
      loadDefaults();
    }
  }, [open, product]);

  // Initialize form data when product or defaults change
  useEffect(() => {
    if (product) {
      // Editing existing product
      setFormData({
        name: product.name,
        sku: product.sku || '',
        categoryId: product.categoryId || '',
        batchNumber: product.batchNumber,
        productionDate: product.productionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        expirationDate: new Date(product.expirationDate).toISOString().split('T')[0],
        shelfLife: product.shelfLife,
        quantity: product.quantity,
        unit: normalizeUnit(product.unit),
        salePrice: product.salePrice,
        costToProduce: product.costToProduce || undefined,
        markupPercentage: product.markupPercentage || 50,
        packagingInfo: product.packagingInfo || '',
        storageLocationId: product.storageLocationId || '',
        isContaminated: product.isContaminated || false,
        qualityStatusId: product.qualityStatusId || '',
        status: (product as any)?.status || ProductStatus.IN_PRODUCTION,
      });
      setAutoFilledFields(new Set());
    } else if (defaults) {
      // Reset form for new product with defaults
      const today = new Date().toISOString().split('T')[0];
      const defaultExpiration = new Date();
      defaultExpiration.setDate(defaultExpiration.getDate() + (defaults.shelfLife || 7));
      const expirationDateStr = defaultExpiration.toISOString().split('T')[0];

      const initialData: CreateFinishedProductData = {
        name: '',
        sku: '',
        categoryId: defaults?.categoryId || '',
        batchNumber: defaults?.batchNumber || '',
        productionDate: today,
        expirationDate: expirationDateStr,
        shelfLife: defaults?.shelfLife || 7,
        quantity: 0,
        unit: '',
        salePrice: 0,
        costToProduce: undefined,
        markupPercentage: defaults?.markupPercentage || 50,
        packagingInfo: '',
        storageLocationId: defaults?.storageLocationId || '',
        isContaminated: false,
        qualityStatusId: defaults?.qualityStatusId || '',
        status: ProductStatus.IN_PRODUCTION as any,
      };
      setFormData(initialData);

      // Mark fields that were auto-filled
      const autoFilled = new Set<string>();
      if (defaults?.storageLocationId) autoFilled.add('storageLocationId');
      if (defaults?.qualityStatusId) autoFilled.add('qualityStatusId');
      if (defaults?.categoryId) autoFilled.add('categoryId');
      if (defaults?.shelfLife) autoFilled.add('shelfLife');
      if (defaults?.markupPercentage) autoFilled.add('markupPercentage');
      autoFilled.add('productionDate');
      autoFilled.add('expirationDate');
      setAutoFilledFields(autoFilled);
    }
  }, [product, open, defaults]);

  // Auto-generate batch number when production date changes
  useEffect(() => {
    if (!product && formData.productionDate && open) {
      const date = new Date(formData.productionDate);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const randomSeq = Math.floor(Math.random() * 900 + 100); // 100-999
      const generatedBatch = `FP-${dateStr}-${randomSeq}`;
      
      setFormData((prev) => ({ ...prev, batchNumber: generatedBatch }));
      setAutoFilledFields((prev) => new Set(prev).add('batchNumber'));
    }
  }, [formData.productionDate, product, open]);

  // Auto-calculate expiration date based on shelf life
  useEffect(() => {
    if (!product && formData.productionDate && formData.shelfLife > 0) {
      const prodDate = new Date(formData.productionDate);
      prodDate.setDate(prodDate.getDate() + formData.shelfLife);
      const expirationDateStr = prodDate.toISOString().split('T')[0];
      
      setFormData((prev) => ({ ...prev, expirationDate: expirationDateStr }));
      setAutoFilledFields((prev) => new Set(prev).add('expirationDate'));
    }
  }, [formData.productionDate, formData.shelfLife, product]);

  const loadDefaults = async () => {
    setLoadingDefaults(true);
    try {
      const response = await api.get('/finished-products/defaults');
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

      // Auto-generate SKU if it's a new product
      if (!product) {
        const cleanName = newValue
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        setFormData((prev) => ({ ...prev, sku: cleanName }));
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

  const handleChange = (field: keyof CreateFinishedProductData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { value: unknown }>
  ) => {
    const value = (event.target as HTMLInputElement).value;
    setFormData((prev) => ({
      ...prev,
      [field]: ['quantity', 'salePrice', 'costToProduce', 'markupPercentage', 'shelfLife'].includes(field) 
        ? parseFloat(value) || 0 
        : value,
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
    
    // Validate required fields
    if (!formData.storageLocationId) {
      alert('Please select a storage location');
      return;
    }
    
    onSubmit(formData);
  };

  const handleClose = () => {
    // Reset form and close
    setCurrentTab(0);
    onClose();
  };

  // Listen for external request to jump to materials tab
  useEffect(() => {
    const handler = () => setCurrentTab(1);
    window.addEventListener('open-materials-tab', handler);
    return () => window.removeEventListener('open-materials-tab', handler);
  }, []);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              {product ? 'Edit Finished Product' : 'Add New Finished Product'}
              {!product && loadingDefaults && <CircularProgress size={20} />}
            </Box>
            <Box>
              <Button onClick={handleClose} sx={{ mr: 1 }}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {product ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        {/* Add tabs for editing existing products */}
        {product && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} aria-label="product form tabs">
              <Tab label="Details" />
              <Tab label="Materials" />
            </Tabs>
          </Box>
        )}

        <DialogContent>
          {!product && defaults && (
            <Alert severity="info" sx={{ mb: 2 }} icon={<AutoIcon />}>
              Smart defaults applied! Fields marked with{' '}
              <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" sx={{ mx: 0.5 }} />{' '}
              have been pre-filled. You can edit them as needed.
            </Alert>
          )}

          {/* Tab Panel 0: Product Details */}
          <Box hidden={!!product && currentTab !== 0}>
            <Grid container spacing={2} sx={{ mt: product ? 0 : 1 }}>
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
                  disabled={!!product}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Product Name"
                      required
                      helperText={!product ? "Start typing to see suggestions from existing products" : ""}
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

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.categoryId}
                    label="Category"
                    onChange={(e) => {
                      setFormData({ ...formData, categoryId: e.target.value });
                      setAutoFilledFields((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete('categoryId');
                        return newSet;
                      });
                    }}
                  >
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

              {/* Batch Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Batch Number"
                  value={formData.batchNumber}
                  onChange={handleChange('batchNumber')}
                  required
                  helperText={
                    autoFilledFields.has('batchNumber')
                      ? 'Auto-generated from production date'
                      : ''
                  }
                  InputProps={{
                    endAdornment: autoFilledFields.has('batchNumber') ? (
                      <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" />
                    ) : null,
                  }}
                />
              </Grid>

              {/* Production Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Production Date"
                  type="date"
                  value={formData.productionDate}
                  onChange={handleChange('productionDate')}
                  InputLabelProps={{ shrink: true }}
                  required
                  InputProps={{
                    endAdornment: autoFilledFields.has('productionDate') ? (
                      <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" />
                    ) : null,
                  }}
                />
              </Grid>

              {/* Shelf Life */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Shelf Life (days)"
                  type="number"
                  value={formData.shelfLife}
                  onChange={handleChange('shelfLife')}
                  required
                  helperText={
                    autoFilledFields.has('shelfLife')
                      ? 'Default shelf life'
                      : 'Expiration date will auto-calculate'
                  }
                  InputProps={{
                    endAdornment: autoFilledFields.has('shelfLife') ? (
                      <Chip size="small" label="Default" icon={<CheckIcon />} color="primary" />
                    ) : null,
                  }}
                />
              </Grid>

              {/* Expiration Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expiration Date"
                  type="date"
                  value={formData.expirationDate}
                  onChange={handleChange('expirationDate')}
                  InputLabelProps={{ shrink: true }}
                  required
                  helperText={
                    autoFilledFields.has('expirationDate')
                      ? 'Auto-calculated from production date + shelf life'
                      : ''
                  }
                  InputProps={{
                    endAdornment: autoFilledFields.has('expirationDate') ? (
                      <Chip size="small" label="Auto" icon={<CheckIcon />} color="primary" />
                    ) : null,
                  }}
                />
              </Grid>

              {/* Quantity */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange('quantity')}
                  required
                />
              </Grid>

              {/* Unit */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.unit}
                    label="Unit"
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    {units.map((unit) => (
                      <MenuItem key={unit.id} value={unit.symbol}>
                        {unit.name} ({unit.symbol})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Sale Price */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sale Price"
                  type="number"
                  value={formData.salePrice}
                  onChange={handleChange('salePrice')}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Cost to Produce */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cost to Produce"
                  type="number"
                  value={formData.costToProduce || ''}
                  onChange={handleChange('costToProduce')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Markup Percentage */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Markup Percentage"
                  type="number"
                  value={formData.markupPercentage || 50}
                  onChange={handleChange('markupPercentage')}
                  helperText={
                    autoFilledFields.has('markupPercentage')
                      ? 'Default profit margin'
                      : 'Profit margin percentage (e.g., 50 for 50% markup)'
                  }
                  InputProps={{
                    endAdornment: (
                      <>
                        <InputAdornment position="end">%</InputAdornment>
                        {autoFilledFields.has('markupPercentage') && (
                          <Chip size="small" label="Default" icon={<CheckIcon />} color="primary" sx={{ ml: 1 }} />
                        )}
                      </>
                    ),
                  }}
                />
              </Grid>

              {/* Storage Location */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Storage Location</InputLabel>
                  <Select
                    value={formData.storageLocationId}
                    label="Storage Location"
                    onChange={(e) => {
                      setFormData({ ...formData, storageLocationId: e.target.value });
                      setAutoFilledFields((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete('storageLocationId');
                        return newSet;
                      });
                    }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
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
                    value={formData.qualityStatusId || ''}
                    label="Quality Status"
                    onChange={(e) => {
                      setFormData({ ...formData, qualityStatusId: e.target.value });
                      setAutoFilledFields((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete('qualityStatusId');
                        return newSet;
                      });
                    }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {qualityStatuses.map((status: any) => (
                      <MenuItem key={status.id} value={status.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: borderRadius.sm,
                              backgroundColor: status.color || '#gray',
                              border: '1px solid #ddd',
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

              {/* Production Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Production Status</InputLabel>
                  <Select
                    value={formData.status || ''}
                    label="Production Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <MenuItem value={ProductStatus.IN_PRODUCTION}>In Production</MenuItem>
                    <MenuItem value={ProductStatus.COMPLETED}>Completed</MenuItem>
                    <MenuItem value={ProductStatus.ON_HOLD}>On Hold</MenuItem>
                    <MenuItem value={ProductStatus.DISCARDED}>Discarded</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Packaging Info */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Packaging Info"
                  multiline
                  rows={2}
                  value={formData.packagingInfo}
                  onChange={handleChange('packagingInfo')}
                />
              </Grid>

              {/* Is Contaminated */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!formData.isContaminated}
                      onChange={(e) => setFormData({ ...formData, isContaminated: e.target.checked })}
                      color="error"
                    />
                  }
                  label="Mark as contaminated"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Tab Panel 1: Materials (placeholder for future enhancement) */}
          {product && (
            <Box hidden={currentTab !== 1} sx={{ mt: 2 }}>
              <Alert severity="info">
                Material breakdown will be displayed here when available.
              </Alert>
            </Box>
          )}
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default EnhancedFinishedProductForm;
