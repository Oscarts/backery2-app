import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  LocalDining as LocalDiningIcon,
  MenuBook as MenuBookIcon,
  Factory as FactoryIcon,
  People as PeopleIcon,
  ShoppingCart as OrderIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardSummary {
  inventoryCounts: {
    rawMaterials: number;
    finishedProducts: number;
    recipes: number;
    total: number;
  };
  message?: string;
}

// Stat card component for reusability
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, bgColor, onClick }) => {

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: '1px solid',
        borderColor: alpha(color, 0.1),
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
          borderColor: alpha(color, 0.3),
        } : {},
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: color,
                lineHeight: 1,
                mb: 0.5,
              }}
            >
              {value}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: bgColor,
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Quick action card component
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ title, description, icon, color, onClick }) => {

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateX(4px)',
          bgcolor: alpha(color, 0.04),
          '& .arrow-icon': {
            transform: 'translateX(4px)',
            opacity: 1,
          },
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(color, 0.1),
              color: color,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {description}
            </Typography>
          </Box>
          <ArrowForwardIcon
            className="arrow-icon"
            sx={{
              color: 'text.disabled',
              fontSize: 18,
              transition: 'all 0.2s ease',
              opacity: 0.5,
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading && !summary) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}
            >
              {getGreeting()}, {user?.firstName} 👋
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Here's what's happening with your bakery today
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Updated {formatTime(lastRefresh)}
            </Typography>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                disabled={loading}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {summary && (
        <Grid container spacing={3}>
          {/* Stats Row */}
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Raw Materials"
              value={summary.inventoryCounts.rawMaterials}
              icon={<InventoryIcon />}
              color={theme.palette.primary.main}
              bgColor={alpha(theme.palette.primary.main, 0.1)}
              onClick={() => navigate('/raw-materials')}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Finished Products"
              value={summary.inventoryCounts.finishedProducts}
              icon={<LocalDiningIcon />}
              color="#10B981"
              bgColor={alpha('#10B981', 0.1)}
              onClick={() => navigate('/finished-products')}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Active Recipes"
              value={summary.inventoryCounts.recipes}
              icon={<MenuBookIcon />}
              color="#F59E0B"
              bgColor={alpha('#F59E0B', 0.1)}
              onClick={() => navigate('/recipes')}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Total Items"
              value={summary.inventoryCounts.total}
              icon={<TrendingUpIcon />}
              color="#8B5CF6"
              bgColor={alpha('#8B5CF6', 0.1)}
            />
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <QuickActionCard
                    title="Start Production"
                    description="Create a new production batch"
                    icon={<FactoryIcon />}
                    color={theme.palette.primary.main}
                    onClick={() => navigate('/production')}
                  />
                  <QuickActionCard
                    title="New Order"
                    description="Create a customer order"
                    icon={<OrderIcon />}
                    color="#10B981"
                    onClick={() => navigate('/customer-orders')}
                  />
                  <QuickActionCard
                    title="Manage Customers"
                    description="View and edit customers"
                    icon={<PeopleIcon />}
                    color="#F59E0B"
                    onClick={() => navigate('/customers')}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Welcome Card */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #1E4687 0%, #2962B3 100%)',
                color: 'white',
              }}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Welcome to RapidPro
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mb: 2, flex: 1 }}>
                  Your smart production hub for managing bakery operations efficiently.
                  Track inventory, manage recipes, and streamline your production workflow.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    borderRadius: 1.5,
                    px: 2,
                    py: 1,
                    backdropFilter: 'blur(10px)',
                  }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Organization
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {user?.client?.name}
                    </Typography>
                  </Box>
                  <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    borderRadius: 1.5,
                    px: 2,
                    py: 1,
                    backdropFilter: 'blur(10px)',
                  }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Role
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {user?.customRole?.name || 'User'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;