import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualityStatusApi } from '../../services/realApi';
import { QualityStatus } from '../../types';

const QualityStatusManagement: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQualityStatus, setEditingQualityStatus] = useState<QualityStatus | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#4caf50',
    isActive: true,
    sortOrder: 0,
  });

  const queryClient = useQueryClient();

  // Component mount logging
  useEffect(() => {
    console.log('QualityStatusManagement component mounted!');
    return () => {
      console.log('QualityStatusManagement component unmounted!');
    };
  }, []);

  // Fetch quality statuses
  const { data: qualityStatusesResponse, isLoading, error: queryError } = useQuery({
    queryKey: ['qualityStatuses'],
    queryFn: qualityStatusApi.getAll,
    retry: 2,
    retryDelay: 1000,
  });

  const qualityStatuses: QualityStatus[] = Array.isArray(qualityStatusesResponse?.data)
    ? qualityStatusesResponse.data
    : [];

  // Debug logging
  console.log('QualityStatus Debug:', {
    isLoading,
    queryError,
    qualityStatusesResponse,
    qualityStatuses: qualityStatuses.length,
  });

  // Create quality status mutation
  const createMutation = useMutation({
    mutationFn: qualityStatusApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityStatuses'] });
      setOpenDialog(false);
      resetForm();
      showSnackbar('Quality status created successfully!', 'success');
    },
    onError: (error: any) => {
      console.error('Create mutation error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create quality status';
      showSnackbar(errorMessage, 'error');
    },
  });

  // Update quality status mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<QualityStatus> }) =>
      qualityStatusApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityStatuses'] });
      setOpenDialog(false);
      resetForm();
      showSnackbar('Quality status updated successfully!', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Failed to update quality status', 'error');
    },
  });

  // Delete quality status mutation
  const deleteMutation = useMutation({
    mutationFn: qualityStatusApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityStatuses'] });
      showSnackbar('Quality status deleted successfully!', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.error || 'Failed to delete quality status', 'error');
    },
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#4caf50',
      isActive: true,
      sortOrder: 0,
    });
    setEditingQualityStatus(null);
  };

  const handleOpenDialog = (qualityStatus?: QualityStatus) => {
    if (qualityStatus) {
      setEditingQualityStatus(qualityStatus);
      setFormData({
        name: qualityStatus.name,
        description: qualityStatus.description || '',
        color: qualityStatus.color || '#4caf50',
        isActive: qualityStatus.isActive,
        sortOrder: qualityStatus.sortOrder,
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }));
  };

  const checkForDuplicates = (name: string, currentId?: string): boolean => {
    return qualityStatuses.some(status => 
      status.name.toLowerCase() === name.toLowerCase() && 
      status.id !== currentId
    );
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      showSnackbar('Quality status name is required', 'error');
      return;
    }

    // Check for duplicates
    if (checkForDuplicates(formData.name.trim(), editingQualityStatus?.id)) {
      showSnackbar('A quality status with this name already exists', 'error');
      return;
    }

    if (editingQualityStatus) {
      updateMutation.mutate({
        id: editingQualityStatus.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this quality status? It will be deactivated if it\'s in use.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Loading quality statuses...</Typography>
      </Paper>
    );
  }

  if (queryError) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading quality statuses: {(queryError as any)?.message || 'Unknown error'}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" component="h2">
            Quality Status Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {qualityStatuses.length} status{qualityStatuses.length !== 1 ? 'es' : ''} configured
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Quality Status
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Sort Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!qualityStatuses || qualityStatuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No quality statuses found. Add one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              qualityStatuses.map((qualityStatus: QualityStatus) => (
                <TableRow key={qualityStatus.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: 1,
                          backgroundColor: qualityStatus.color || '#gray',
                          border: '1px solid #ddd',
                        }}
                      />
                      {qualityStatus.name}
                    </Box>
                  </TableCell>
                  <TableCell>{qualityStatus.description || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={qualityStatus.color || 'None'}
                      sx={{
                        backgroundColor: qualityStatus.color || '#gray',
                        color: 'white',
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>{qualityStatus.sortOrder}</TableCell>
                  <TableCell>
                    <Chip
                      label={qualityStatus.isActive ? 'Active' : 'Inactive'}
                      color={qualityStatus.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(qualityStatus)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(qualityStatus.id)}
                        color="error"
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingQualityStatus ? 'Edit Quality Status' : 'Add Quality Status'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleFormChange('name')}
                required
                placeholder="e.g., Good, Damaged, Defective"
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
                placeholder="Optional description of the quality status"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Color"
                type="color"
                value={formData.color}
                onChange={handleFormChange('color')}
                InputProps={{
                  startAdornment: <PaletteIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Sort Order"
                type="number"
                value={formData.sortOrder}
                onChange={handleFormChange('sortOrder')}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleFormChange('isActive')}
                  />
                }
                label="Active Status"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingQualityStatus ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default QualityStatusManagement;
