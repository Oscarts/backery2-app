import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../utils/api';
import { borderRadius } from '../theme/designTokens';

interface ClientUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

interface ClientDetails {
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
  createdAt: string;
  users: ClientUser[];
  _count: {
    users: number;
    roles: number;
  };
}

const SUBSCRIPTION_PLANS: Record<string, string> = {
  TRIAL: 'Trial',
  FREE: 'Free',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Fetch client details
  const { data: clientData, isLoading } = useQuery({
    queryKey: ['admin-client', id],
    queryFn: () => apiGet(`/admin/clients/${id}`),
    enabled: !!id,
  });

  const client: ClientDetails | undefined = (clientData as any)?.data;

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Client not found</Alert>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      TRIAL: 'info',
      ACTIVE: 'success',
      PAST_DUE: 'warning',
      CANCELED: 'error',
      SUSPENDED: 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate('/settings/clients')}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4" fontWeight="bold">
            {client.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {client.slug}
          </Typography>
        </Box>
        <Chip
          label={client.subscriptionStatus}
          color={getStatusColor(client.subscriptionStatus) as any}
        />
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Client Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Client Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography>{client.email || 'N/A'}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography>{client.phone || 'N/A'}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Address
                  </Typography>
                  <Typography>{client.address || 'N/A'}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography>
                    {new Date(client.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Subscription Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subscription Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Plan
                  </Typography>
                  <Typography>
                    {SUBSCRIPTION_PLANS[client.subscriptionPlan] || client.subscriptionPlan}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    User Limit
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h4" color="primary">
                      {client._count.users}
                    </Typography>
                    <Typography color="text.secondary">/ {client.maxUsers}</Typography>
                  </Stack>
                  <Typography variant="caption" color={client._count.users >= client.maxUsers ? 'error' : 'success.main'}>
                    {client._count.users >= client.maxUsers 
                      ? 'Limit reached' 
                      : `${client.maxUsers - client._count.users} available`}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Roles
                  </Typography>
                  <Typography>{client._count.roles}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box>
                    {client.isActive ? (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label="Active" 
                        color="success" 
                        size="small" 
                      />
                    ) : (
                      <Chip 
                        icon={<CancelIcon />} 
                        label="Inactive" 
                        color="error" 
                        size="small" 
                      />
                    )}
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Users Table */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Users ({client.users.length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  size="small"
                  disabled
                  sx={{ borderRadius }}
                >
                  Add User (Coming Soon)
                </Button>
              </Stack>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Last Login</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {client.users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No users found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      client.users.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Typography fontWeight="medium">
                              {user.firstName} {user.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Chip label="Active" color="success" size="small" />
                            ) : (
                              <Chip label="Inactive" color="default" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            {user.lastLoginAt 
                              ? new Date(user.lastLoginAt).toLocaleDateString()
                              : 'Never'}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit User (Coming Soon)">
                              <IconButton size="small" disabled>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User (Coming Soon)">
                              <IconButton size="small" disabled>
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClientDetails;
