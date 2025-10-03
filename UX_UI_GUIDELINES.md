# UX/UI Design Guidelines

**Project**: Bakery Inventory Management System  
**Version**: 2.0  
**Last Updated**: October 3, 2025

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Design System](#design-system)
3. [Component Patterns](#component-patterns)
4. [Responsive Design](#responsive-design)
5. [Accessibility](#accessibility)
6. [Best Practices](#best-practices)
7. [Implementation Examples](#implementation-examples)

---

## Design Philosophy

### Core Principles

1. **User-Centric**: Design for bakery staff with varying technical skills
2. **Efficiency**: Minimize clicks and reduce cognitive load
3. **Consistency**: Maintain uniform patterns across all pages
4. **Responsive**: Mobile-first approach for on-the-go access
5. **Accessibility**: WCAG 2.1 AA compliance for inclusive design

### Design Goals

- **Simplicity**: Clean, uncluttered interfaces
- **Speed**: Fast loading and interaction times
- **Feedback**: Clear visual and textual feedback for all actions
- **Error Prevention**: Validation and confirmation dialogs
- **Flexibility**: Multiple view modes to suit different workflows

---

## Design System

### Color Palette

#### Primary Colors

```typescript
primary: {
  main: '#1976d2',      // Primary Blue
  light: '#42a5f5',     // Light Blue
  dark: '#1565c0',      // Dark Blue
  contrastText: '#fff'  // White Text
}
```

#### Status Colors

```typescript
success: {
  main: '#2e7d32',      // Green - Success states
  light: '#4caf50',     // Light Green
  dark: '#1b5e20'       // Dark Green
}

warning: {
  main: '#ed6c02',      // Orange - Warning states
  light: '#ff9800',     // Light Orange
  dark: '#e65100'       // Dark Orange
}

error: {
  main: '#d32f2f',      // Red - Error states
  light: '#f44336',     // Light Red
  dark: '#c62828'       // Dark Red
}

info: {
  main: '#0288d1',      // Blue - Info states
  light: '#03a9f4',     // Light Blue
  dark: '#01579b'       // Dark Blue
}
```

#### Order Status Colors

```typescript
DRAFT: {
  background: '#e3f2fd',  // Light Blue
  text: '#1565c0',        // Dark Blue
  icon: InfoOutlined
}

CONFIRMED: {
  background: '#fff3e0',  // Light Orange
  text: '#e65100',        // Dark Orange
  icon: Schedule
}

FULFILLED: {
  background: '#e8f5e9',  // Light Green
  text: '#2e7d32',        // Dark Green
  icon: CheckCircle
}
```

#### Avatar Colors

```typescript
const avatarColors = [
  '#1976d2', // Blue
  '#d32f2f', // Red
  '#388e3c', // Green
  '#f57c00', // Orange
  '#7b1fa2'  // Purple
];

// Algorithm: Hash customer name to select color
const getAvatarColor = (name: string) => {
  const hash = name.split('').reduce((acc, char) => 
    acc + char.charCodeAt(0), 0
  );
  return avatarColors[hash % avatarColors.length];
};
```

### Typography

#### Font Family

```typescript
fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
```

#### Font Sizes

```typescript
h1: { fontSize: '2.5rem', fontWeight: 500 },    // 40px - Page Titles
h2: { fontSize: '2rem', fontWeight: 500 },      // 32px - Section Titles
h3: { fontSize: '1.75rem', fontWeight: 500 },   // 28px - Subsections
h4: { fontSize: '1.5rem', fontWeight: 500 },    // 24px - Card Titles
h5: { fontSize: '1.25rem', fontWeight: 500 },   // 20px - Labels
h6: { fontSize: '1rem', fontWeight: 500 },      // 16px - Small Labels
body1: { fontSize: '1rem' },                     // 16px - Body Text
body2: { fontSize: '0.875rem' },                 // 14px - Small Text
caption: { fontSize: '0.75rem' }                 // 12px - Captions
```

### Spacing

#### Base Unit: 8px

```typescript
spacing: (factor: number) => `${8 * factor}px`

// Common spacing values:
spacing(1) = 8px    // Minimal spacing
spacing(2) = 16px   // Small spacing
spacing(3) = 24px   // Medium spacing
spacing(4) = 32px   // Large spacing
spacing(6) = 48px   // Extra large spacing
```

#### Component Spacing

```typescript
Card: {
  padding: spacing(2),        // 16px internal padding
  marginBottom: spacing(2)    // 16px between cards
}

Dialog: {
  padding: spacing(3)         // 24px dialog content padding
}

AppBar: {
  height: 64px                // Standard AppBar height
}

Drawer: {
  width: 280px,               // Standard drawer width
  padding: spacing(2)         // 16px internal padding
}
```

### Elevation (Shadows)

```typescript
elevation0: 'none',                    // No shadow
elevation1: '0px 2px 4px rgba(0,0,0,0.1)',   // Minimal shadow (cards)
elevation2: '0px 4px 8px rgba(0,0,0,0.12)',  // Light shadow (hover)
elevation3: '0px 8px 16px rgba(0,0,0,0.14)', // Medium shadow (dialogs)
elevation4: '0px 16px 32px rgba(0,0,0,0.16)' // Strong shadow (modals)
```

### Border Radius

```typescript
borderRadius: {
  small: '4px',     // Chips, Buttons
  medium: '8px',    // Cards, Inputs
  large: '12px',    // Dialogs
  circle: '50%'     // Avatars
}
```

---

## Component Patterns

### 1. View Mode Toggle

**Purpose**: Switch between card and list views

**Implementation**:

```typescript
const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

<Stack direction="row" spacing={1}>
  <IconButton
    onClick={() => setViewMode('card')}
    color={viewMode === 'card' ? 'primary' : 'default'}
    aria-label="Card view"
  >
    <GridViewIcon />
  </IconButton>
  <IconButton
    onClick={() => setViewMode('list')}
    color={viewMode === 'list' ? 'primary' : 'default'}
    aria-label="List view"
  >
    <ListIcon />
  </IconButton>
</Stack>
```

**Visual Feedback**:
- Active view has primary color
- Inactive view has default (gray) color
- Hover state shows light background
- Tooltip shows view name

### 2. KPI Dashboard Cards

**Purpose**: Display key metrics with interactive filters

**Structure**:

```typescript
<Card 
  elevation={1}
  sx={{
    cursor: 'pointer',
    '&:hover': {
      elevation: 2,
      borderColor: 'primary.main',
      borderWidth: 2
    }
  }}
  onClick={() => handleFilterClick('ALL')}
>
  <CardContent>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="h6" color="text.secondary">
        Total Orders
      </Typography>
      <Avatar sx={{ bgcolor: 'primary.main' }}>
        <ShoppingCartIcon />
      </Avatar>
    </Stack>
    <Typography variant="h3" mt={2}>
      {totalCount}
    </Typography>
  </CardContent>
</Card>
```

**Interaction Pattern**:
- Hover: Elevation increases, border appears
- Click: Applies filter, shows active state
- Active: Border color matches card theme
- Responsive: Stacks vertically on mobile

### 3. Customer Avatar System

**Purpose**: Visual identification with initials and color

**Algorithm**:

```typescript
const getCustomerInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string): string => {
  const colors = ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2'];
  const hash = name.split('').reduce((acc, char) => 
    acc + char.charCodeAt(0), 0
  );
  return colors[hash % colors.length];
};
```

**Usage**:

```typescript
<Avatar sx={{ bgcolor: getAvatarColor(customer.name) }}>
  {getCustomerInitials(customer.name)}
</Avatar>
```

**Rules**:
- Always uppercase initials
- Maximum 2 characters
- Consistent color per customer name
- Fallback to PersonIcon if no name

### 4. Status Chips

**Purpose**: Display order/customer status with visual feedback

**Variants**:

```typescript
// Order Status
<Chip
  label="DRAFT"
  size="small"
  icon={<InfoOutlined />}
  sx={{
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    fontWeight: 'medium'
  }}
/>

<Chip
  label="CONFIRMED"
  size="small"
  icon={<Schedule />}
  sx={{
    backgroundColor: '#fff3e0',
    color: '#e65100',
    fontWeight: 'medium'
  }}
/>

<Chip
  label="FULFILLED"
  size="small"
  icon={<CheckCircle />}
  sx={{
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    fontWeight: 'medium'
  }}
/>

// Customer Status
<Chip
  label="ACTIVE"
  size="small"
  icon={<CheckCircle />}
  color="success"
/>

<Chip
  label="INACTIVE"
  size="small"
  icon={<Cancel />}
  color="error"
/>
```

### 5. Mobile Drawer Pattern

**Purpose**: Space-efficient filters/search on mobile

**Implementation**:

```typescript
const [filtersOpen, setFiltersOpen] = useState(false);
const isMobile = useMediaQuery(theme.breakpoints.down('md'));

// Trigger Button
{isMobile && (
  <IconButton onClick={() => setFiltersOpen(true)}>
    <FilterListIcon />
  </IconButton>
)}

// Drawer Component
<Drawer
  anchor="right"
  open={filtersOpen}
  onClose={() => setFiltersOpen(false)}
  PaperProps={{
    sx: { width: 280, p: 2 }
  }}
>
  <Stack direction="row" justifyContent="space-between" mb={2}>
    <Typography variant="h6">Filters</Typography>
    <IconButton onClick={() => setFiltersOpen(false)}>
      <CloseIcon />
    </IconButton>
  </Stack>
  {/* Filter controls */}
</Drawer>
```

**Rules**:
- Only show on mobile (<960px)
- Slide from right
- 280px width
- Close button in header
- Overlay backdrop

### 6. Contact Information Display

**Purpose**: Show email, phone, location with icons

**Pattern**:

```typescript
<Stack spacing={1}>
  {customer.email && (
    <Stack direction="row" spacing={1} alignItems="center">
      <EmailIcon fontSize="small" color="action" />
      <Typography variant="body2">
        {customer.email}
      </Typography>
    </Stack>
  )}
  {customer.phone && (
    <Stack direction="row" spacing={1} alignItems="center">
      <PhoneIcon fontSize="small" color="action" />
      <Typography variant="body2">
        {customer.phone}
      </Typography>
    </Stack>
  )}
  {customer.address && (
    <Stack direction="row" spacing={1} alignItems="center">
      <LocationOnIcon fontSize="small" color="action" />
      <Typography variant="body2" noWrap>
        {customer.address}
      </Typography>
    </Stack>
  )}
</Stack>
```

**Rules**:
- Only show if data exists
- Icon always comes first
- Text truncates with ellipsis
- Stack vertically for clarity

---

## Responsive Design

### Breakpoints

```typescript
breakpoints: {
  values: {
    xs: 0,      // Phone (portrait)
    sm: 600,    // Phone (landscape)
    md: 960,    // Tablet
    lg: 1280,   // Desktop
    xl: 1920    // Large Desktop
  }
}
```

### Mobile-First Approach

**Philosophy**: Design for smallest screen first, then enhance

**Example**:

```typescript
<Box
  sx={{
    // Mobile default (xs: 0-599px)
    padding: 2,
    fontSize: '14px',
    
    // Tablet (md: 960px+)
    [theme.breakpoints.up('md')]: {
      padding: 3,
      fontSize: '16px'
    },
    
    // Desktop (lg: 1280px+)
    [theme.breakpoints.up('lg')]: {
      padding: 4,
      fontSize: '18px'
    }
  }}
>
  Content
</Box>
```

### Grid Layout

**Card View Grid**:

```typescript
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    <Card>...</Card>
  </Grid>
</Grid>
```

**Columns per breakpoint**:
- xs (mobile): 1 column (100%)
- sm (tablet portrait): 2 columns (50%)
- md (tablet landscape): 3 columns (33.33%)
- lg (desktop): 4 columns (25%)

### Component Visibility

**Show/Hide based on screen size**:

```typescript
// Desktop only
<Box sx={{ display: { xs: 'none', md: 'block' } }}>
  Desktop content
</Box>

// Mobile only
<Box sx={{ display: { xs: 'block', md: 'none' } }}>
  Mobile content
</Box>
```

### Typography Scaling

```typescript
<Typography
  variant="h4"
  sx={{
    fontSize: { xs: '1.5rem', md: '2rem', lg: '2.5rem' }
  }}
>
  Responsive Title
</Typography>
```

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast

**Requirements**:
- Normal text (16px): 4.5:1 contrast ratio
- Large text (24px): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Examples**:

```typescript
// ✅ Good: High contrast
<Typography sx={{ color: '#1976d2', bgcolor: '#ffffff' }}>
  Text (4.54:1)
</Typography>

// ❌ Bad: Low contrast
<Typography sx={{ color: '#64b5f6', bgcolor: '#ffffff' }}>
  Text (2.8:1)
</Typography>
```

#### Keyboard Navigation

**Requirements**:
- All interactive elements must be keyboard accessible
- Logical tab order
- Visible focus indicators
- Skip navigation links

**Implementation**:

```typescript
// Focus visible styles
<Button
  sx={{
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: '2px'
    }
  }}
>
  Accessible Button
</Button>

// Tab order control
<div tabIndex={0}>
  <Button tabIndex={-1}>Skip</Button>
  <Button tabIndex={0}>Focus</Button>
</div>
```

#### ARIA Labels

**Requirements**:
- All icons need accessible labels
- Decorative images have empty alt text
- Form inputs have associated labels

**Examples**:

```typescript
// Icon buttons
<IconButton aria-label="View details">
  <VisibilityIcon />
</IconButton>

// Decorative icons
<Icon aria-hidden="true">
  <DecorativeIcon />
</Icon>

// Form labels
<TextField
  label="Customer Name"
  aria-label="Enter customer name"
  required
  aria-required="true"
/>
```

#### Screen Reader Support

**Landmarks**:

```typescript
<header role="banner">
  <AppBar>...</AppBar>
</header>

<nav role="navigation" aria-label="Main navigation">
  <Drawer>...</Drawer>
</nav>

<main role="main">
  <Container>...</Container>
</main>

<footer role="contentinfo">
  <Typography>...</Typography>
</footer>
```

**Live Regions**:

```typescript
<Snackbar
  open={open}
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <Alert>Operation successful</Alert>
</Snackbar>
```

---

## Best Practices

### 1. Performance

#### Code Splitting

```typescript
// Lazy load heavy components
const OrderForm = lazy(() => import('./pages/OrderForm'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));

<Suspense fallback={<CircularProgress />}>
  <OrderForm />
</Suspense>
```

#### Memoization

```typescript
// Memoize expensive calculations
const filteredOrders = useMemo(() => 
  orders.filter(order => order.status === statusFilter),
  [orders, statusFilter]
);

// Memoize callback functions
const handleViewChange = useCallback((newView: 'card' | 'list') => {
  setViewMode(newView);
}, []);
```

### 2. Error Handling

#### Error States

```typescript
{error && (
  <Alert severity="error" sx={{ mb: 2 }}>
    <AlertTitle>Error</AlertTitle>
    {error.message || 'An unexpected error occurred'}
  </Alert>
)}
```

#### Loading States

```typescript
{isLoading && (
  <Box display="flex" justifyContent="center" p={4}>
    <CircularProgress />
  </Box>
)}
```

#### Empty States

```typescript
{orders.length === 0 && (
  <Paper sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h6" color="text.secondary">
      No orders found
    </Typography>
    <Typography variant="body2" color="text.secondary" mt={1}>
      Create your first order to get started
    </Typography>
    <Button variant="contained" sx={{ mt: 2 }}>
      New Order
    </Button>
  </Paper>
)}
```

### 3. User Feedback

#### Success Notifications

```typescript
<Snackbar
  open={showSuccess}
  autoHideDuration={3000}
  onClose={() => setShowSuccess(false)}
>
  <Alert severity="success">
    Order created successfully
  </Alert>
</Snackbar>
```

#### Confirmation Dialogs

```typescript
<Dialog open={confirmOpen}>
  <DialogTitle>Confirm Action</DialogTitle>
  <DialogContent>
    <Typography>
      Are you sure you want to delete this order?
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmOpen(false)}>
      Cancel
    </Button>
    <Button onClick={handleConfirm} color="error" variant="contained">
      Delete
    </Button>
  </DialogActions>
</Dialog>
```

### 4. Form Validation

#### Inline Validation

```typescript
<TextField
  label="Customer Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={!!nameError}
  helperText={nameError}
  required
/>
```

#### Submit Validation

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  const errors: Record<string, string> = {};
  
  if (!name.trim()) {
    errors.name = 'Customer name is required';
  }
  
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }
  
  // Proceed with submission
  submitForm();
};
```

---

## Implementation Examples

### Complete Card View Component

```typescript
<Grid container spacing={2}>
  {orders.map((order) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
      <Card elevation={1}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: getAvatarColor(order.customer.name) }}>
              {getCustomerInitials(order.customer.name)}
            </Avatar>
          }
          title={order.customer.name}
          subheader={`Order #${order.orderNumber}`}
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={order.status}
                size="small"
                color={getStatusColor(order.status)}
              />
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Delivery
              </Typography>
              <Typography variant="body2">
                {formatDate(order.expectedDeliveryDate)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
              <Typography variant="h6" color="primary">
                ${order.totalPrice.toFixed(2)}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
        <Divider />
        <CardActions>
          <Button size="small" startIcon={<VisibilityIcon />}>
            View
          </Button>
          {order.status === 'DRAFT' && (
            <Button size="small" startIcon={<EditIcon />}>
              Edit
            </Button>
          )}
        </CardActions>
      </Card>
    </Grid>
  ))}
</Grid>
```

### Complete List View Component

```typescript
<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Customer</TableCell>
        <TableCell>Order #</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Delivery Date</TableCell>
        <TableCell align="right">Total</TableCell>
        <TableCell align="center">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {orders.map((order) => (
        <TableRow key={order.id} hover>
          <TableCell>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar 
                sx={{ 
                  bgcolor: getAvatarColor(order.customer.name),
                  width: 32,
                  height: 32
                }}
              >
                {getCustomerInitials(order.customer.name)}
              </Avatar>
              <Typography variant="body2">
                {order.customer.name}
              </Typography>
            </Stack>
          </TableCell>
          <TableCell>{order.orderNumber}</TableCell>
          <TableCell>
            <Chip
              label={order.status}
              size="small"
              color={getStatusColor(order.status)}
            />
          </TableCell>
          <TableCell>
            {formatDate(order.expectedDeliveryDate)}
          </TableCell>
          <TableCell align="right">
            ${order.totalPrice.toFixed(2)}
          </TableCell>
          <TableCell align="center">
            <Stack direction="row" spacing={1} justifyContent="center">
              <IconButton size="small" aria-label="View details">
                <VisibilityIcon fontSize="small" />
              </IconButton>
              {order.status === 'DRAFT' && (
                <IconButton size="small" aria-label="Edit order">
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

---

## Maintenance & Updates

### When to Update Guidelines

- **New Component Pattern**: Document new reusable patterns
- **Design Token Change**: Update color, spacing, typography values
- **Accessibility Fix**: Document improved accessibility patterns
- **Performance Optimization**: Share performance best practices
- **User Feedback**: Incorporate usability improvements

### Review Schedule

- **Weekly**: Review new components for consistency
- **Monthly**: Update based on user feedback
- **Quarterly**: Comprehensive design system audit
- **Annually**: Major version update with breaking changes

---

**Created**: October 3, 2025  
**Version**: 2.0  
**Status**: ✅ Active Guidelines
