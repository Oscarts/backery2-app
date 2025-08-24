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
  Tabs,
  Tab,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, suppliersApi, storageLocationsApi } from '../services/mockApi';
import { Category, CategoryType, Supplier, StorageLocation } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface CategoryFormData {
  name: string;
  type: CategoryType;
  description: string;
}

interface SupplierFormData {
  name: string;
  contactInfo: any;
  address: string;
  isActive: boolean;
}

interface StorageLocationFormData {
  name: string;
  type: string;
  description: string;
  capacity: string;
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'category' | 'supplier' | 'storageLocation'>('category');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingStorageLocation, setEditingStorageLocation] = useState<StorageLocation | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: CategoryType.RAW_MATERIAL,
    description: '',
  });

  const [supplierFormData, setSupplierFormData] = useState<SupplierFormData>({
    name: '',
    contactInfo: { email: '', phone: '' },
    address: '',
    isActive: true,
  });

  const [storageLocationFormData, setStorageLocationFormData] = useState<StorageLocationFormData>({
    name: '',
    type: '',
    description: '',
    capacity: '',
  });

  const queryClient = useQueryClient();

  // Fetch all categories
  const { data: categoriesData, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  // Fetch all suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll(),
  });

  // Fetch all storage locations
  const { data: storageLocationsData } = useQuery({
    queryKey: ['storageLocations'],
    queryFn: () => storageLocationsApi.getAll(),
  });

  // Mutations for categories
  const createCategoryMutation = useMutation({
    mutationFn: (data: Omit<Category, 'id' | 'createdAt'>) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setOpenDialog(false);
      resetForm();
      setSnackbar({ open: true, message: 'Category created successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to create category', severity: 'error' });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setOpenDialog(false);
      setEditingCategory(null);
      resetForm();
      setSnackbar({ open: true, message: 'Category updated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to update category', severity: 'error' });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSnackbar({ open: true, message: 'Category deleted successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to delete category', severity: 'error' });
    },
  });

  // Mutations for suppliers
  const createSupplierMutation = useMutation({
    mutationFn: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => suppliersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpenDialog(false);
      resetSupplierForm();
      setSnackbar({ open: true, message: 'Supplier created successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to create supplier', severity: 'error' });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) => suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpenDialog(false);
      setEditingSupplier(null);
      resetSupplierForm();
      setSnackbar({ open: true, message: 'Supplier updated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to update supplier', severity: 'error' });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setSnackbar({ open: true, message: 'Supplier deleted successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to delete supplier', severity: 'error' });
    },
  });

  // Mutations for storage locations
  const createStorageLocationMutation = useMutation({
    mutationFn: (data: Omit<StorageLocation, 'id' | 'createdAt'>) => storageLocationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageLocations'] });
      setOpenDialog(false);
      resetStorageLocationForm();
      setSnackbar({ open: true, message: 'Storage location created successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to create storage location', severity: 'error' });
    },
  });

  const updateStorageLocationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StorageLocation> }) => storageLocationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageLocations'] });
      setOpenDialog(false);
      setEditingStorageLocation(null);
      resetStorageLocationForm();
      setSnackbar({ open: true, message: 'Storage location updated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to update storage location', severity: 'error' });
    },
  });

  const deleteStorageLocationMutation = useMutation({
    mutationFn: (id: string) => storageLocationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageLocations'] });
      setSnackbar({ open: true, message: 'Storage location deleted successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to delete storage location', severity: 'error' });
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddCategory = () => {
    resetForm();
    setEditingCategory(null);
    setDialogType('category');
    setOpenDialog(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || '',
    });
    setDialogType('category');
    setOpenDialog(true);
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This may affect related items.')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: CategoryType.RAW_MATERIAL,
      description: '',
    });
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contactInfo: { email: '', phone: '' },
      address: '',
      isActive: true,
    });
  };

  const resetStorageLocationForm = () => {
    setStorageLocationFormData({
      name: '',
      type: '',
      description: '',
      capacity: '',
    });
  };

  const categories = categoriesData?.data || [];
  const suppliers = suppliersData?.data || [];
  const storageLocations = storageLocationsData?.data || [];

  const handleFormSubmit = () => {
    if (dialogType === 'category') {
      const data = {
        ...formData,
      };

      if (editingCategory) {
        updateCategoryMutation.mutate({ id: editingCategory.id, data });
      } else {
        createCategoryMutation.mutate(data);
      }
    } else if (dialogType === 'supplier') {
      const data = {
        ...supplierFormData,
      };

      if (editingSupplier) {
        updateSupplierMutation.mutate({ id: editingSupplier.id, data });
      } else {
        createSupplierMutation.mutate(data);
      }
    } else if (dialogType === 'storageLocation') {
      const data = {
        ...storageLocationFormData,
      };

      if (editingStorageLocation) {
        updateStorageLocationMutation.mutate({ id: editingStorageLocation.id, data });
      } else {
        createStorageLocationMutation.mutate(data);
      }
    }
  };

  const handleFormChange = (field: keyof CategoryFormData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }> | SelectChangeEvent<string>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSupplierFormChange = (field: keyof SupplierFormData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }> | SelectChangeEvent<string>
  ) => {
    const value = event.target.value;
    setSupplierFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStorageLocationFormChange = (field: keyof StorageLocationFormData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }> | SelectChangeEvent<string>
  ) => {
    const value = event.target.value;
    setStorageLocationFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCategoryTypeLabel = (type: CategoryType) => {
    switch (type) {
      case CategoryType.RAW_MATERIAL:
        return 'Raw Material';
      case CategoryType.INTERMEDIATE:
        return 'Intermediate Product';
      case CategoryType.FINISHED_PRODUCT:
        return 'Finished Product';
      case CategoryType.RECIPE:
        return 'Recipe';
      default:
        return type;
    }
  };

  const getCategoryTypeColor = (type: CategoryType) => {
    switch (type) {
      case CategoryType.RAW_MATERIAL:
        return 'primary';
      case CategoryType.INTERMEDIATE:
        return 'secondary';
      case CategoryType.FINISHED_PRODUCT:
        return 'success';
      case CategoryType.RECIPE:
        return 'warning';
      default:
        return 'default';
    }
  };

  const filterCategoriesByType = (type: CategoryType) => {
    return categories.filter(category => category.type === type);
  };

  // Supplier handlers
  const handleAddSupplier = () => {
    resetSupplierForm();
    setEditingSupplier(null);
    setDialogType('supplier');
    setOpenDialog(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      contactInfo: supplier.contactInfo || { email: '', phone: '' },
      address: supplier.address || '',
      isActive: supplier.isActive !== false,
    });
    setDialogType('supplier');
    setOpenDialog(true);
  };

  const handleDeleteSupplier = (id: string) => {
    if (window.confirm('Are you sure you want to delete this supplier? This may affect related items.')) {
      deleteSupplierMutation.mutate(id);
    }
  };

  // Storage location handlers
  const handleAddStorageLocation = () => {
    resetStorageLocationForm();
    setEditingStorageLocation(null);
    setDialogType('storageLocation');
    setOpenDialog(true);
  };

  const handleEditStorageLocation = (location: StorageLocation) => {
    setEditingStorageLocation(location);
    setStorageLocationFormData({
      name: location.name,
      type: location.type || '',
      description: location.description || '',
      capacity: location.capacity || '',
    });
    setDialogType('storageLocation');
    setOpenDialog(true);
  };

  const handleDeleteStorageLocation = (id: string) => {
    if (window.confirm('Are you sure you want to delete this storage location? This may affect related items.')) {
      deleteStorageLocationMutation.mutate(id);
    }
  };

  const renderCategoriesTable = (categoryType: CategoryType) => {
    const filteredCategories = filterCategoriesByType(categoryType);
    
    return (
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {getCategoryTypeLabel(categoryType)} Categories
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCategory}
          >
            Add Category
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">Loading...</TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No {getCategoryTypeLabel(categoryType).toLowerCase()} categories found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category: Category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {category.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getCategoryTypeLabel(category.type)} 
                        color={getCategoryTypeColor(category.type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditCategory(category)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteCategory(category.id)}>
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
      </Paper>
    );
  };

  const renderSuppliersTable = () => {
    return (
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Suppliers
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddSupplier}
          >
            Add Supplier
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No suppliers found. Click "Add Supplier" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>
                      {supplier.contactInfo?.email && (
                        <div>{supplier.contactInfo.email}</div>
                      )}
                      {supplier.contactInfo?.phone && (
                        <div>{supplier.contactInfo.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>{supplier.address}</TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.isActive ? 'Active' : 'Inactive'}
                        color={supplier.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit supplier">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditSupplier(supplier)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete supplier">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                        >
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
      </Paper>
    );
  };

  const renderStorageLocationsTable = () => {
    return (
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Storage Locations
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddStorageLocation}
          >
            Add Storage Location
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {storageLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No storage locations found. Click "Add Storage Location" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                storageLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>{location.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={location.type || 'N/A'}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{location.description}</TableCell>
                    <TableCell>{location.capacity}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit storage location">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditStorageLocation(location)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete storage location">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteStorageLocation(location.id)}
                        >
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
      </Paper>
    );
  };

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error">
          Error loading settings. Using mock data for demonstration.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h4" component="h1">
            Settings
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage system settings including categories, suppliers, and storage locations.
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Raw Materials" />
          <Tab label="Intermediate Products" />
          <Tab label="Finished Products" />
          <Tab label="Recipes" />
          <Tab label="Suppliers" />
          <Tab label="Storage Locations" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {renderCategoriesTable(CategoryType.RAW_MATERIAL)}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderCategoriesTable(CategoryType.INTERMEDIATE)}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderCategoriesTable(CategoryType.FINISHED_PRODUCT)}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {renderCategoriesTable(CategoryType.RECIPE)}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {renderSuppliersTable()}
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        {renderStorageLocationsTable()}
      </TabPanel>

      {/* Add/Edit Category Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'category' && (editingCategory ? 'Edit Category' : 'Add Category')}
          {dialogType === 'supplier' && (editingSupplier ? 'Edit Supplier' : 'Add Supplier')}
          {dialogType === 'storageLocation' && (editingStorageLocation ? 'Edit Storage Location' : 'Add Storage Location')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {dialogType === 'category' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Category Name"
                    value={formData.name}
                    onChange={handleFormChange('name')}
                    required
                    placeholder="e.g., Organic Flour, Premium Chocolate"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Category Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Category Type"
                      onChange={handleFormChange('type')}
                    >
                      <MenuItem value={CategoryType.RAW_MATERIAL}>Raw Material</MenuItem>
                      <MenuItem value={CategoryType.INTERMEDIATE}>Intermediate Product</MenuItem>
                      <MenuItem value={CategoryType.FINISHED_PRODUCT}>Finished Product</MenuItem>
                      <MenuItem value={CategoryType.RECIPE}>Recipe</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={handleFormChange('description')}
                    multiline
                    rows={3}
                    placeholder="Describe what this category includes..."
                  />
                </Grid>
              </>
            )}

            {dialogType === 'supplier' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Supplier Name"
                    value={supplierFormData.name}
                    onChange={handleSupplierFormChange('name')}
                    required
                    placeholder="e.g., Premium Flour Co."
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={supplierFormData.contactInfo.email}
                    onChange={(e) => setSupplierFormData(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                    placeholder="contact@supplier.com"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={supplierFormData.contactInfo.phone}
                    onChange={(e) => setSupplierFormData(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                    placeholder="+1-555-0000"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={supplierFormData.address}
                    onChange={handleSupplierFormChange('address')}
                    multiline
                    rows={2}
                    placeholder="Full address of the supplier"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={supplierFormData.isActive ? 'true' : 'false'}
                      label="Status"
                      onChange={(e) => setSupplierFormData(prev => ({
                        ...prev,
                        isActive: e.target.value === 'true'
                      }))}
                    >
                      <MenuItem value="true">Active</MenuItem>
                      <MenuItem value="false">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {dialogType === 'storageLocation' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location Name"
                    value={storageLocationFormData.name}
                    onChange={handleStorageLocationFormChange('name')}
                    required
                    placeholder="e.g., Dry Storage A"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={storageLocationFormData.type}
                      label="Type"
                      onChange={handleStorageLocationFormChange('type')}
                    >
                      <MenuItem value="DRY">Dry Storage</MenuItem>
                      <MenuItem value="COLD">Cold Storage</MenuItem>
                      <MenuItem value="FROZEN">Frozen Storage</MenuItem>
                      <MenuItem value="AMBIENT">Ambient Storage</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Capacity"
                    value={storageLocationFormData.capacity}
                    onChange={handleStorageLocationFormChange('capacity')}
                    placeholder="e.g., 500 kg"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={storageLocationFormData.description}
                    onChange={handleStorageLocationFormChange('description')}
                    multiline
                    rows={3}
                    placeholder="Description of the storage location"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={
              (dialogType === 'category' && (createCategoryMutation.isPending || updateCategoryMutation.isPending)) ||
              (dialogType === 'supplier' && (createSupplierMutation.isPending || updateSupplierMutation.isPending)) ||
              (dialogType === 'storageLocation' && (createStorageLocationMutation.isPending || updateStorageLocationMutation.isPending))
            }
          >
            {dialogType === 'category' && (editingCategory ? 'Update' : 'Create')}
            {dialogType === 'supplier' && (editingSupplier ? 'Update' : 'Create')}
            {dialogType === 'storageLocation' && (editingStorageLocation ? 'Update' : 'Create')}
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

export default Settings;
