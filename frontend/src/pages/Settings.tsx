import React, { useState } from 'react';
import {
    Container,
    Typography,
    Button,
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
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
    Stack,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Settings as SettingsIcon,
    ExpandMore as ExpandMoreIcon,
    Category as CategoryIcon,
    LocalShipping as SupplierIcon,
    Warehouse as StorageIcon,
    Straighten as UnitsIcon,
    CheckCircle as QualityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, suppliersApi, storageLocationsApi } from '../services/realApi';
import { Category, CategoryType, Supplier, StorageLocation } from '../types';
import UnitsManagement from '../components/Settings/UnitsManagement';
import QualityStatusManagement from '../components/Settings/QualityStatusManagement';

interface SettingsSectionProps {
    title: string;
    icon: React.ReactNode;
    description: string;
    onAdd: () => void;
    children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, icon, description, onAdd, children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Accordion defaultExpanded={!isMobile} sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }} elevation={2}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                    bgcolor: 'primary.50',
                    '&:hover': { bgcolor: 'primary.100' },
                    borderRadius: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    {icon}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="medium">
                            {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {description}
                        </Typography>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onAdd}
                        size={isMobile ? 'small' : 'medium'}
                    >
                        Add New
                    </Button>
                </Box>
                {children}
            </AccordionDetails>
        </Accordion>
    );
};

