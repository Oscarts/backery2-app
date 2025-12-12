import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  AlertTitle,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '../services/realApi';
import { Role } from '../types';
import { Info as InfoIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const RoleTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<Role | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['role-templates'],
    queryFn: () => rolesApi.getAll(),
  });

  // Filter only System client roles (templates)
  const templates = (rolesData?.data || []).filter(
    (role) => role.client?.slug === 'system' && role.name !== 'Super Admin'
  );

  const handleViewDetails = (template: Role) => {
    setSelectedTemplate(template);
    setDetailsOpen(true);
  };

  const handleEditTemplate = (_template: Role) => {
    // Navigate to the regular roles page which has full edit functionality
    navigate('/settings/roles');
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedTemplate(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading role templates...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Role Templates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage role templates that are automatically copied to new clients
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>How Role Templates Work</AlertTitle>
        <Typography variant="body2">
          • Role templates are stored in the System client
          <br />
          • When a new client is created, all templates are automatically copied
          <br />
          • Changes to templates only affect NEW clients, not existing ones
          <br />• Each client maintains their own independent copy of these roles
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {template.name}
                  </Typography>
                  <Chip
                    label="Template"
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    label={`${template.permissions?.length || 0} permissions`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<InfoIcon />}
                    onClick={() => handleViewDetails(template)}
                    sx={{ flex: 1 }}
                  >
                    View
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditTemplate(template)}
                    sx={{ flex: 1 }}
                  >
                    Edit
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {templates.length === 0 && (
        <Alert severity="warning">
          No role templates found. Please create templates in the System client.
        </Alert>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate?.name} - Permissions
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedTemplate?.description}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Permissions ({selectedTemplate?.permissions?.length || 0})
          </Typography>

          <List dense>
            {selectedTemplate?.permissions?.map((rp) => (
              <ListItem key={rp.id}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip
                        label={rp.permission.resource}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={rp.permission.action}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={rp.permission.description}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleTemplates;
