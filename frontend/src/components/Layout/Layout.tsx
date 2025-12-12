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



  const drawer = (showLabels: boolean = drawerOpen) => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Sidebar Header - Collapse/Expand control (only on desktop) */}
      {!isMobile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: showLabels ? 'flex-end' : 'center',
            minHeight: '64px',
            px: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tooltip title={showLabels ? 'Collapse menu' : 'Expand menu'} placement="right">
            <IconButton
              onClick={handleDrawerCollapse}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
              }}
            >
              {showLabels ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {/* Mobile header spacer */}
      {isMobile && (
        <Box
          sx={{
            minHeight: '64px',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            px: 2,
          }}
        >
          <RapidProLogo size="small" variant="full" />
        </Box>
      )}
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
              <Tooltip title={showLabels ? '' : item.text} placement="right">
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }}
                  sx={{
                    px: showLabels ? 2 : 1.5,
                    py: 1,
                    justifyContent: showLabels ? 'flex-start' : 'center',
                    borderRadius: showLabels ? 1 : 0,
                    mx: showLabels ? 1 : 0,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderLeft: showLabels ? 'none' : `3px solid ${theme.palette.primary.main}`,
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
                    minWidth: showLabels ? 40 : 'auto',
                    justifyContent: 'center',
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {showLabels && (
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
          background: 'linear-gradient(135deg, #1E4687 0%, #2962B3 100%)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(30, 70, 135, 0.25)',
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          {/* Mobile menu button */}
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: 'white' }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo in Header */}
          <RapidProLogo
            size="small"
            variant="full"
            sx={{
              '& .MuiTypography-root': { color: 'white !important' },
              '& .MuiTypography-caption': { color: 'rgba(255,255,255,0.85) !important' }
            }}
          />

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* User Section - Modern Glassmorphism Style */}
          <Box
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '50px',
              px: 1.5,
              py: 0.75,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
            }}
            aria-controls={anchorEl ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={anchorEl ? 'true' : undefined}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#FF6B35',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  lineHeight: 1.3,
                  fontSize: '0.875rem',
                }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.75)',
                  lineHeight: 1.2,
                  fontSize: '0.7rem',
                }}
              >
                {user?.client.name}
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 18, ml: 0.5, display: { xs: 'none', sm: 'block' } }} />
          </Box>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                minWidth: 240,
                overflow: 'visible',
                '&::before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 20,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            {/* User Profile Header */}
            <Box
              sx={{
                px: 2,
                py: 2,
                background: 'linear-gradient(135deg, #1E4687 0%, #2962B3 100%)',
                borderRadius: '8px 8px 0 0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#FF6B35',
                    fontWeight: 700,
                    fontSize: '1rem',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white', lineHeight: 1.2 }}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
            {/* Role & Client Info */}
            <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ShieldIcon sx={{ fontSize: 14 }} />
                {user?.customRole?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <BusinessIcon sx={{ fontSize: 14 }} />
                {user?.client.name}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                color: 'error.main',
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
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
          {drawer(true)}
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
          {drawer(drawerOpen)}
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
