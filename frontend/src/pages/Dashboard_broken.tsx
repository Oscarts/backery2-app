import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  AttachMoney as MoneyIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Science as ScienceIcon,
  LocalDining as LocalDiningIcon,
  MenuBook as MenuBookIcon,
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
  stockStatus: {
    expiring: number;
    lowStock: number;
    reserved: number;
    contaminated: number;
  };
  alertBreakdown: {
    rawMaterials: {
      expiring: number;
      lowStock: number;
      contaminated: number;
      total: number;
    };
    intermediateProducts: {
      expiring: number;
      contaminated: number;
      total: number;
    };
    finishedProducts: {
      expiring: number;
      lowStock: number;
      reserved: number;
      total: number;
    };
    totalAlerts: number;
  };
  recentActivity: {
    itemsCreatedToday: number;
    itemsUpdatedToday: number;
    lastUpdateTime: string;
  };
}

interface AlertItem {
  id: string;
  name: string;
  type: 'raw_material' | 'intermediate_product' | 'finished_product';
  alertType: 'expired' | 'expiring_soon' | 'low_stock' | 'out_of_stock' | 'contaminated';
  severity: 'critical' | 'warning' | 'info';
  quantity?: number;
  unit?: string;
  expirationDate?: string;
  daysUntilExpiration?: number;
  category?: string;
  location?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryResponse, alertsResponse] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/alerts'),
      ]);

      setSummary(summaryResponse.data.data);
      setAlerts(alertsResponse.data.data || []); // Default to empty array
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'expired':
      case 'expiring_soon':
        return <ScheduleIcon />;
      case 'low_stock':
      case 'out_of_stock':
        return <WarningIcon />;
      case 'contaminated':
        return <ErrorIcon />;
      default:
        return <WarningIcon />;
    }
  };

  const formatAlertType = (alertType: string) => {
    switch (alertType) {
      case 'expired': return 'Expired';
      case 'expiring_soon': return 'Expiring Soon';
      case 'low_stock': return 'Low Inventory';
      case 'out_of_stock': return 'Out of Stock';
      case 'contaminated': return 'Contaminated';
      default: return alertType.replace('_', ' ');
    }
  };

  const formatProductType = (type: string) => {
    switch (type) {
      case 'raw_material': return 'Raw Material';
      case 'intermediate_product': return 'Intermediate Product';
      case 'finished_product': return 'Finished Product';
      default: return type.replace('_', ' ');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3" component="h1">
          Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {formatDate(lastRefresh.toISOString())}
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
        <>
          {/* Simplified Dashboard */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Inventory Counts */}
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
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {summary.inventoryCounts.rawMaterials}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Raw Materials
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="secondary">
                          {summary.inventoryCounts.finishedProducts}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Finished Products
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {summary.inventoryCounts.recipes}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Recipes
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
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
                  <Box display="flex" flexDirection="column" gap={1}>
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
          </Grid>

                  {/* Value Breakdown by Product Type */}
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Cost Breakdown:
                    </Typography>

                    {/* Raw Materials */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Raw Materials
                      </Typography>
                      <Typography variant="caption" color="text.primary">
                        {formatCurrency(summary.totalInventoryValue.costBreakdown.rawMaterials)}
                      </Typography>
                    </Box>

                    {/* Intermediate Products */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Intermediate
                      </Typography>
                      <Typography variant="caption" color="text.primary">
                        {formatCurrency(summary.totalInventoryValue.costBreakdown.intermediateProducts)}
                      </Typography>
                    </Box>

                    {/* Finished Products */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Finished (cost)
                      </Typography>
                      <Typography variant="caption" color="text.primary">
                        {formatCurrency(summary.totalInventoryValue.costBreakdown.finishedProducts)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center">
                    {summary.totalInventoryValue.profitMargin >= 0 ? (
                      <ArrowUpIcon color="success" fontSize="small" />
                    ) : (
                      <ArrowDownIcon color="error" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      color={summary.totalInventoryValue.profitMargin >= 0 ? 'success.main' : 'error.main'}
                    >
                      {summary.totalInventoryValue.profitMargin.toFixed(1)}% margin
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Inventory Items */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <InventoryIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Inventory Items</Typography>
                  </Box>
                  <Typography variant="h4" color="secondary" gutterBottom>
                    {summary.inventoryCounts.total}
                  </Typography>
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Breakdown:
                    </Typography>

                    {/* Raw Materials */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Raw Materials
                      </Typography>
                      <Typography variant="caption" color="text.primary">
                        {summary.inventoryCounts.rawMaterials}
                      </Typography>
                    </Box>

                    {/* Intermediate Products */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Intermediate
                      </Typography>
                      <Typography variant="caption" color="text.primary">
                        {summary.inventoryCounts.intermediateProducts}
                      </Typography>
                    </Box>

                    {/* Finished Products */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Finished Products
                      </Typography>
                      <Typography variant="caption" color="text.primary">
                        {summary.inventoryCounts.finishedProducts}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recipes */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <MenuBookIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">Active Recipes</Typography>
                  </Box>
                  <Typography variant="h4" color="info.main" gutterBottom>
                    {summary.inventoryCounts.recipes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Production-ready recipes for creating intermediate and finished products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Alerts Breakdown */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Active Alerts</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main" gutterBottom>
                    {summary.alertBreakdown.totalAlerts}
                  </Typography>

                  {/* Alert Breakdown by Type */}
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Alert Breakdown:
                    </Typography>

                    {/* Raw Materials */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Raw Materials
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {summary.alertBreakdown.rawMaterials.expiring > 0 && (
                          <Chip
                            label={`${summary.alertBreakdown.rawMaterials.expiring} Expired`}
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                        {summary.alertBreakdown.rawMaterials.lowStock > 0 && (
                          <Chip
                            label={`${summary.alertBreakdown.rawMaterials.lowStock} Low Stock`}
                            size="small"
                            color="warning"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                        {summary.alertBreakdown.rawMaterials.contaminated > 0 && (
                          <Chip
                            label={`${summary.alertBreakdown.rawMaterials.contaminated} Contaminated`}
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                        {summary.alertBreakdown.rawMaterials.total === 0 && (
                          <Chip
                            label="All Good"
                            size="small"
                            color="success"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Intermediate Products */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Intermediate
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {summary.alertBreakdown.intermediateProducts.expiring > 0 && (
                          <Chip
                            label={`${summary.alertBreakdown.intermediateProducts.expiring} Expired`}
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                        {summary.alertBreakdown.intermediateProducts.contaminated > 0 && (
                          <Chip
                            label={`${summary.alertBreakdown.intermediateProducts.contaminated} Contaminated`}
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                        {summary.alertBreakdown.intermediateProducts.total === 0 && (
                          <Chip
                            label="All Good"
                            size="small"
                            color="success"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Finished Products */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Finished Products
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {summary.alertBreakdown.finishedProducts.expiring > 0 && (
                          <Chip
                            label={`${summary.alertBreakdown.finishedProducts.expiring} Expired`}
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                        {summary.alertBreakdown.finishedProducts.lowStock > 0 && (
                          <Chip
                            label={`${summary.alertBreakdown.finishedProducts.lowStock} Low Stock`}
                            size="small"
                            color="warning"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                        {summary.alertBreakdown.finishedProducts.reserved > 0 && (
                          <Chip
                            label={`${summary.alertBreakdown.finishedProducts.reserved} Reserved`}
                            size="small"
                            color="info"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                        {summary.alertBreakdown.finishedProducts.total === 0 && (
                          <Chip
                            label="All Good"
                            size="small"
                            color="success"
                            sx={{ fontSize: '0.65rem', height: '18px' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Actions & Alerts Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Quick Actions */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<InventoryIcon />}
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
                      Manage Recipes
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<AssessmentIcon />}
                      onClick={() => navigate('/reports')}
                      fullWidth
                    >
                      View Reports
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ScienceIcon />}
                      onClick={() => navigate('/api-test')}
                      fullWidth
                    >
                      API Testing
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Alerts */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Alerts
                  </Typography>
                  {alerts.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No active alerts
                    </Typography>
                  ) : (
                    <List dense>
                      {alerts.map((alert, index) => (
                        <React.Fragment key={alert.id}>
                          <ListItem>
                            <ListItemIcon>
                              {getAlertIcon(alert.alertType)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                  <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                                    {alert.name}
                                  </Typography>
                                  <Chip
                                    label={formatProductType(alert.type)}
                                    size="small"
                                    color="default"
                                    sx={{ fontSize: '0.65rem', height: '20px' }}
                                  />
                                  <Chip
                                    label={formatAlertType(alert.alertType)}
                                    size="small"
                                    color={getAlertColor(alert.severity) as any}
                                    sx={{ fontSize: '0.65rem', height: '20px' }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  {alert.category}
                                  {alert.location && <> • {alert.location}</>}
                                  {alert.daysUntilExpiration !== undefined && (
                                    <> • {alert.daysUntilExpiration > 0
                                      ? `${alert.daysUntilExpiration} days remaining`
                                      : `${Math.abs(alert.daysUntilExpiration)} days overdue`
                                    }</>
                                  )}
                                  {alert.quantity && <> • {alert.quantity} {alert.unit}</>}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < alerts.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Activity Summary */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ArrowUpIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Created Today</Typography>
                  </Box>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {summary.recentActivity.itemsCreatedToday}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New items added to inventory
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <EditIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Updated Today</Typography>
                  </Box>
                  <Typography variant="h4" color="secondary" gutterBottom>
                    {summary.recentActivity.itemsUpdatedToday}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items modified or adjusted
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ScheduleIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">Reserved Items</Typography>
                  </Box>
                  <Typography variant="h4" color="info.main" gutterBottom>
                    {summary.stockStatus.reserved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items held for orders
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Available Items</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main" gutterBottom>
                    {summary.inventoryCounts.total - summary.stockStatus.expiring - summary.stockStatus.contaminated}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready for use or sale
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