const Settings: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogType, setDialogType] = useState<'category' | 'supplier' | 'storageLocation'>('category');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [editingStorageLocation, setEditingStorageLocation] = useState<StorageLocation | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const [categoryForm, setCategoryForm] = useState({ name: '', type: CategoryType.RAW_MATERIAL, description: '' });
    const [supplierForm, setSupplierForm] = useState({ name: '', contactInfo: { email: '', phone: '' }, address: '', isActive: true });
    const [storageForm, setStorageForm] = useState({ name: '', type: '', description: '', capacity: '' });

    const queryClient = useQueryClient();

    // Fetch data
    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesApi.getAll(),
    });

    const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => suppliersApi.getAll(),
    });

    const { data: storageLocationsData, isLoading: storageLoading } = useQuery({
        queryKey: ['storageLocations'],
        queryFn: () => storageLocationsApi.getAll(),
    });

    const categories = categoriesData?.data || [];
    const suppliers = suppliersData?.data || [];
    const storageLocations = storageLocationsData?.data || [];

    // Category mutations
    const createCategoryMutation = useMutation({
        mutationFn: (data: Omit<Category, 'id' | 'createdAt'>) => categoriesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            handleCloseDialog();
            showSnackbar('Category created successfully', 'success');
        },
        onError: () => showSnackbar('Failed to create category', 'error'),
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => categoriesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            handleCloseDialog();
            showSnackbar('Category updated successfully', 'success');
        },
        onError: () => showSnackbar('Failed to update category', 'error'),
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => categoriesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            showSnackbar('Category deleted successfully', 'success');
        },
        onError: () => showSnackbar('Failed to delete category', 'error'),
    });

    // Supplier mutations
    const createSupplierMutation = useMutation({
        mutationFn: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => suppliersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            handleCloseDialog();
            showSnackbar('Supplier created successfully', 'success');
        },
        onError: () => showSnackbar('Failed to create supplier', 'error'),
    });

    const updateSupplierMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) => suppliersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            handleCloseDialog();
            showSnackbar('Supplier updated successfully', 'success');
        },
        onError: () => showSnackbar('Failed to update supplier', 'error'),
    });

    const deleteSupplierMutation = useMutation({
        mutationFn: (id: string) => suppliersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            showSnackbar('Supplier deleted successfully', 'success');
        },
        onError: () => showSnackbar('Failed to delete supplier', 'error'),
    });

    // Storage location mutations
    const createStorageMutation = useMutation({
        mutationFn: (data: Omit<StorageLocation, 'id' | 'createdAt'>) => storageLocationsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storageLocations'] });
            handleCloseDialog();
            showSnackbar('Storage location created successfully', 'success');
        },
        onError: () => showSnackbar('Failed to create storage location', 'error'),
    });

    const updateStorageMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<StorageLocation> }) => storageLocationsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storageLocations'] });
            handleCloseDialog();
            showSnackbar('Storage location updated successfully', 'success');
        },
        onError: () => showSnackbar('Failed to update storage location', 'error'),
    });

    const deleteStorageMutation = useMutation({
        mutationFn: (id: string) => storageLocationsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storageLocations'] });
            showSnackbar('Storage location deleted successfully', 'success');
        },
        onError: () => showSnackbar('Failed to delete storage location', 'error'),
    });

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCategory(null);
        setEditingSupplier(null);
        setEditingStorageLocation(null);
        setCategoryForm({ name: '', type: CategoryType.RAW_MATERIAL, description: '' });
        setSupplierForm({ name: '', contactInfo: { email: '', phone: '' }, address: '', isActive: true });
        setStorageForm({ name: '', type: '', description: '', capacity: '' });
    };

    const handleAddCategory = (type: CategoryType) => {
        setCategoryForm({ name: '', type, description: '' });
        setDialogType('category');
        setOpenDialog(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryForm({ name: category.name, type: category.type, description: category.description || '' });
        setDialogType('category');
        setOpenDialog(true);
    };

    const handleDeleteCategory = (id: string) => {
        if (window.confirm('Delete this category? This may affect related items.')) {
            deleteCategoryMutation.mutate(id);
        }
    };

    const handleSubmitCategory = () => {
        const data = { name: categoryForm.name, type: categoryForm.type, description: categoryForm.description };
        if (editingCategory) {
            updateCategoryMutation.mutate({ id: editingCategory.id, data });
        } else {
            createCategoryMutation.mutate(data);
        }
    };

    const handleAddSupplier = () => {
        setDialogType('supplier');
        setOpenDialog(true);
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setSupplierForm({
            name: supplier.name,
            contactInfo: supplier.contactInfo || { email: '', phone: '' },
            address: supplier.address || '',
            isActive: supplier.isActive ?? true,
        });
        setDialogType('supplier');
        setOpenDialog(true);
    };

    const handleDeleteSupplier = (id: string) => {
        if (window.confirm('Delete this supplier?')) {
            deleteSupplierMutation.mutate(id);
        }
    };

    const handleSubmitSupplier = () => {
        const data = supplierForm;
        if (editingSupplier) {
            updateSupplierMutation.mutate({ id: editingSupplier.id, data });
        } else {
            createSupplierMutation.mutate(data);
        }
    };

    const handleAddStorage = () => {
        setDialogType('storageLocation');
        setOpenDialog(true);
    };

    const handleEditStorage = (storage: StorageLocation) => {
        setEditingStorageLocation(storage);
        setStorageForm({
            name: storage.name,
            type: storage.type || '',
            description: storage.description || '',
            capacity: storage.capacity || '',
        });
        setDialogType('storageLocation');
        setOpenDialog(true);
    };

    const handleDeleteStorage = (id: string) => {
        if (window.confirm('Delete this storage location?')) {
            deleteStorageMutation.mutate(id);
        }
    };

    const handleSubmitStorage = () => {
        const data = storageForm;
        if (editingStorageLocation) {
            updateStorageMutation.mutate({ id: editingStorageLocation.id, data });
        } else {
            createStorageMutation.mutate(data);
        }
    };

    const renderCategoriesTable = (type: CategoryType) => {
        const filteredCategories = categories.filter((c: Category) => c.type === type);

        if (categoriesLoading) {
            return <Typography>Loading...</Typography>;
        }

        if (filteredCategories.length === 0) {
            return (
                <Alert severity="info">
                    No categories found. Click "Add New" to create one.
                </Alert>
            );
        }

        return (
            <TableContainer>
                <Table size={isMobile ? 'small' : 'medium'}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            {!isMobile && <TableCell>Description</TableCell>}
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCategories.map((category: Category) => (
                            <TableRow 
                              key={category.id} 
                              hover
                              onClick={() => handleEditCategory(category)}
                              sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {category.name}
                                    </Typography>
                                </TableCell>
                                {!isMobile && (
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {category.description || '-'}
                                        </Typography>
                                    </TableCell>
                                )}
                                <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <Tooltip title="Edit">
                                            <IconButton 
                                              size="small" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditCategory(category);
                                              }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton 
                                              size="small" 
                                              color="error" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCategory(category.id);
                                              }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderSuppliersTable = () => {
        if (suppliersLoading) {
            return <Typography>Loading...</Typography>;
        }

        if (suppliers.length === 0) {
            return (
                <Alert severity="info">
                    No suppliers found. Click "Add New" to create one.
                </Alert>
            );
        }

        return (
            <TableContainer>
                <Table size={isMobile ? 'small' : 'medium'}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            {!isMobile && <TableCell>Contact</TableCell>}
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {suppliers.map((supplier: Supplier) => (
                            <TableRow 
                              key={supplier.id} 
                              hover
                              onClick={() => handleEditSupplier(supplier)}
                              sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {supplier.name}
                                    </Typography>
                                </TableCell>
                                {!isMobile && (
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {supplier.contactInfo?.email || supplier.contactInfo?.phone || '-'}
                                        </Typography>
                                    </TableCell>
                                )}
                                <TableCell align="center">
                                    <Chip
                                        label={supplier.isActive ? 'Active' : 'Inactive'}
                                        color={supplier.isActive ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <Tooltip title="Edit">
                                            <IconButton 
                                              size="small" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditSupplier(supplier);
                                              }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton 
                                              size="small" 
                                              color="error" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSupplier(supplier.id);
                                              }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderStorageLocationsTable = () => {
        if (storageLoading) {
            return <Typography>Loading...</Typography>;
        }

        if (storageLocations.length === 0) {
            return (
                <Alert severity="info">
                    No storage locations found. Click "Add New" to create one.
                </Alert>
            );
        }

        return (
            <TableContainer>
                <Table size={isMobile ? 'small' : 'medium'}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            {!isMobile && <TableCell>Type</TableCell>}
                            {!isMobile && <TableCell>Capacity</TableCell>}
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {storageLocations.map((location: StorageLocation) => (
                            <TableRow 
                              key={location.id} 
                              hover
                              onClick={() => handleEditStorage(location)}
                              sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {location.name}
                                    </Typography>
                                </TableCell>
                                {!isMobile && (
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {location.type || '-'}
                                        </Typography>
                                    </TableCell>
                                )}
                                {!isMobile && (
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {location.capacity || '-'}
                                        </Typography>
                                    </TableCell>
                                )}
                                <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <Tooltip title="Edit">
                                            <IconButton 
                                              size="small" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditStorage(location);
                                              }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton 
                                              size="small" 
                                              color="error" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteStorage(location.id);
                                              }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <SettingsIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant={isMobile ? 'h4' : 'h3'} component="h1" fontWeight="bold">
                        Settings
                    </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                    Manage system settings including categories, suppliers, storage locations, units, and quality status.
                </Typography>
            </Box>

            {/* Categories Section - Raw Materials */}
            <SettingsSection
                title="Raw Material Categories"
                icon={<CategoryIcon color="primary" />}
                description="Manage categories for raw materials like flour, sugar, etc."
                onAdd={() => handleAddCategory(CategoryType.RAW_MATERIAL)}
            >
                {renderCategoriesTable(CategoryType.RAW_MATERIAL)}
            </SettingsSection>

            {/* Categories Section - Finished Products */}
            <SettingsSection
                title="Finished Product Categories"
                icon={<CategoryIcon color="secondary" />}
                description="Manage categories for finished products like bread, pastries, etc."
                onAdd={() => handleAddCategory(CategoryType.FINISHED_PRODUCT)}
            >
                {renderCategoriesTable(CategoryType.FINISHED_PRODUCT)}
            </SettingsSection>

            {/* Categories Section - Recipes */}
            <SettingsSection
                title="Recipe Categories"
                icon={<CategoryIcon color="success" />}
                description="Manage categories for recipes and production formulas"
                onAdd={() => handleAddCategory(CategoryType.RECIPE)}
            >
                {renderCategoriesTable(CategoryType.RECIPE)}
            </SettingsSection>

            {/* Suppliers Section */}
            <SettingsSection
                title="Suppliers"
                icon={<SupplierIcon color="info" />}
                description="Manage supplier contacts and information"
                onAdd={handleAddSupplier}
            >
                {renderSuppliersTable()}
            </SettingsSection>

            {/* Storage Locations Section */}
            <SettingsSection
                title="Storage Locations"
                icon={<StorageIcon color="warning" />}
                description="Manage storage locations and warehouses"
                onAdd={handleAddStorage}
            >
                {renderStorageLocationsTable()}
            </SettingsSection>

            {/* Units Section */}
            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }} elevation={2}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        bgcolor: 'primary.50',
                        '&:hover': { bgcolor: 'primary.100' },
                        borderRadius: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <UnitsIcon color="primary" />
                        <Box>
                            <Typography variant="h6" fontWeight="medium">
                                Units of Measurement
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Manage units for ingredients and products
                            </Typography>
                        </Box>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <UnitsManagement />
                </AccordionDetails>
            </Accordion>

            {/* Quality Status Section */}
            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }} elevation={2}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        bgcolor: 'primary.50',
                        '&:hover': { bgcolor: 'primary.100' },
                        borderRadius: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <QualityIcon color="success" />
                        <Box>
                            <Typography variant="h6" fontWeight="medium">
                                Quality Status
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Manage quality control status options
                            </Typography>
                        </Box>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <QualityStatusManagement />
                </AccordionDetails>
            </Accordion>

            {/* Dialog for Add/Edit */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialogType === 'category' && (editingCategory ? 'Edit Category' : 'Add Category')}
                    {dialogType === 'supplier' && (editingSupplier ? 'Edit Supplier' : 'Add Supplier')}
                    {dialogType === 'storageLocation' && (editingStorageLocation ? 'Edit Storage Location' : 'Add Storage Location')}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        {/* Category Form */}
                        {dialogType === 'category' && (
                            <>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Category Name"
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Category Type</InputLabel>
                                        <Select
                                            value={categoryForm.type}
                                            label="Category Type"
                                            onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as CategoryType })}
                                        >
                                            <MenuItem value={CategoryType.RAW_MATERIAL}>Raw Material</MenuItem>
                                            <MenuItem value={CategoryType.FINISHED_PRODUCT}>Finished Product</MenuItem>
                                            <MenuItem value={CategoryType.RECIPE}>Recipe</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Description"
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        multiline
                                        rows={3}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Supplier Form */}
                        {dialogType === 'supplier' && (
                            <>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Supplier Name"
                                        value={supplierForm.name}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        value={supplierForm.contactInfo.email}
                                        onChange={(e) => setSupplierForm({
                                            ...supplierForm,
                                            contactInfo: { ...supplierForm.contactInfo, email: e.target.value }
                                        })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone"
                                        value={supplierForm.contactInfo.phone}
                                        onChange={(e) => setSupplierForm({
                                            ...supplierForm,
                                            contactInfo: { ...supplierForm.contactInfo, phone: e.target.value }
                                        })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Address"
                                        value={supplierForm.address}
                                        onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                        multiline
                                        rows={2}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={supplierForm.isActive ? 'active' : 'inactive'}
                                            label="Status"
                                            onChange={(e) => setSupplierForm({ ...supplierForm, isActive: e.target.value === 'active' })}
                                        >
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="inactive">Inactive</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </>
                        )}

                        {/* Storage Location Form */}
                        {dialogType === 'storageLocation' && (
                            <>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Location Name"
                                        value={storageForm.name}
                                        onChange={(e) => setStorageForm({ ...storageForm, name: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Type"
                                        value={storageForm.type}
                                        onChange={(e) => setStorageForm({ ...storageForm, type: e.target.value })}
                                        placeholder="e.g., Freezer, Dry Storage"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Capacity"
                                        value={storageForm.capacity}
                                        onChange={(e) => setStorageForm({ ...storageForm, capacity: e.target.value })}
                                        placeholder="e.g., 500 kg"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Description"
                                        value={storageForm.description}
                                        onChange={(e) => setStorageForm({ ...storageForm, description: e.target.value })}
                                        multiline
                                        rows={3}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (dialogType === 'category') handleSubmitCategory();
                            else if (dialogType === 'supplier') handleSubmitSupplier();
                            else handleSubmitStorage();
                        }}
                    >
                        {editingCategory || editingSupplier || editingStorageLocation ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Settings;
