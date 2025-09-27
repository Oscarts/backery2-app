# UI Guidelines

## 🎨 Design System Overview

This document establishes UI/UX patterns and design standards for the bakery inventory management application to ensure consistency across all components and views.

For specific guidelines on page layouts and structural consistency, please refer to [Page Layout Guidelines](./page-layout-guidelines.md).

## 🎯 Core Design Principles

### Material Design Foundation

- **Base Library:** Material-UI v5.14.16
- **Theme:** Custom bakery-focused color scheme
- **Typography:** Roboto font family
- **Spacing:** 8px grid system
- **Responsive:** Mobile-first approach

### Accessibility Standards

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Touch-friendly interactive elements (minimum 44px)

## 🎨 Color Palette

### Primary Colors

```css
--primary-main: #8B4513;     /* Saddle Brown - bakery warmth */
--primary-light: #A0522D;    /* Sienna - lighter accent */
--primary-dark: #654321;     /* Dark brown - deep contrast */
```

### Secondary Colors

```css
--secondary-main: #F4A460;   /* Sandy Brown - warm accent */
--secondary-light: #DEB887;  /* Burlywood - soft highlight */
--secondary-dark: #CD853F;   /* Peru - darker accent */
```

### Status Colors

```css
--success: #4CAF50;          /* Green - success states */
--warning: #FF9800;          /* Orange - warning states */
--error: #F44336;            /* Red - error states */
--info: #2196F3;             /* Blue - informational */
```

### Quality Status Colors

```css
--excellent: #4CAF50;        /* Green */
--good: #8BC34A;            /* Light Green */
--fair: #FFEB3B;            /* Yellow */
--poor: #FF9800;            /* Orange */
--critical: #F44336;        /* Red */
```

## 📱 Responsive Breakpoints

```css
xs: 0px      /* Extra small (mobile) */
sm: 600px    /* Small (tablet portrait) */
md: 900px    /* Medium (tablet landscape) */
lg: 1200px   /* Large (desktop) */
xl: 1536px   /* Extra large (wide desktop) */
```

## 🧩 Component Standards

### Status Indicators

#### Quality Status Chips

**Display Style:** Outlined chips with colored borders

```jsx
<Chip
  label={product.qualityStatus.name}
  size="small"
  variant="outlined"
  sx={{
    borderColor: product.qualityStatus.color || '#gray',
    color: product.qualityStatus.color || '#gray',
    borderWidth: 1.5,
    fontWeight: 'medium'
  }}
/>
```

#### Contamination Alerts

**Display Styles:**

1. **Table View:**  
   - Place CONTAMINATED status below the category name to save column space
   - Add left border indicator for quick visual scanning

   ```jsx
   <TableCell>
     <Box>
       <Typography variant="subtitle2">
         {product.name}
       </Typography>
       <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
         {product.category?.name}
         {product.isContaminated && (
           <Chip 
             label="CONTAMINATED" 
             color="error" 
             size="small" 
             sx={{ ml: 1, height: 16, '& .MuiChip-label': { px: 0.5, py: 0 } }} 
           />
         )}
       </Typography>
     </Box>
   </TableCell>
   ```

   Table row with contamination indicator:

   ```jsx
   <TableRow
     sx={{
       borderLeft: product.isContaminated ? '3px solid #d32f2f' : 'none'
     }}
   >
   ```

2. **Card View:**  
   - Place CONTAMINATED status in the card footer area
   - Add left border indicator for the entire card

   ```jsx
   <Card
     sx={{
       borderLeft: product.isContaminated ? '4px solid #d32f2f' : 'none',
     }}
   >
     {/* Card content */}
     <CardActions>
       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
         {/* Other status chips */}
         {product.isContaminated && (
           <Chip 
             label="CONTAMINATED" 
             color="error" 
             size="small" 
             sx={{ fontWeight: 'medium' }} 
           />
         )}
       </Box>
     </CardActions>
   </Card>
   ```

#### Stock Level Indicators

**Low Stock:** Orange chip with warning icon
**Out of Stock:** Red chip with error icon
**In Stock:** Green chip with check icon

#### Production Status Chips

Prefer a subtle colored dot with tooltip to reduce visual noise. Use consistent colors and descriptions:

