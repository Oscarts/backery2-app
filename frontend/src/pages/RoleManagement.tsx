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
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, permissionsApi } from '../services/realApi';
import { Role, CreateRoleData, UpdateRoleData, Permission } from '../types';
import { borderRadius } from '../theme/designTokens';

const RoleManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
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

      {/* Toolbar */}
      <Card sx={{ mb: 3, borderRadius: borderRadius.lg }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {roles.length} {roles.length === 1 ? 'role' : 'roles'} configured
          </Typography>
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
      </Card>

      {/* Roles Grid */}
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
          roles.map((role) => (
            <Grid item xs={12} md={6} lg={4} key={role.id}>
              <Card sx={{ borderRadius: borderRadius.lg, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2.5, flexGrow: 1 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShieldIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {role.name}
                      </Typography>
                    </Box>
                    {role.isSystem && (
                      <Chip label="System" size="small" color="primary" />
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
