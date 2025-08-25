import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawMaterialsApi, categoriesApi, storageLocationsApi, unitsApi, suppliersApi } from '../services/realApi';
import { RawMaterial, CategoryType, CreateRawMaterialData, UpdateRawMaterialData } from '../types';
import { formatDate, formatQuantity, isExpired, isExpiringSoon, getDaysUntilExpiration } from '../utils/api';

const RawMaterials: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openForm, setOpenForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expirationFilter, setExpirationFilter] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const queryClient = useQueryClient();

  // Fetch data
  const { data: materials } = useQuery(['rawMaterials'], rawMaterialsApi.getAll);
  const { data: categoriesResponse } = useQuery(['categories'], () => categoriesApi.getAll());
  const { data: storageLocationsResponse } = useQuery(['storageLocations'], storageLocationsApi.getAll);
  const { data: unitsResponse } = useQuery(['units'], unitsApi.getAll);
  const { data: suppliersResponse } = useQuery(['suppliers'], suppliersApi.getAll);
  
  const categories = categoriesResponse?.data?.filter(c => c.type === CategoryType.RAW_MATERIAL);
  const storageLocations = storageLocationsResponse?.data;
  const units = unitsResponse?.data;
  const suppliers = suppliersResponse?.data;

  // Mutations
  const createMutation = useMutation(rawMaterialsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['rawMaterials']);
      handleCloseForm();
      showSnackbar('Raw material created successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error creating raw material', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRawMaterialData }) => 
      rawMaterialsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rawMaterials']);
      handleCloseForm();
      showSnackbar('Raw material updated successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error updating raw material', 'error');
    },
  });

  const deleteMutation = useMutation(rawMaterialsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries(['rawMaterials']);
      showSnackbar('Raw material deleted successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error deleting raw material', 'error');
    },
  });

  // Filter materials
  const filteredMaterials = materials?.data?.filter((material) => {
    const matchesSearch = !searchTerm || 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || material.categoryId === categoryFilter;
    
    const matchesExpiration = !expirationFilter || 
      (expirationFilter === 'expired' && isExpired(material.expirationDate)) ||
      (expirationFilter === 'expiring' && isExpiringSoon(material.expirationDate)) ||
      (expirationFilter === 'contaminated' && material.isContaminated);

    return matchesSearch && matchesCategory && matchesExpiration;
  }) || [];

  // Handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenForm = (material?: RawMaterial) => {
    setEditingMaterial(material || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingMaterial(null);
  };

  const handleDelete = (material: RawMaterial) => {
    if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
      deleteMutation.mutate(material.id);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getContaminationChip = (isContaminated: boolean) => {
    if (isContaminated) {
      return <Chip label="CONTAMINATED" color="error" size="small" />;
    }
    return <Chip label="Clean" color="success" size="small" />;
  };

  const getExpirationChip = (expirationDate: string) => {
    if (isExpired(expirationDate)) {
      return <Chip label="EXPIRED" color="error" size="small" />;
    }
    if (isExpiringSoon(expirationDate)) {
      const days = getDaysUntilExpiration(expirationDate);
      return <Chip label={`Expires in ${days} days`} color="warning" size="small" />;
    }
    const days = getDaysUntilExpiration(expirationDate);
    return <Chip label={`${days} days left`} color="success" size="small" />;
  };

  const getStockLevelChip = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) {
      return <Chip label="OUT OF STOCK" color="error" size="small" />;
    }
    if (quantity <= reorderLevel) {
      return <Chip label="LOW STOCK" color="warning" size="small" />;
    }
    return <Chip label="In Stock" color="success" size="small" />;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Raw Materials
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          Add Raw Material
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories?.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Filter</InputLabel>
              <Select
                value={expirationFilter}
                label="Filter"
                onChange={(e) => setExpirationFilter(e.target.value)}
              >
                <MenuItem value="">All Items</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="expiring">Expiring Soon</MenuItem>
                <MenuItem value="contaminated">Contaminated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="body2" color="text.secondary">
              Total: {filteredMaterials.length} items
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Materials Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name & Batch</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Stock Level</TableCell>
                <TableCell>Expiration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMaterials
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((material) => (
                  <TableRow hover key={material.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {material.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Batch: {material.batchNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {material.category?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {material.supplier?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatQuantity(material.quantity, material.unit)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reorder: {formatQuantity(material.reorderLevel, material.unit)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      ${material.unitPrice?.toFixed(2) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getStockLevelChip(material.quantity, material.reorderLevel)}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(material.expirationDate)}
                        </Typography>
                        {getExpirationChip(material.expirationDate)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getContaminationChip(material.isContaminated)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenForm(material)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(material)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredMaterials.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Form Dialog */}
      <RawMaterialForm
        open={openForm}
        onClose={handleCloseForm}
        material={editingMaterial}
        categories={categories || []}
        storageLocations={storageLocations || []}
        units={units || []}
        suppliers={suppliers || []}
        onSubmit={(data) => {
          if (editingMaterial) {
            // For updates, include contaminated field if it exists
            const updateData: UpdateRawMaterialData = { ...data };
            if (data.contaminated !== undefined) {
              updateData.contaminated = data.contaminated;
            }
            updateMutation.mutate({ id: editingMaterial.id, data: updateData });
          } else {
            // For creation, remove contaminated field since new materials are not contaminated
            const { contaminated, ...createData } = data;
            createMutation.mutate(createData);
          }
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Raw Material Form Component
interface RawMaterialFormData extends CreateRawMaterialData {
  contaminated?: boolean;
}

interface RawMaterialFormProps {
  open: boolean;
  onClose: () => void;
  material: RawMaterial | null;
  categories: any[];
  storageLocations: any[];
  units: any[];
  suppliers: any[];
  onSubmit: (data: RawMaterialFormData) => void;
}

const RawMaterialForm: React.FC<RawMaterialFormProps> = ({
  open,
  onClose,
  material,
  categories,
  storageLocations,
  units,
  suppliers,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<RawMaterialFormData>({
    name: '',
    categoryId: '',
    supplierId: '', // We'll handle suppliers later
    batchNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    quantity: 0,
    unit: '',
    costPerUnit: 0,
    reorderLevel: 0,
    storageLocationId: '',
    contaminated: false,
  });

  React.useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        categoryId: material.categoryId,
        supplierId: material.supplierId,
        batchNumber: material.batchNumber,
        purchaseDate: material.purchaseDate ? material.purchaseDate.split('T')[0] : '',
        expirationDate: material.expirationDate.split('T')[0],
        quantity: material.quantity,
        unit: material.unit,
        costPerUnit: material.unitPrice,
        reorderLevel: material.reorderLevel,
        storageLocationId: material.storageLocationId,
        contaminated: material.isContaminated,
      });
    } else {
      setFormData({
        name: '',
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
        contaminated: false,
      });
    }
  }, [material, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateRawMaterialData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: ['quantity', 'costPerUnit', 'reorderLevel'].includes(field) ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {material ? 'Edit Raw Material' : 'Add New Raw Material'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Name"
                value={formData.name}
                onChange={handleChange('name')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Batch Number"
                value={formData.batchNumber}
                onChange={handleChange('batchNumber')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.categoryId}
                  label="Category"
                  onChange={handleChange('categoryId')}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={formData.supplierId}
                  label="Supplier"
                  onChange={handleChange('supplierId')}
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
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
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Purchase Date"
                type="date"
                value={formData.purchaseDate}
                onChange={handleChange('purchaseDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Expiration Date"
                type="date"
                value={formData.expirationDate}
                onChange={handleChange('expirationDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange('quantity')}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unit}
                  label="Unit"
                  onChange={handleChange('unit')}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit.id} value={unit.symbol}>
                      {unit.name} ({unit.symbol})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {material && (
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.contaminated || false}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, contaminated: e.target.checked }))}
                      color="error"
                    />
                  }
                  label="Contaminated"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Cost per Unit"
                type="number"
                value={formData.costPerUnit}
                onChange={handleChange('costPerUnit')}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Reorder Level"
                type="number"
                value={formData.reorderLevel}
                onChange={handleChange('reorderLevel')}
                inputProps={{ min: 0, step: 0.1 }}
                helperText="Minimum quantity before reordering"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {material ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RawMaterials;