```jsx
const meta = getProductionStatusMeta(status);
return meta ? (
  <Tooltip title={meta.description} arrow>
    <Box sx={(theme) => ({
      width: 10,
      height: 10,
      borderRadius: '50%',
      bgcolor: meta.getColor(theme),
      display: 'inline-block',
    })} />
  </Tooltip>
) : null;
```

Descriptions:

- IN_PRODUCTION: Currently in production (primary color)
- COMPLETED: Production completed (success)
- ON_HOLD: Production paused (warning)
- DISCARDED: Discarded and not for use (error)

### Data Tables

#### Desktop View

- Sortable column headers
- Pagination controls at bottom
- Action buttons in rightmost column
- Hover effects on rows
- Loading skeleton during data fetch

#### Mobile/Tablet View

- Card-based layout
- Key information prominently displayed
- Secondary information in smaller text
- Action buttons easily accessible
- Swipe gestures for additional actions

### Forms and Dialogs

#### Form Layout Standards

- Action buttons at the TOP of forms (not bottom)
- Clear field labels and validation messages
- Consistent spacing between form elements
- Responsive layout that adapts to screen size

```jsx
// Standard form button placement
<DialogActions sx={{ justifyContent: 'flex-start', p: 2 }}>
  <Button variant="contained" onClick={handleSave}>
    Update
  </Button>
  <Button variant="outlined" onClick={handleCancel}>
    Cancel
  </Button>
</DialogActions>
```

#### Form Validation

- Real-time validation feedback
- Clear error messages
- Required field indicators
- Success confirmation

#### Production Dialog Patterns (New - Sept 2025)

##### ProductionStepsDialog Component

A comprehensive dialog for customizing production workflows with the following features:

- **Header**: Dialog title with close button
- **Content Area**: Scrollable step list with drag-and-drop reordering
- **Step Cards**: Individual step components with edit/delete actions
- **Add Step Section**: Form for creating new custom steps
- **Action Buttons**: Save/Cancel at bottom with proper spacing

```jsx
// Production Steps Dialog Pattern
<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
  <DialogTitle>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h5">Customize Production Steps</Typography>
      <IconButton onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
  <DialogContent>
    {/* Step management interface */}
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button variant="contained" onClick={handleSave}>Save Changes</Button>
  </DialogActions>
</Dialog>
```

##### Enhanced Recipe Selection

Updated recipe selection dialogs now include:

**Ingredient Selection:** Only raw materials and finished products can be selected as ingredients. Intermediate products are no longer supported.

**Expiration Warnings**: Clear visual indicators for expired ingredients
**Contamination Alerts**: Specific messaging for contaminated materials
**Detailed Error States**: Comprehensive ingredient status reporting
**Step Customization Access**: Button to open production steps dialog

##### Material Breakdown Dialog (New - September 2025)

A comprehensive dialog component for displaying detailed material traceability and cost breakdown for finished products:

**Key Design Features:**

- **Responsive Design**: Full-width modal with adaptive card layouts
- **Creative Information Display**: Smart use of icons, colors, and typography
- **Cost Visualization**: Prominent cost summary with breakdown details
- **Waste Indicators**: Visual waste tracking with percentage calculations
- **Material Cards**: Individual cards for each material with comprehensive details

```jsx
// Material Breakdown Dialog Pattern
<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
  <DialogTitle>
    <Box display="flex" alignItems="center" justifyContent="between">
      <Box>
        <Typography variant="h5" fontWeight="bold">Material Breakdown</Typography>
        <Typography variant="body2" color="text.secondary">
          {productName} - Batch #{batchNumber}
        </Typography>
      </Box>
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
  <DialogContent>
    {/* Cost Summary Card with Primary Color Theme */}
    <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
      <CardContent>
        <Typography variant="h6">Production Cost Summary</Typography>
        {/* Grid layout for cost metrics */}
      </CardContent>
    </Card>
    
    {/* Material Cards with Icons and Visual Indicators */}
    {materials.map(material => (
      <Card key={material.id} sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            {/* Material info with category icons */}
            {/* Quantity display with unit formatting */}
            {/* Cost breakdown with currency formatting */}
            {/* Waste indicators with progress bars */}
          </Grid>
        </CardContent>
      </Card>
    ))}
  </DialogContent>
</Dialog>
```

**Design Patterns Used:**

- **Icon Integration**: Material-UI icons for visual context (Inventory2, AttachMoney, Scale, Tag, Delete)
- **Color Coding**: Primary theme for summaries, warning colors for waste indicators
- **Typography Hierarchy**: Clear information hierarchy with captions, body text, and emphasis
- **Loading States**: Skeleton loaders during data fetching
- **Error Handling**: Alert components for error states
- **Empty States**: Informative messages when no data is available

