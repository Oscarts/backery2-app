import React, { useState } from 'react';
import { Outlet, useNavigate as useRouterNavigate } from 'react-router-dom';
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
  Science as ScienceIcon,
  People as PeopleIcon,
  ShoppingCart as OrderIcon,
  Label as LabelIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Shield as ShieldIcon,
  Business as BusinessIcon,
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
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' }, // No permission check - available to all
  { text: 'Users', icon: <PeopleIcon />, path: '/settings/users', resource: 'users' },
  { text: 'Roles', icon: <ShieldIcon />, path: '/settings/roles', resource: 'roles' },
  { text: 'Clients', icon: <BusinessIcon />, path: '/settings/clients', resource: 'clients' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', resource: 'settings' },
  { text: 'API Test', icon: <ScienceIcon />, path: '/api-test' }, // No permission check - dev tool
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

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, minHeight: '64px' }}>
        {/* Always show just the icon in the sidebar */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: drawerOpen ? 0 : 1 }}>
          <RapidProLogo size="small" variant="icon-only" />
        </Box>
        {/* Show collapse button only when drawer is open */}
        {drawerOpen && (
          <IconButton onClick={handleDrawerCollapse} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
        {/* Show expand button when collapsed - positioned absolutely */}
        {!drawerOpen && (
          <IconButton 
            onClick={handleDrawerCollapse} 
            size="small"
            sx={{ 
              position: 'absolute',
              right: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              zIndex: 1201,
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List dense sx={{ py: 0.5 }}>
        {menuItems
          .filter((item) => {
            // If no resource is specified, show the item to everyone
            if (!item.resource) return true;
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
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: drawerOpen ? 40 : 'auto',
                    justifyContent: 'center',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {drawerOpen && <ListItemText primary={item.text} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
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
          background: 'white',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <RapidProLogo 
            size="medium" 
            variant="full"
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          />
          <RapidProLogo 
            size="small" 
            variant="icon-only"
            sx={{ display: { xs: 'flex', sm: 'none' } }}
          />
          
          {/* User Menu */}
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          p: { xs: 2, sm: 2.5 },  // Reduced padding from 3
          width: {
            xs: '100%',
            md: `calc(100% - ${drawerOpen ? drawerWidth : drawerCollapsedWidth}px)`
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
