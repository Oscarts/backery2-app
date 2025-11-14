import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
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
  Tooltip,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Grid,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
  People as PeopleIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, permissionsApi } from '../services/realApi';
import { Role, CreateRoleData, UpdateRoleData, Permission } from '../types';
import { borderRadius } from '../theme/designTokens';

const RoleManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateRoleData>({
    name: '',
    description: '',
    permissionIds: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  });

  // Fetch permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.getAll(),
  });

  const roles = rolesData?.data || [];
  const permissions = permissionsData?.data || [];

  // Sort roles: Templates first, then client roles
  const sortedRoles = [...roles].sort((a, b) => {
    // Templates (system client) come first
    const aIsTemplate = a.client?.slug === 'system' && a.name !== 'Super Admin';
    const bIsTemplate = b.client?.slug === 'system' && b.name !== 'Super Admin';
    
    if (aIsTemplate && !bIsTemplate) return -1;
    if (!aIsTemplate && bIsTemplate) return 1;
    
    // Within same category, sort by name
    return a.name.localeCompare(b.name);
  });

  // Filter roles by search term
  const filteredRoles = sortedRoles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc: Record<string, Permission[]>, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  // Mutations
  const createMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccess('Role created successfully');
      handleCloseDialog();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleData }) =>
      rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccess('Role updated successfully');
      handleCloseDialog();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccess('Role deleted successfully');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Handlers
  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permissionIds: role.permissions.map((rp) => rp.permissionId),
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissionIds: [],
      });
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
    setError('');
  };

  const handleSubmit = () => {
    setError('');
    
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (role: Role) => {
    if (window.confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      deleteMutation.mutate(role.id);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds?.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...(prev.permissionIds || []), permissionId],
    }));
  };

  const handleResourceToggle = (resource: string) => {
    const resourcePermIds = groupedPermissions[resource]?.map((p) => p.id) || [];
    const allSelected = resourcePermIds.every((id) => formData.permissionIds?.includes(id));
    
    setFormData((prev) => ({
      ...prev,
      permissionIds: allSelected
        ? prev.permissionIds?.filter((id) => !resourcePermIds.includes(id)) || []
        : [...new Set([...(prev.permissionIds || []), ...resourcePermIds])],
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E4687', mb: 1 }}>
          Role Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Define roles and assign permissions to control access
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Info Alert for Template Roles */}
      {roles.some((r) => r.client?.slug === 'system' && r.name !== 'Super Admin') && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            🎨 Template Roles
          </Typography>
          <Typography variant="body2">
            Roles marked as "TEMPLATE" are automatically copied to new clients. 
            Changes to templates affect only NEW clients. To update existing clients, use the sync script.
          </Typography>
        </Alert>
      )}

      {/* Toolbar */}
      <Card sx={{ mb: 3, borderRadius: borderRadius.lg }}>
        <Box sx={{ p: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search roles..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 250 }}
          />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredRoles.length} {filteredRoles.length === 1 ? 'role' : 'roles'}
              {searchTerm && ` (filtered from ${sortedRoles.length})`}
            </Typography>
            {/* View Toggle */}
            <Box sx={{ display: 'flex', gap: 0.5, bgcolor: 'grey.100', borderRadius: borderRadius.md, p: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setViewMode('card')}
                sx={{
                  bgcolor: viewMode === 'card' ? 'white' : 'transparent',
                  boxShadow: viewMode === 'card' ? 1 : 0,
                  '&:hover': { bgcolor: viewMode === 'card' ? 'white' : 'grey.200' },
                }}
              >
                <ViewModuleIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('table')}
                sx={{
                  bgcolor: viewMode === 'table' ? 'white' : 'transparent',
                  boxShadow: viewMode === 'table' ? 1 : 0,
                  '&:hover': { bgcolor: viewMode === 'table' ? 'white' : 'grey.200' },
                }}
              >
                <ViewListIcon fontSize="small" />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: borderRadius.md,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
              }}
            >
              Create Role
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Roles Display - Card or Table View */}
      {viewMode === 'card' ? (
        /* Card View */
        <Grid container spacing={3}>
          {rolesLoading ? (
            <Grid item xs={12}>
              <Card sx={{ p: 8, textAlign: 'center', borderRadius: borderRadius.lg }}>
                <Typography>Loading...</Typography>
              </Card>
            </Grid>
          ) : roles.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ p: 8, textAlign: 'center', borderRadius: borderRadius.lg }}>
                <ShieldIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No roles configured
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first role to start managing permissions
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Create Role
                </Button>
              </Card>
            </Grid>
          ) : (
            filteredRoles.map((role) => (
              <Grid item xs={12} md={6} lg={4} key={role.id}>
                <Card sx={{ borderRadius: borderRadius.lg, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ p: 2.5, flexGrow: 1 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShieldIcon color="primary" />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {role.name}
                          </Typography>
                          {role.client && (
                            <Typography 
                              variant="caption" 
                              color={role.client.slug === 'system' ? 'primary' : 'text.secondary'}
                              sx={{ 
                                fontWeight: role.client.slug === 'system' ? 600 : 400,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              {role.client.slug === 'system' ? '🎨 Template' : role.client.name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {role.isSystem && role.client?.slug === 'system' && role.name !== 'Super Admin' && (
                        <Chip label="TEMPLATE" size="small" color="warning" variant="outlined" />
                      )}
                      {role.name === 'Super Admin' && (
                        <Chip label="SUPER ADMIN" size="small" color="error" />
                      )}
                    </Box>

                    {/* Description */}
                    {role.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {role.description}
                      </Typography>
                    )}

                    {/* Stats */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Tooltip title="Users with this role">
                        <Chip
                          icon={<PeopleIcon />}
                          label={role._count.users}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                      <Tooltip title="Permissions granted">
                        <Chip
                          icon={<ShieldIcon />}
                          label={role.permissions.length}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Tooltip>
                    </Box>

                    {/* Permissions Preview */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Permissions:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {role.permissions.slice(0, 4).map((rp) => (
                          <Chip
                            key={rp.id}
                            label={`${rp.permission.resource}:${rp.permission.action}`}
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                        {role.permissions.length > 4 && (
                          <Chip
                            label={`+${role.permissions.length - 4} more`}
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Actions */}
                  <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(role)}
                      sx={{ textTransform: 'none' }}
                    >
                      Edit
                    </Button>
                    {!role.isSystem && (
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(role)}
                        color="error"
                        sx={{ textTransform: 'none' }}
                        disabled={role._count.users > 0}
                      >
                        Delete
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      ) : (
        /* Table View */
        <TableContainer component={Paper} sx={{ borderRadius: borderRadius.lg, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Role Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Users</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Permissions</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rolesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <ShieldIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No roles configured
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Create your first role to start managing permissions
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Create Role
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow 
                    key={role.id} 
                    hover 
                    onClick={() => handleOpenDialog(role)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShieldIcon color="primary" fontSize="small" />
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {role.name}
                            </Typography>
                            {role.isSystem && role.client?.slug === 'system' && role.name !== 'Super Admin' && (
                              <Chip label="TEMPLATE" size="small" color="warning" variant="outlined" />
                            )}
                            {role.name === 'Super Admin' && (
                              <Chip label="SUPER ADMIN" size="small" color="error" />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={role.client?.slug === 'system' ? 'primary' : 'text.secondary'}
                        sx={{ 
                          fontWeight: role.client?.slug === 'system' ? 600 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {role.client?.slug === 'system' ? '🎨 System' : role.client?.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                        {role.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={<PeopleIcon />}
                        label={role._count.users}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={<ShieldIcon />}
                        label={role.permissions.length}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(role)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {!role.isSystem && (
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(role)}
                            color="error"
                            disabled={role._count.users > 0}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Role Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: borderRadius.lg },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            {editingRole?.isSystem && (
              <Alert severity="info">
                This is a system role. Some properties may be restricted.
              </Alert>
            )}
            
            <TextField
              label="Role Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              disabled={editingRole?.isSystem}
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Permissions
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                <Stack spacing={2}>
                  {Object.entries(groupedPermissions).map(([resource, perms]) => {
                    const allSelected = perms.every((p) => formData.permissionIds?.includes(p.id));
                    const someSelected = perms.some((p) => formData.permissionIds?.includes(p.id));
                    
                    return (
                      <Box key={resource}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={allSelected}
                              indeterminate={someSelected && !allSelected}
                              onChange={() => handleResourceToggle(resource)}
                            />
                          }
                          label={
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                              {resource.replace(/-/g, ' ')}
                            </Typography>
                          }
                        />
                        <FormGroup sx={{ ml: 4 }}>
                          <Grid container spacing={1}>
                            {perms.map((perm) => (
                              <Grid item xs={6} sm={4} md={3} key={perm.id}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={formData.permissionIds?.includes(perm.id)}
                                      onChange={() => handlePermissionToggle(perm.id)}
                                      size="small"
                                    />
                                  }
                                  label={<Typography variant="body2">{perm.action}</Typography>}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </FormGroup>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            {editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;
