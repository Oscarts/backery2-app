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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Snackbar,
  Chip,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  Stack,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ShoppingCart as OrderIcon,
  Person as PersonIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  FilterList as FilterIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../services/realApi';
import { Customer, CreateCustomerData } from '../types';
import { borderRadius } from '../theme/designTokens';

const Customers: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // View mode state
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Form state
  const [openForm, setOpenForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  });

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Fetch customers
  const { data: customersData, isLoading, error } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: () => customersApi.getAll(searchTerm),
  });

  const customers = customersData?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setOpenForm(false);
      resetForm();
      showSnackbar('Customer created successfully', 'success');
    },
    onError: (error: Error) => {
      showSnackbar(`Error: ${error.message}`, 'error');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerData> }) =>
      customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setOpenForm(false);
      resetForm();
      showSnackbar('Customer updated successfully', 'success');
    },
    onError: (error: Error) => {
      showSnackbar(`Error: ${error.message}`, 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      showSnackbar('Customer deleted successfully', 'success');
    },
    onError: (error: Error) => {
      showSnackbar(`Error: ${error.message}`, 'error');
    },
  });

  // Helper functions
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      isActive: true,
    });
    setEditingCustomer(null);
  };

  const handleOpenForm = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        isActive: customer.isActive,
      });
    } else {
      resetForm();
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      showSnackbar('Customer name is required', 'error');
      return;
    }

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(0);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Calculate KPI metrics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c: Customer) => c.isActive).length;
  const inactiveCustomers = customers.filter((c: Customer) => !c.isActive).length;

  // Apply status filter
  const filteredCustomers = statusFilter === 'all'
    ? customers
    : statusFilter === 'active'
    ? customers.filter((c: Customer) => c.isActive)
    : customers.filter((c: Customer) => !c.isActive);

  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get customer initials for avatar
  const getCustomerInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get avatar color based on customer name
  const getAvatarColor = (name: string) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Error loading customers: {(error as Error).message}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header with responsive design */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={2}
      >
        <Box>
          <Typography 
            variant={isMobile ? "h4" : "h3"}
            sx={{
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1
            }}
          >
            <PersonIcon sx={{ fontSize: '1.2em', color: 'primary.main' }} />
            Customer Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your customer relationships and order history
          </Typography>
        </Box>

        <Box display="flex" gap={1} width={{ xs: '100%', sm: 'auto' }}>
          {/* View Toggle Buttons */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'flex' },
              border: 1,
              borderColor: 'divider',
              borderRadius: borderRadius.base, // 12px - Modern rounded toggle
              mr: 1
            }}
          >
            <Tooltip title="List View">
              <IconButton
                color={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
                sx={{
                  borderRadius: `${borderRadius.base} 0 0 ${borderRadius.base}`, // Left rounded
                  bgcolor: viewMode === 'list' ? 'action.selected' : 'transparent'
                }}
              >
                <ListViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Card View">
              <IconButton
                color={viewMode === 'card' ? 'primary' : 'default'}
                onClick={() => setViewMode('card')}
                sx={{
                  borderRadius: `0 ${borderRadius.base} ${borderRadius.base} 0`, // Right rounded
                  bgcolor: viewMode === 'card' ? 'action.selected' : 'transparent'
                }}
              >
                <GridViewIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            sx={{
              flexGrow: { xs: 1, sm: 0 },
              whiteSpace: 'nowrap'
            }}
          >
            {!isMobile ? 'Add Customer' : 'Add'}
          </Button>

          {/* Filter Toggle Button for Mobile */}
          {isMobile && (
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              Filter
            </Button>
          )}
        </Box>
      </Box>

      {/* Modern KPI cards */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card
            onClick={() => setStatusFilter('all')}
            elevation={1}
            sx={{
              borderRadius: borderRadius.md, // 16px - Modern rounded cards
              p: 0.5,
              border: 1,
              borderColor: statusFilter === 'all' ? 'primary.main' : 'divider',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: 'primary.main'
              },
              backgroundColor: statusFilter === 'all' ? 'primary.50' : 'white',
              minHeight: '64px',
              display: 'flex',
            }}
          >
            <CardContent sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.25,
              pb: '8px !important',
              width: '100%'
            }}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 32, height: 32 }}>
                <PersonIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" color="text.secondary">Total Customers</Typography>
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>{totalCustomers}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            elevation={1}
            sx={{
              borderRadius: borderRadius.md, // 16px - Modern rounded cards
              p: 0.5,
              border: 1,
              borderColor: statusFilter === 'active' ? 'success.main' : 'divider',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: 'success.main'
              },
              backgroundColor: statusFilter === 'active' ? 'success.50' : 'white',
              minHeight: '64px',
              display: 'flex',
            }}
          >
            <CardContent sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.25,
              pb: '8px !important',
              width: '100%'
            }}>
              <Avatar sx={{ bgcolor: 'success.light', color: 'success.contrastText', width: 32, height: 32 }}>
                <ActiveIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" color="text.secondary">Active</Typography>
                  <Typography variant="h6" color="success.main" sx={{ ml: 1, fontWeight: 'bold' }}>{activeCustomers}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
            elevation={1}
            sx={{
              borderRadius: borderRadius.md, // 16px - Modern rounded cards
              p: 0.5,
              border: 1,
              borderColor: statusFilter === 'inactive' ? 'grey.500' : 'divider',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                borderColor: 'grey.500'
              },
              backgroundColor: statusFilter === 'inactive' ? 'grey.100' : 'white',
              minHeight: '64px',
              display: 'flex',
            }}
          >
            <CardContent sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.25,
              pb: '8px !important',
              width: '100%'
            }}>
              <Avatar sx={{ bgcolor: 'grey.400', color: 'white', width: 32, height: 32 }}>
                <InactiveIcon sx={{ fontSize: '1rem' }} />
              </Avatar>
              <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" color="text.secondary">Inactive</Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ ml: 1, fontWeight: 'bold' }}>{inactiveCustomers}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search - Desktop */}
      {!isMobile && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: borderRadius.md }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={10}>
              <TextField
                fullWidth
                placeholder="Search customers by name, email, or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Mobile Search Drawer */}
      {isMobile && (
        <Drawer
          anchor="right"
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        >
          <Box sx={{ width: 280, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Search</Typography>
              <IconButton onClick={() => setFiltersOpen(false)}>
                <SearchIcon />
              </IconButton>
            </Box>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Search customers..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  handleSearch();
                  setFiltersOpen(false);
                }}
                fullWidth
              >
                Apply Search
              </Button>
            </Stack>
          </Box>
        </Drawer>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Paper sx={{ borderRadius: borderRadius.md, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 2, py: 1.5 } }}>
              <TableHead>
                <TableRow>
                  <TableCell width="25%">Customer</TableCell>
                  {!isMobile && <TableCell width="20%">Email</TableCell>}
                  {!isMobile && <TableCell width="15%">Phone</TableCell>}
                  {!isMobile && <TableCell width="20%">Address</TableCell>}
                  <TableCell width="10%" align="center">Status</TableCell>
                  <TableCell width="10%" align="center">Orders</TableCell>
                  <TableCell width="10%" align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer: Customer) => (
                    <TableRow 
                      key={customer.id} 
                      hover
                      onClick={() => handleOpenForm(customer)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar 
                            sx={{ 
                              bgcolor: getAvatarColor(customer.name), 
                              width: 32, 
                              height: 32,
                              fontSize: '0.875rem'
                            }}
                          >
                            {getCustomerInitials(customer.name)}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {customer.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      {!isMobile && <TableCell>{customer.email || '-'}</TableCell>}
                      {!isMobile && <TableCell>{customer.phone || '-'}</TableCell>}
                      {!isMobile && (
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {customer.address || '-'}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Chip
                          label={customer.isActive ? 'Active' : 'Inactive'}
                          color={customer.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 'medium' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<OrderIcon />}
                          label={customer.orderCount || 0}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenForm(customer);
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
                                handleDeleteClick(customer);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredCustomers.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage={isMobile ? "Items:" : "Items per page:"}
            sx={{ px: 2 }}
          />
        </Paper>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {paginatedCustomers.map((customer: Customer) => (
              <Grid item xs={12} sm={6} md={4} key={customer.id}>
                <Card
                  elevation={2}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: borderRadius.md, // 16px - Modern rounded cards
                  }}
                  onClick={() => handleOpenForm(customer)}
                >
                  <CardHeader
                    avatar={
                      <Avatar 
                        sx={{ bgcolor: getAvatarColor(customer.name), width: 40, height: 40 }}
                      >
                        {getCustomerInitials(customer.name)}
                      </Avatar>
                    }
                    title={
                      <Typography variant="subtitle1" fontWeight="medium">
                        {customer.name}
                      </Typography>
                    }
                    subheader={
                      <Chip
                        label={customer.isActive ? 'Active' : 'Inactive'}
                        color={customer.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ mt: 0.5, fontWeight: 'medium' }}
                      />
                    }
                    action={
                      <Chip
                        icon={<OrderIcon />}
                        label={`${customer.orderCount || 0} orders`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    }
                    sx={{ pb: 1 }}
                  />

                  <Divider />

                  <CardContent sx={{ pt: 2, pb: 1, flexGrow: 1 }}>
                    <Stack spacing={1.5}>
                      {customer.email && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {customer.email}
                          </Typography>
                        </Box>
                      )}

                      {customer.phone && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {customer.phone}
                          </Typography>
                        </Box>
                      )}

                      {customer.address && (
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {customer.address}
                          </Typography>
                        </Box>
                      )}

                      {!customer.email && !customer.phone && !customer.address && (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          No contact information
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ px: 2, py: 1, justifyContent: 'flex-end', bgcolor: 'background.default' }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenForm(customer);
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
                          handleDeleteClick(customer);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination for card view */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              component="div"
              count={filteredCustomers.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Items per page:"
            />
          </Box>
        </Box>
      )}

      {/* Add/Edit Customer Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    color="success"
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingCustomer ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete customer "{customerToDelete?.name}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All associated data will be removed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default Customers;
