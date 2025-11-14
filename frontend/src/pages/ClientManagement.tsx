import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  MenuItem,
  Tooltip,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import { borderRadius } from '../theme/designTokens';

interface Client {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  subscriptionPlan: string;
  maxUsers: number;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  createdAt: string;
  _count?: {
    users: number;
    roles: number;
  };
}

interface CreateClientData {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  subscriptionPlan: string;
  maxUsers: number;
  subscriptionStatus?: string;
  isActive?: boolean;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

interface UpdateClientData {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionPlan?: string;
  maxUsers?: number;
  subscriptionStatus?: string;
  isActive?: boolean;
}

const SUBSCRIPTION_PLANS = [
  { value: 'TRIAL', label: 'Trial (5 users, 30 days)', maxUsers: 5 },
  { value: 'FREE', label: 'Free (5 users)', maxUsers: 5 },
  { value: 'STARTER', label: 'Starter (€50/mo, 5 users)', maxUsers: 5 },
  { value: 'PROFESSIONAL', label: 'Professional (€150/mo, 20 users)', maxUsers: 20 },
  { value: 'ENTERPRISE', label: 'Enterprise (€10/user/mo)', maxUsers: 999 },
];

const SUBSCRIPTION_STATUSES = [
  { value: 'TRIAL', label: 'Trial', color: 'info' },
  { value: 'ACTIVE', label: 'Active', color: 'success' },
  { value: 'PAST_DUE', label: 'Past Due', color: 'warning' },
  { value: 'CANCELED', label: 'Canceled', color: 'error' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'default' },
];

const ClientManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    subscriptionPlan: 'PROFESSIONAL',
    maxUsers: 20,
    adminEmail: '',
    adminPassword: 'password123',
    adminFirstName: '',
    adminLastName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch clients
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: () => apiGet('/admin/clients'),
  });

  const clients = (clientsData as any)?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateClientData) => apiPost('/admin/clients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setSuccess('Client created successfully');
      handleCloseDialog();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientData }) =>
      apiPut(`/admin/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setSuccess('Client updated successfully');
      handleCloseDialog();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      setSuccess('Client deleted successfully');
      setOpenDeleteDialog(false);
      setDeletingClient(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || err.message);
    },
  });

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        slug: client.slug,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        subscriptionPlan: client.subscriptionPlan,
        maxUsers: client.maxUsers,
        subscriptionStatus: client.subscriptionStatus,
        isActive: client.isActive,
        adminEmail: '',
        adminPassword: '',
        adminFirstName: '',
        adminLastName: '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        slug: '',
        email: '',
        phone: '',
        address: '',
        subscriptionPlan: 'PROFESSIONAL',
        maxUsers: 20,
        subscriptionStatus: 'TRIAL',
        isActive: true,
        adminEmail: '',
        adminPassword: 'password123',
        adminFirstName: '',
        adminLastName: '',
      });
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClient(null);
    setError('');
  };

  const handleOpenDeleteDialog = (client: Client) => {
    setDeletingClient(client);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingClient(null);
  };

  const handleSubmit = () => {
    setError('');
    setSuccess('');

    if (editingClient) {
      // Update existing client
      const updateData: UpdateClientData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        subscriptionPlan: formData.subscriptionPlan,
        maxUsers: formData.maxUsers,
      };
      updateMutation.mutate({ id: editingClient.id, data: updateData });
    } else {
      // Create new client
      if (!formData.name || !formData.slug || !formData.adminEmail || !formData.adminFirstName || !formData.adminLastName) {
        setError('Please fill in all required fields');
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingClient) {
      deleteMutation.mutate(deletingClient.id);
    }
  };

  const handlePlanChange = (plan: string) => {
    const planConfig = SUBSCRIPTION_PLANS.find(p => p.value === plan);
    setFormData({
      ...formData,
      subscriptionPlan: plan,
      maxUsers: planConfig?.maxUsers || 20,
    });
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, name, slug: formData.slug || slug });
  };

  // Filter clients
  const filteredClients = clients.filter((client: Client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    const statusConfig = SUBSCRIPTION_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'default';
  };

  const getPlanLabel = (plan: string) => {
    const planConfig = SUBSCRIPTION_PLANS.find(p => p.value === plan);
    return planConfig?.label.split('(')[0].trim() || plan;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Client Management
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage bakery clients and their subscriptions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius }}
        >
          New Client
        </Button>
      </Stack>

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search clients..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3, borderRadius }}
      />

      {/* Clients Table */}
      <TableContainer component={Paper} sx={{ borderRadius }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell><strong>Client</strong></TableCell>
              <TableCell><strong>Contact</strong></TableCell>
              <TableCell><strong>Plan</strong></TableCell>
              <TableCell><strong>Users</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientsLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">No clients found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client: Client) => (
                <TableRow 
                  key={client.id} 
                  hover
                  onClick={() => handleOpenDialog(client)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BusinessIcon color="primary" />
                      <Box>
                        <Typography fontWeight="medium">{client.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {client.slug}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {client.email && (
                        <Typography variant="body2">{client.email}</Typography>
                      )}
                      {client.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {client.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`Max ${client.maxUsers} users`}>
                      <Chip
                        label={getPlanLabel(client.subscriptionPlan)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PeopleIcon fontSize="small" color="action" />
                      <Typography>
                        {client._count?.users || 0} / {client.maxUsers}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.subscriptionStatus}
                      size="small"
                      color={getStatusColor(client.subscriptionStatus) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Edit Client">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(client)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Client">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(client)}
                        color="error"
                        disabled={client.slug === 'system'}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" />
            <Box flex={1}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {editingClient ? `Edit ${editingClient.name}` : 'Create New Client'}
              </Typography>
              {editingClient && (
                <Typography variant="caption" color="text.secondary">
                  {editingClient._count?.users || 0} users • {editingClient._count?.roles || 0} roles • Created {new Date(editingClient.createdAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Client Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Client Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Client Name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                disabled={!!editingClient}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                disabled={!!editingClient}
                helperText="Unique identifier (lowercase, dashes only)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>

            {/* Subscription */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Subscription Plan
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Plan"
                value={formData.subscriptionPlan}
                onChange={(e) => handlePlanChange(e.target.value)}
                required
              >
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <MenuItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Users"
                type="number"
                value={formData.maxUsers}
                onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                required
                inputProps={{ min: 1, max: 999 }}
              />
            </Grid>

            {/* Subscription Status (only for editing) */}
            {editingClient && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Subscription Status"
                    value={formData.subscriptionStatus || 'TRIAL'}
                    onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                  >
                    {SUBSCRIPTION_STATUSES.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                </Grid>
              </>
            )}

            {/* Admin User (only for new clients) */}
            {!editingClient && (
              <>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Admin User
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Admin First Name"
                    value={formData.adminFirstName}
                    onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Admin Last Name"
                    value={formData.adminLastName}
                    onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Admin Email"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Admin Password"
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    required
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
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingClient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deletingClient?.name}</strong>?
          </Typography>
          <Typography color="error" sx={{ mt: 2 }}>
            This will permanently delete all users, roles, and data for this client.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientManagement;
