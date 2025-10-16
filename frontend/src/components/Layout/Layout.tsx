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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  LocalDining as LocalDiningIcon,
  MenuBook as MenuBookIcon,
  Factory as FactoryIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Science as ScienceIcon,
  People as PeopleIcon,
  ShoppingCart as OrderIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import RapidProLogo from '../Brand/RapidProLogo';

// Define drawer widths for open and closed states
const drawerWidth = 240; // Reduced from 280
const drawerCollapsedWidth = 65; // Reduced from 73, enough width to show just icons

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Raw Materials', icon: <InventoryIcon />, path: '/raw-materials' },
  { text: 'Finished Products', icon: <LocalDiningIcon />, path: '/finished-products' },
  { text: 'Recipes', icon: <MenuBookIcon />, path: '/recipes' },
  { text: 'Production', icon: <FactoryIcon />, path: '/production' },
  { text: 'Contamination', icon: <WarningIcon />, path: '/contamination' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Orders', icon: <OrderIcon />, path: '/customer-orders' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'API Test', icon: <ScienceIcon />, path: '/api-test' }, // Updated to use ScienceIcon for API Test
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true); // State to control sidebar expansion
  const navigate = useNavigate();
  const location = useLocation();

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
        {menuItems.map((item) => (
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