#### Production Status Field (Finished Products)

- Include a "Production Status" select when creating or editing Finished Products
- Default to "In Production"
- Use the same status set as Intermediate Products for consistency

#### Production Workflow UX Improvements (September 2025)

##### Enhanced Production Tracker

The `EnhancedProductionTracker` component now includes:

- **Smart Finish Button Logic**: Only displays when ALL steps are completed
- **Smooth Scroll Management**: Automatically scrolls to current step without page jumping
- **Step Reference System**: Uses React refs for precise step targeting and focus management
- **Visual Step Indicators**: Clear progress visualization with step completion status

```jsx
// Smart finish button pattern
{allStepsCompleted() && (
  <Card
    sx={{
      mt: 2,
      border: '3px solid',
      borderColor: 'success.main',
      bgcolor: 'success.light',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
      '&:hover': {
        bgcolor: 'success.main',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
      }
    }}
    onClick={handleFinishProduction}
  >
    <CardContent sx={{ textAlign: 'center', py: 3 }}>
      <CelebrationIcon sx={{ fontSize: 56, color: 'success.dark', mb: 1 }} />
      <Typography variant="h5" color="success.dark" sx={{ fontWeight: 'bold', mb: 1 }}>
        🎉 Finish Production
      </Typography>
    </CardContent>
  </Card>
)}
```

##### Production Dashboard Enhancements

Updated dashboard with real-time functionality:

- **Live Statistics**: Database-driven metrics instead of calculated values
- **Delete Functionality**: Production run deletion with confirmation dialogs
- **Action Button Layout**: Pause/Resume/Delete buttons with proper spacing and tooltips
- **History Integration**: Button to access production history component

```jsx
// Delete button pattern
<Tooltip title="Delete Production Run">
  <IconButton
    size="small"
    color="error"
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteProduction(production.id);
    }}
  >
    <DeleteIcon />
  </IconButton>
</Tooltip>
```

##### Production History Component

New `ProductionHistory` component provides:

- **Paginated History View**: Load-more functionality for large datasets
- **Detailed Metrics Display**: Production duration, quantities, and completion status
- **Card-based Layout**: Consistent with existing production card design
- **Dialog Integration**: Modal view for detailed historical analysis

```jsx
// History component pattern
<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
  <DialogTitle>
    <Typography variant="h5">Production History</Typography>
  </DialogTitle>
  <DialogContent>
    <Grid container spacing={2}>
      {completedRuns.map((run) => (
        <Grid item xs={12} md={6} key={run.id}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {run.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed: {format(new Date(run.completedAt), 'PPP')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </DialogContent>
</Dialog>
```

- Real-time validation feedback
- Clear error messages
- Required field indicators
- Success confirmation

### Navigation

#### App Bar

- Consistent height across all pages
- Breadcrumb navigation for deep pages
- User actions in top-right corner
- Responsive menu for mobile

#### Sidebar Navigation

- Collapsible on smaller screens
- Clear section groupings
- Active state indicators
- Icons for visual recognition

### Loading States

#### Skeleton Loading

```jsx
<Skeleton variant="rectangular" width="100%" height={118} />
<Skeleton variant="text" sx={{ fontSize: '1rem' }} />
```

#### Progress Indicators

- Linear progress for determinate operations
- Circular progress for indeterminate operations
- Overlay loading for full-page operations

## 📊 Data Visualization

### Dashboard Cards

- Consistent card structure across metrics
- Clear typography hierarchy
- Appropriate use of icons
- Color coding for status indicators

### KPI Indicator Cards

#### Design Guidelines

- **Height & Size**: Maintain compact size (64px height) to optimize vertical space
- **Layout**: Use horizontal layout with left-aligned icon and right-aligned metric
- **Typography**: Use h6 with bold styling for metrics, caption for labels
- **Interaction**:
  - Apply subtle hover animation (2px vertical lift, subtle shadow)
  - Include visual feedback for selected state (background color change)
  - Add status text for active filters (small caption below the main content)

#### Technical Specifications

- Icon container: 32px x 32px avatar
- Internal padding: 1.25px with 8px bottom
- Border radius: 1.5px (slightly softer than standard)
- Gap between elements: 1.5 spacing units
- Font size for filter state text: 0.7rem

