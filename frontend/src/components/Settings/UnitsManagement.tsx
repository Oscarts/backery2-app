import React, { useState } from 'react';
import {
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
  Chip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitsApi } from '../../services/realApi';
import { Unit } from '../../types';

const UnitsManagement: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const queryClient = useQueryClient();

  // Fetch units
  const { data: unitsResponse, isLoading } = useQuery(['units'], unitsApi.getAll);
  const units = unitsResponse?.data || [];

  // Mutations
  const createMutation = useMutation(unitsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['units']);
      handleCloseForm();
      showSnackbar('Unit created successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error creating unit', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Unit> }) =>
      unitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['units']);
      handleCloseForm();
      showSnackbar('Unit updated successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error updating unit', 'error');
    },
  });

  const deleteMutation = useMutation(unitsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries(['units']);
      showSnackbar('Unit deleted successfully', 'success');
    },
    onError: () => {
      showSnackbar('Error deleting unit', 'error');
    },
  });

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingUnit(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const checkForDuplicates = (name: string, symbol: string, currentId?: string): string | null => {
    const duplicateName = units.find(unit => 
      unit.name.toLowerCase() === name.toLowerCase() && 
      unit.id !== currentId
    );
    
    const duplicateSymbol = units.find(unit => 
      unit.symbol.toLowerCase() === symbol.toLowerCase() && 
      unit.id !== currentId
    );

    if (duplicateName) {
      return `A unit with the name "${name}" already exists`;
    }
    
    if (duplicateSymbol) {
      return `A unit with the symbol "${symbol}" already exists`;
    }

    return null;
  };

  const handleSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formValues: Record<string, any> = {};
    formData.forEach((value, key) => {
      formValues[key] = value;
    });

    // Check for duplicates
    const duplicateError = checkForDuplicates(
      formValues.name as string,
      formValues.symbol as string,
      editingUnit?.id
    );

    if (duplicateError) {
      showSnackbar(duplicateError, 'error');
      return;
    }

    if (editingUnit) {
      // Update existing unit
      const updatedData: Partial<Unit> = {};

      if (formValues.name !== editingUnit.name) updatedData.name = formValues.name as string;
      if (formValues.symbol !== editingUnit.symbol) updatedData.symbol = formValues.symbol as string;
      if (formValues.category !== editingUnit.category) updatedData.category = formValues.category as string;
      if (formValues.description !== editingUnit.description) updatedData.description = formValues.description as string;

      updateMutation.mutate({ id: editingUnit.id, data: updatedData });
    } else {
      // Create new unit
      const newUnitData = {
        name: formValues.name as string,
        symbol: formValues.symbol as string,
        category: formValues.category as string,
        description: formValues.description as string,
        isActive: true,
      };

      createMutation.mutate(newUnitData);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toUpperCase()) {
      case 'WEIGHT': return 'primary';
      case 'VOLUME': return 'secondary';
      case 'COUNT': return 'success';
      default: return 'default';
    }
  };

  if (isLoading) {
    return <Box sx={{ p: 2 }}>Loading units...</Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Units Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Add Unit
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>{unit.name}</TableCell>
                <TableCell>
                  <Chip label={unit.symbol} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={unit.category}
                    color={getCategoryColor(unit.category) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{unit.description || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={unit.isActive ? 'Active' : 'Inactive'}
                    color={unit.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingUnit(unit);
                      setOpenForm(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this unit?')) {
                        deleteMutation.mutate(unit.id);
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Dialog */}
      <Dialog
        open={openForm}
        onClose={handleCloseForm}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmitForm}>
          <DialogTitle>
            {editingUnit ? 'Edit' : 'Add'} Unit
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Unit Name"
                    name="name"
                    defaultValue={editingUnit?.name || ''}
                    placeholder="e.g., Kilogram, Liter, Piece"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Symbol"
                    name="symbol"
                    defaultValue={editingUnit?.symbol || ''}
                    placeholder="e.g., kg, L, pcs"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      defaultValue={editingUnit?.category || ''}
                      label="Category"
                    >
                      <MenuItem value="WEIGHT">Weight</MenuItem>
                      <MenuItem value="VOLUME">Volume</MenuItem>
                      <MenuItem value="COUNT">Count</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    name="description"
                    defaultValue={editingUnit?.description || ''}
                    placeholder="Optional description of the unit"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button
              variant="contained"
              type="submit"
            >
              {editingUnit ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UnitsManagement;
