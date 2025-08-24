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
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rawMaterialsApi, categoriesApi, suppliersApi, storageLocationsApi } from '../services/mockApi';
import { RawMaterial, Category, Supplier, StorageLocation } from '../types';
import { formatDate, formatCurrency, formatQuantity, isExpired, isExpiringSoon, getDaysUntilExpiration } from '../utils/api';

interface FormData {
  name: string;
  description: string;
  categoryId: string;
  supplierId: string;
  storageLocationId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  reorderLevel: number;
  expirationDate: string;
  batchNumber: string;
}

const RawMaterials: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [showExpiring, setShowExpiring] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<RawMaterial | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    categoryId: '',
    supplierId: '',
    storageLocationId: '',
    quantity: 0,
    unit: 'kg',
    unitPrice: 0,
    reorderLevel: 0,
    expirationDate: '',
    batchNumber: '',
  });

  const queryClient = useQueryClient();

  // Fetch raw materials
  const { data: rawMaterialsData, isLoading, error } = useQuery({
    queryKey: ['rawMaterials', page + 1, rowsPerPage, search, categoryFilter, supplierFilter, showExpiring],
    queryFn: () => rawMaterialsApi.getAll({
      page: page + 1,
      limit: rowsPerPage,
      search,
      categoryId: categoryFilter,
      supplierId: supplierFilter,
      showExpiring,
    }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'RAW_MATERIAL'],
    queryFn: () => categoriesApi.getAll('RAW_MATERIAL'),
  });

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll(),
  });

  // Fetch storage locations
  const { data: storageLocationsData } = useQuery({
    queryKey: ['storageLocations'],
    queryFn: () => storageLocationsApi.getAll(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>) => rawMaterialsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      setOpenDialog(false);
      resetForm();
      setSnackbar({ open: true, message: 'Raw material created successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to create raw material', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RawMaterial> }) => rawMaterialsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      setOpenDialog(false);
      setEditingItem(null);
      resetForm();
      setSnackbar({ open: true, message: 'Raw material updated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to update raw material', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rawMaterialsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      setSnackbar({ open: true, message: 'Raw material deleted successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to delete raw material', severity: 'error' });
    },
  });

  const rawMaterials = rawMaterialsData?.data || [];
  const categories = categoriesData?.data || [];
  const suppliers = suppliersData?.data || [];
  const storageLocations = storageLocationsData?.data || [];
  const totalCount = rawMaterialsData?.pagination?.total || 0;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
  };

  const handleEdit = (item: RawMaterial) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      categoryId: item.categoryId,
      supplierId: item.supplierId,
      storageLocationId: item.storageLocationId,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      reorderLevel: item.reorderLevel,
      expirationDate: item.expirationDate,
      batchNumber: item.batchNumber,
    });
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this raw material?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdd = () => {
    resetForm();
    setEditingItem(null);
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      supplierId: '',
      storageLocationId: '',
      quantity: 0,
      unit: 'kg',
      unitPrice: 0,
      reorderLevel: 0,
      expirationDate: '',
      batchNumber: '',
    });
  };

  const handleFormSubmit = () => {
    const data = {
      ...formData,
      isContaminated: false,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFormChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }> | SelectChangeEvent<string>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'quantity' || field === 'unitPrice' || field === 'reorderLevel'
        ? Number(value)
        : value
    }));
  };

  const getStatusChip = (item: RawMaterial) => {
    if (item.isContaminated) {
      return <Chip label="Contaminated" color="error" size="small" />;
    }
    if (isExpired(item.expirationDate)) {
      return <Chip label="Expired" color="error" size="small" />;
    }
    if (isExpiringSoon(item.expirationDate)) {
      return <Chip label={`Expires in ${getDaysUntilExpiration(item.expirationDate)} days`} color="warning" size="small" />;
    }
    if (item.quantity <= item.reorderLevel) {
      return <Chip label="Low Stock" color="warning" size="small" />;
    }
    return <Chip label="Good" color="success" size="small" />;
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c: Category) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((s: Supplier) => s.id === supplierId);
    return supplier?.name || 'Unknown';
  };

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error">
          Error loading raw materials. Using mock data for demonstration.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Raw Materials
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage raw materials inventory, track expiration dates, and monitor stock levels.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category: Category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={supplierFilter}
                label="Supplier"
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <MenuItem value="">All Suppliers</MenuItem>
                {suppliers.map((supplier: Supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant={showExpiring ? "contained" : "outlined"}
              onClick={() => setShowExpiring(!showExpiring)}
              startIcon={<WarningIcon />}
            >
              Expiring Soon
            </Button>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
              >
                Add Raw Material
              </Button>
              <IconButton onClick={() => queryClient.invalidateQueries({ queryKey: ['rawMaterials'] })}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Expiration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : rawMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No raw materials found</TableCell>
                </TableRow>
              ) : (
                rawMaterials.map((item: RawMaterial) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Batch: {item.batchNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getCategoryName(item.categoryId)}</TableCell>
                    <TableCell>{getSupplierName(item.supplierId)}</TableCell>
                    <TableCell>{formatQuantity(item.quantity, item.unit)}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>{formatDate(item.expirationDate)}</TableCell>
                    <TableCell>{getStatusChip(item)}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(item)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Raw Material' : 'Add Raw Material'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleFormChange('name')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Batch Number"
                value={formData.batchNumber}
                onChange={handleFormChange('batchNumber')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleFormChange('description')}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.categoryId}
                  label="Category"
                  onChange={handleFormChange('categoryId')}
                >
                  {categories.map((category: Category) => (
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
                  onChange={handleFormChange('supplierId')}
                >
                  {suppliers.map((supplier: Supplier) => (
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
                  onChange={handleFormChange('storageLocationId')}
                >
                  {storageLocations.map((location: StorageLocation) => (
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
                label="Unit"
                value={formData.unit}
                onChange={handleFormChange('unit')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleFormChange('quantity')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={formData.unitPrice}
                onChange={handleFormChange('unitPrice')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Reorder Level"
                type="number"
                value={formData.reorderLevel}
                onChange={handleFormChange('reorderLevel')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expiration Date"
                type="date"
                value={formData.expirationDate}
                onChange={handleFormChange('expirationDate')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RawMaterials;