#### Color Guidelines

- Total/All items: primary.main/primary.50
- Expiring/Warning: warning.main/warning.50
- Low stock/Error: error.main/error.50
- Production status: primary.main/primary.50

#### Accessibility

- Ensure touch target size of at least 44x44px for mobile
- Maintain color contrast ratio of 4.5:1 for all text
- Provide clear hover and active states for interactive elements

### Charts and Graphs

- Color-blind friendly palette
- Clear legends and labels
- Responsive sizing
- Interactive tooltips

## 🎭 Interactive Elements

### Buttons

#### Primary Actions

```jsx
<Button variant="contained" color="primary">
  Save Changes
</Button>
```

#### Secondary Actions

```jsx
<Button variant="outlined" color="primary">
  Cancel
</Button>
```

#### Danger Actions

```jsx
<Button variant="contained" color="error">
  Delete Item
</Button>
```

### Input Fields

#### Standard Text Input

```jsx
<TextField
  label="Product Name"
  variant="outlined"
  fullWidth
  required
  error={!!errors.name}
  helperText={errors.name}
/>
```

#### Select Dropdown

```jsx
<FormControl fullWidth>
  <InputLabel>Category</InputLabel>
  <Select label="Category" value={category} onChange={handleChange}>
    {categories.map(cat => (
      <MenuItem key={cat.id} value={cat.id}>
        {cat.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

## � Inventory Page Patterns

### Standardized Inventory View

Based on the Finished Products page implementation, all inventory pages should follow this pattern:

1. **Dual View Toggle**
   - Provide both List (table) and Card views
   - Auto-select Card view on mobile, List view on desktop
   - Allow users to manually toggle between views

   ```jsx
   <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
     <IconButton
       color={viewMode === 'list' ? 'primary' : 'default'}
       onClick={() => setViewMode('list')}
       sx={{ borderRadius: '4px 0 0 4px', bgcolor: viewMode === 'list' ? 'action.selected' : 'transparent' }}
     >
       <ListViewIcon />
     </IconButton>
     <IconButton
       color={viewMode === 'card' ? 'primary' : 'default'}
       onClick={() => setViewMode('card')}
       sx={{ borderRadius: '0 4px 4px 0', bgcolor: viewMode === 'card' ? 'action.selected' : 'transparent' }}
     >
       <GridViewIcon />
     </IconButton>
   </Box>
   ```

2. **Key Performance Indicators**
   - Display compact cards with count metrics at top of page
   - Implement as interactive filter toggles (clicking filters the list)
   - Use consistent color scheme for all inventory pages
   - Show active filter state with background color and status text
   - Use horizontal layout with right-aligned count for better space utilization

   ```jsx
   <Card
     elevation={1}
     sx={{
       borderRadius: 1.5,
       p: 0.5,
       border: 1,
       borderColor: indicatorFilter === 'low_stock' ? 'error.main' : (lowStockCount > 0 ? 'error.main' : 'divider'),
       cursor: 'pointer',
       transition: 'all 0.2s',
       '&:hover': { 
         transform: 'translateY(-2px)', 
         boxShadow: 2,
         borderColor: 'error.main'
       },
       backgroundColor: indicatorFilter === 'low_stock' ? 'error.50' : 'white',
       minHeight: '64px',
       display: 'flex',
     }}
     onClick={() => setIndicatorFilter('low_stock')}
   >
     <CardContent sx={{ 
       display: 'flex', 
       alignItems: 'center', 
       gap: 1.5, 
       p: 1.25, 
       pb: '8px !important',
       width: '100%'
     }}>
       <Avatar sx={{ bgcolor: 'error.light', color: 'error.contrastText', width: 32, height: 32 }}>
         <TrendingDownIcon sx={{ fontSize: '1rem' }} />
       </Avatar>
       <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
           <Typography variant="caption" color="text.secondary">Low Stock</Typography>
           <Typography variant="h6" color="error.main" sx={{ ml: 1, fontWeight: 'bold' }}>{lowStockCount}</Typography>
         </Box>
         {indicatorFilter === 'low_stock' && 
           <Typography variant="caption" color="error.dark" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
             Filtered by low stock
           </Typography>
         }
       </Box>
     </CardContent>
   </Card>
   ```

3. **Search & Filter Panel**
   - Standard search with attribute selector
   - Drawer-style filters on mobile
   - Persistent filter panel on desktop
   - Apply button for complex filters

4. **Status Visual Indicators**
   - Left border indicators for status (contaminated, expired)
   - Status chips in consistent locations
   - Color coding consistent across all inventory types

5. **Responsive Pagination**
   - Consistent pagination UI at bottom of both views
   - Adapt labels on mobile ("Items:" instead of "Items per page:")

6. **Common Action Layout**
   - Action buttons in right-aligned column in tables
   - Action buttons in card footer area in card view

## �📱 Mobile-First Design Patterns

### Card Layouts

- Primary information prominently displayed
- Secondary information in smaller text
- Clear visual hierarchy
- Touch-friendly interaction areas

### List Views

- Compact mode for dense information
- Comfortable mode for easy interaction
- Search and filter capabilities
- Pull-to-refresh functionality

#### Standard Search Pattern (Products)

- Use a "Search By" dropdown next to the search input
  - Options: All Attributes, Product, SKU, Batch
  - Input placeholder reflects the selected attribute
- Prefer a single attribute selector over multiple overlapping filters where possible

### Modal and Dialog Behavior

- Full-screen on mobile devices
- Proper focus management
- Easy dismissal methods
- Keyboard navigation support

## 🎨 Typography Scale

```css
h1: 2.125rem (34px) - Page titles
h2: 1.5rem (24px)   - Section headers
h3: 1.25rem (20px)  - Subsection headers
h4: 1.125rem (18px) - Card titles
h5: 1rem (16px)     - Field labels
h6: 0.875rem (14px) - Helper text
body1: 1rem (16px)  - Primary text
body2: 0.875rem (14px) - Secondary text
caption: 0.75rem (12px) - Fine print
```

### Page Headers (Standard)

- Container: `maxWidth="xl"` with `sx={{ mt: 4, mb: 4 }}`
- Header row spacing: `mb: 3` between title/actions
- Title: `<Typography variant="h4" component="h1">` for top-level page titles
- Avoid per-page custom font sizes for titles unless a compelling reason exists; prefer variant-driven consistency

Applied across Dashboard, Raw Materials, Intermediate Products, Finished Products, Reports, and Contamination pages.

## 🚨 Error States and Feedback

### Error Messages

- Clear, user-friendly language
- Specific actions users can take
- Appropriate color coding
- Persistent until resolved

### Success Messages

- Brief confirmation of completed actions
- Auto-dismiss after appropriate time
- Green color coding
- Clear action confirmation

### Loading Feedback

- Immediate feedback for user actions
- Progressive loading for long operations
- Skeleton screens for content loading
- Disable buttons during submission

## 🎯 Accessibility Guidelines

### Keyboard Navigation

- Logical tab order
- Skip links for main content
- Focus indicators clearly visible
- All interactive elements accessible

### Screen Reader Support

- Meaningful alt text for images
- Proper heading structure
- ARIA labels where needed
- Form labels properly associated

### Color Accessibility

- Sufficient color contrast ratios
- Information not conveyed by color alone
- Support for high contrast mode
- Color-blind friendly palettes

## 📏 Spacing and Layout

### Grid System

- 12-column grid for desktop
- Flexible columns for mobile
- Consistent gutters
- Proper content margins

### Component Spacing

```css
--spacing-xs: 4px   /* Tight spacing */
--spacing-sm: 8px   /* Small spacing */
--spacing-md: 16px  /* Medium spacing */
--spacing-lg: 24px  /* Large spacing */
--spacing-xl: 32px  /* Extra large spacing */
```

## 🎨 Animation and Transitions

### Micro-interactions

- 200ms for hover effects
- 300ms for state changes
- 500ms for page transitions
- Ease-in-out timing function

### Loading Animations

- Smooth skeleton loading
- Progressive disclosure
- Staggered list animations
- Bounce effects for errors

## 📋 Component Checklist

Before creating or modifying any UI component:

- ✅ Follows Material-UI design principles
- ✅ Responsive across all breakpoints
- ✅ Accessible to keyboard and screen readers
- ✅ Consistent with established patterns
- ✅ Error states properly handled
- ✅ Loading states implemented
- ✅ Touch-friendly on mobile devices
- ✅ Proper color contrast ratios
- ✅ TypeScript types defined
- ✅ Documentation updated

This UI guideline ensures consistent, accessible, and professional user interfaces across the entire bakery inventory management system.
