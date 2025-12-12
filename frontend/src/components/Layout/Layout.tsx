import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  useTheme,
  useMediaQuery,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Chip,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  LocalDining as LocalDiningIcon,
  MenuBook as MenuBookIcon,
  Factory as FactoryIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  People as PeopleIcon,
  ShoppingCart as OrderIcon,
  Label as LabelIcon,
  Logout as LogoutIcon,
  Shield as ShieldIcon,
  Business as BusinessIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import RapidProLogo from '../Brand/RapidProLogo';
import { useAuth } from '../../contexts/AuthContext';

// Define drawer widths for open and closed states
const drawerWidth = 240; // Reduced from 280
const drawerCollapsedWidth = 65; // Reduced from 73, enough width to show just icons

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  resource?: string; // Permission resource (optional - no permission check if undefined)
  action?: string;   // Permission action (defaults to 'view')
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', resource: 'dashboard' },
  { text: 'Raw Materials', icon: <InventoryIcon />, path: '/raw-materials', resource: 'raw-materials' },
  { text: 'SKU Reference', icon: <LabelIcon />, path: '/sku-reference', resource: 'raw-materials' },
  { text: 'Finished Products', icon: <LocalDiningIcon />, path: '/finished-products', resource: 'finished-products' },
  { text: 'Recipes', icon: <MenuBookIcon />, path: '/recipes', resource: 'recipes' },
  { text: 'Production', icon: <FactoryIcon />, path: '/production', resource: 'production' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers', resource: 'customers' },
  { text: 'Orders', icon: <OrderIcon />, path: '/customer-orders', resource: 'customer-orders' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', resource: 'reports' }, // Reports permission
  { text: 'API Test', icon: <ScienceIcon />, path: '/api-test', resource: 'api-test' }, // Testing tool - assign to testing roles
  { text: 'Users', icon: <PeopleIcon />, path: '/settings/users', resource: 'users' },
  { text: 'Roles', icon: <ShieldIcon />, path: '/settings/roles', resource: 'roles' },
  { text: 'Role Templates', icon: <ShieldIcon />, path: '/settings/role-templates', resource: 'roles' }, // Super Admin only
  { text: 'Clients', icon: <BusinessIcon />, path: '/settings/clients', resource: 'clients' },
  { text: 'Global Settings', icon: <SettingsIcon />, path: '/settings/global', resource: 'clients' }, // Super Admin only - platform settings
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', resource: 'settings' },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true); // State to control sidebar expansion
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Get current page title based on path
  const getPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem?.text || 'Dashboard';
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Logo Section - Modern gradient background */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1E4687 0%, #2962B3 100%)',
          p: drawerOpen ? 2 : 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: drawerOpen ? 'space-between' : 'center',
          minHeight: '64px',
          position: 'relative',
        }}
      >
        {drawerOpen ? (
          <RapidProLogo size="small" variant="full" sx={{ '& .MuiTypography-root': { color: 'white !important' }, '& .MuiTypography-caption': { color: 'rgba(255,255,255,0.8) !important' } }} />
        ) : (
          <RapidProLogo size="small" variant="icon-only" />
        )}
        {/* Collapse/Expand button */}
        {drawerOpen ? (
          <IconButton onClick={handleDrawerCollapse} size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <ChevronLeftIcon />
          </IconButton>
        ) : (
          <IconButton
            onClick={handleDrawerCollapse}
            size="small"
            sx={{
              position: 'absolute',
              right: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'primary.main',
              color: 'white',
              border: '2px solid white',
              boxShadow: 2,
              '&:hover': { bgcolor: 'primary.dark' },
              zIndex: 1201,
              width: 24,
              height: 24,
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <List dense sx={{ py: 0.5, flexGrow: 1 }}>
        {menuItems
          .filter((item) => {
            // If no resource is specified, show the item to everyone
            if (!item.resource) return true;

            // Roles and Role Templates pages are only for Super Admin
            if (item.path === '/settings/roles' || item.path === '/settings/role-templates') {
              return user?.client?.slug === 'system';
            }

            // Check if user has permission to view this resource
            return hasPermission(item.resource, item.action || 'view');
          })
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <Tooltip title={drawerOpen ? '' : item.text} placement="right">
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }}
                  sx={{
                    px: drawerOpen ? 2 : 1.5,
                    py: 1,
                    justifyContent: drawerOpen ? 'flex-start' : 'center',
                    borderRadius: drawerOpen ? 1 : 0,
                    mx: drawerOpen ? 1 : 0,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderLeft: drawerOpen ? 'none' : `3px solid ${theme.palette.primary.main}`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: drawerOpen ? 40 : 'auto',
                    justifyContent: 'center',
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {drawerOpen && (
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{
                        fontWeight: location.pathname === item.path ? 600 : 400,
                        color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerOpen ? drawerWidth : drawerCollapsedWidth}px)` },
          ml: { md: `${drawerOpen ? drawerWidth : drawerCollapsedWidth}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.08),
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page Title & Breadcrumb - Modern Design */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1E4687 0%, #2962B3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}
            >
              {getPageTitle()}
            </Typography>
            <Chip
              label="Pro"
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
                display: { xs: 'none', sm: 'flex' },
              }}
            />
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* User Section - Modern Card Style */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                alignItems: 'flex-end',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                {user?.client.name}
              </Typography>
            </Box>
            <Tooltip title="Account">
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ ml: 1 }}
                aria-controls={anchorEl ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={anchorEl ? 'true' : undefined}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {user?.customRole?.name} • {user?.client.name}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{
          width: { md: drawerOpen ? drawerWidth : drawerCollapsedWidth },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerOpen ? drawerWidth : drawerCollapsedWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              border: 'none',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: {
            xs: '100%',
            md: `calc(100% - ${drawerOpen ? drawerWidth : drawerCollapsedWidth}px)`
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          bgcolor: '#f8fafc',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
