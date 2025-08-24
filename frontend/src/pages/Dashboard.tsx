import React from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Box,
  Alert,
  Chip
} from '@mui/material';
import { 
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Welcome to your Bakery Inventory Management System! This is a development version.
      </Alert>

      <Grid container spacing={3}>
        {/* Quick Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <InventoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Raw Materials</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Items in stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Expiring Soon</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Items expire within 7 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Production</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Batches this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AssessmentIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Recipes</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available recipes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No recent activity to display.
              </Typography>
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
                <Chip label="Add Raw Material" clickable />
                <Chip label="Create Recipe" clickable />
                <Chip label="Start Production" clickable />
                <Chip label="View Reports" clickable />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
