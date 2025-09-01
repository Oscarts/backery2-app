# UI Guidelines

## 🎨 Design System Overview

This document establishes UI/UX patterns and design standards for the bakery inventory management application to ensure consistency across all components and views.

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

**Display Style:** Error-colored chips with warning icon

```jsx
<Chip
  icon={<WarningIcon />}
  label="CONTAMINATED"
  size="small"
  color="error"
  variant="filled"
/>
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
#### Production Status Field (Finished Products)

 
 
 
- Include a "Production Status" select when creating or editing Finished Products
- Default to "In Production"
- Use the same status set as Intermediate Products for consistency


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

## 📱 Mobile-First Design Patterns

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
