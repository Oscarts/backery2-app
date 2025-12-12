import React from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Straighten as UnitsIcon,
  Public as GlobalIcon,
} from '@mui/icons-material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UnitsManagement from '../components/Settings/UnitsManagement';

/**
 * Global Settings Page - Super Admin Only
 * 
 * Manages platform-wide settings that affect all clients:
 * - Units of Measurement (kg, L, g, mL, etc.)
 * 
 * Following CODE_GUIDELINES.md:
 * - Global resources shared across all tenants
 * - Only Super Admin can modify
 * - Other users can view (read-only) in their respective forms
 */
const GlobalSettings: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { hasPermission } = useAuth();

  // Only Super Admin can access this page
  // Super Admin has 'clients:view' permission
  if (!hasPermission('clients', 'view')) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <GlobalIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant={isMobile ? 'h4' : 'h3'} component="h1" fontWeight="bold">
            Global Settings
          </Typography>
          <Chip
            label="Super Admin Only"
            color="error"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage platform-wide settings that are shared across all bakery clients.
          Changes here will affect all organizations using the system.
        </Typography>
      </Box>

      {/* Important Notice */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Platform Administrator Access
        </Typography>
        <Typography variant="body2">
          These settings are global and shared across all bakery clients. Changes made here will
          affect all organizations. Bakery-specific settings (categories, suppliers, etc.) are
          managed in each client's Settings page.
        </Typography>
      </Alert>

      {/* Units of Measurement Section */}
      <Accordion
        defaultExpanded
        sx={{
          mb: 2,
          borderRadius: 2,
          '&:before': { display: 'none' },
          border: `2px solid ${theme.palette.primary.main}`,
        }}
        elevation={3}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: 'primary.50',
            '&:hover': { bgcolor: 'primary.100' },
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <UnitsIcon color="primary" fontSize="large" />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight="medium">
                  Units of Measurement
                </Typography>
                <Chip
                  label="Global Resource"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Standardized measurement units (weight, volume, count) used across all bakeries
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Why global?</strong> Units like "Kilogram", "Liter", "Gram" are universal
              standards. Keeping them global ensures consistency across all clients and simplifies
              platform-wide reporting and analytics.
            </Typography>
          </Alert>

          <UnitsManagement readOnly={false} />
        </AccordionDetails>
      </Accordion>

      {/* Info Box */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight="bold">
          <SettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Understanding Global vs Client Settings
        </Typography>

        <Box component="ul" sx={{ pl: 2, mt: 2 }}>
          <Box component="li" sx={{ mb: 1 }}>
            <Typography variant="body2">
              <strong>Global Settings (this page):</strong> Shared resources like measurement units
              that are standardized across all bakeries
            </Typography>
          </Box>
          <Box component="li" sx={{ mb: 1 }}>
            <Typography variant="body2">
              <strong>Client Settings:</strong> Bakery-specific configurations like categories,
              suppliers, storage locations, and quality statuses
            </Typography>
          </Box>
          <Box component="li">
            <Typography variant="body2">
              <strong>Access Control:</strong> Only Super Admins can modify global settings.
              Organization Admins manage their bakery's client-specific settings.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default GlobalSettings;
