import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Alert,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  Science as ScienceIcon,
  LocalDining as LocalDiningIcon,
  MenuBook as MenuBookIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface DashboardSummary {
  inventoryCounts: {
    rawMaterials: number;
    finishedProducts: number;
    recipes: number;
    total: number;
  };
  message?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const summaryResponse = await api.get('/dashboard/summary');
      setSummary(summaryResponse.data.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !summary) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
            <DashboardIcon sx={{ fontSize: '1.2em', color: 'primary.main' }} />
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time overview of your bakery operations
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {formatDate(lastRefresh)}
          </Typography>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {summary && (
        <Grid container spacing={3}>
          {/* Inventory Overview */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <InventoryIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Inventory Overview</Typography>
                </Box>
                
                {summary.message && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {summary.message}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {summary.inventoryCounts.rawMaterials}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Raw Materials
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h4" color="secondary" gutterBottom>
                        {summary.inventoryCounts.finishedProducts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Finished Products
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h4" color="success.main" gutterBottom>
                        {summary.inventoryCounts.recipes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Recipes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h4" color="warning.main" gutterBottom>
                        {summary.inventoryCounts.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Items
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ScienceIcon />}
                    onClick={() => navigate('/raw-materials')}
                    fullWidth
                  >
                    Manage Raw Materials
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LocalDiningIcon />}
                    onClick={() => navigate('/finished-products')}
                    fullWidth
                  >
                    Manage Products
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MenuBookIcon />}
                    onClick={() => navigate('/recipes')}
                    fullWidth
                  >
                    View Recipes
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* System Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Status
                </Typography>
                <Alert severity="success">
                  <Typography variant="body2">
                    ✅ Bakery Inventory System is running successfully
                  </Typography>
                  <Typography variant="body2">
                    🔄 Intermediate products have been removed and simplified
                  </Typography>
                  <Typography variant="body2">
                    📊 Dashboard data is loading from simplified backend
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;