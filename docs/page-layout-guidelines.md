# Page Layout Guidelines

## Overview

This document provides guidelines for maintaining consistent page layouts across the Bakery Inventory Management application. Following these guidelines ensures a cohesive user experience and makes the application more intuitive to use.

## Page Structure

### Header Area

All main pages should follow this header structure:

```jsx
<Box
  display="flex"
  flexDirection={{ xs: 'column', sm: 'row' }}
  justifyContent="space-between"
  alignItems={{ xs: 'flex-start', sm: 'center' }}
  mb={3}
  gap={2}
>
  <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <PageSpecificIcon color="primary" />
    Page Title
  </Typography>

  <Box display="flex" gap={1} width={{ xs: '100%', sm: 'auto' }}>
    {/* View Toggle Buttons (if applicable) */}
    <Box
      sx={{
        display: 'flex',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        mr: 1
      }}
    >
      <Tooltip title="List View">
        <IconButton
          color={viewMode === 'list' ? 'primary' : 'default'}
          onClick={() => setViewMode('list')}
          sx={{
            borderRadius: '4px 0 0 4px',
            bgcolor: viewMode === 'list' ? 'action.selected' : 'transparent'
          }}
        >
          <ListViewIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Card View">
        <IconButton
          color={viewMode === 'card' ? 'primary' : 'default'}
          onClick={() => setViewMode('card')}
          sx={{
            borderRadius: '0 4px 4px 0',
            bgcolor: viewMode === 'card' ? 'action.selected' : 'transparent'
          }}
        >
          <GridViewIcon />
        </IconButton>
      </Tooltip>
    </Box>
    
    {/* Primary Action Button */}
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={handlePrimaryAction}
      sx={{
        flexGrow: { xs: 1, sm: 0 },
        whiteSpace: 'nowrap'
      }}
    >
      {!isMobile ? 'Full Button Text' : 'Short'}
    </Button>
  </Box>
</Box>
```

### Search Bar Layout

Search bars should follow this structure for consistency:

```jsx
<Grid container spacing={2} alignItems="center">
  <Grid item xs={12} md={8}>
    <TextField
      fullWidth
      label="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        /* Optional end adornment for indicators */
      }}
      size="small"
      sx={{ minWidth: { xs: '100%', sm: 300 } }}
    />
  </Grid>
  {/* Additional filter controls can go here */}
</Grid>
```

## View Modes

### Toggle Buttons

Pages with multiple view modes should include toggle buttons in the header area:

- Always use `<ListViewIcon />` and `<GridViewIcon />` for consistency
- Position these buttons next to the primary action button (e.g., Add Recipe/Product)
- Group in a bordered box to indicate they belong together
- **Important**: Only include view toggle buttons in the header area, not in secondary locations. Avoid duplicate toggle buttons.

### Card View Layout

All cards should include proper avatars with appropriate icons as specified in the Page-Specific Icons section. Cards should follow this standardized structure across all product pages (Raw Materials, Intermediate Products, and Finished Products):

```jsx
<Card sx={{
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderLeft: item.isContaminated ? '4px solid #d32f2f' : 'none',
  position: 'relative',
  borderRadius: 2,
  '&:hover': { 
    boxShadow: 6,
    cursor: 'pointer'
  }
}}>
  <CardHeader
    avatar={
      <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 40, height: 40 }}>
        <PageSpecificIcon fontSize="small" />
      </Avatar>
    }
    title={
      <Typography
        variant="subtitle1"
        fontWeight="medium"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.2,
          height: 'auto',
        }}
      >
        {item.name}
      </Typography>
    }
    subheader={
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Batch: {item.batchNumber}
        </Typography>
      </Box>
    }
    action={null}
    sx={{ pb: 1 }}
  />
  
  <Divider />
  
  <CardContent sx={{ pt: 2, pb: 1, flexGrow: 1 }}>
    <Grid container spacing={2}>
      {/* Card content here with consistent Grid layout */}
      <Grid item xs={6}>
        <Typography variant="subtitle2" color="text.secondary">
          Available
        </Typography>
        <Typography variant="body1">
          {formatQuantity(item.quantity, item.unit)}
        </Typography>
      </Grid>
      
      {/* Additional grid items with standardized layout */}
    </Grid>
  </CardContent>

  <CardActions sx={{ px: 2, py: 1, justifyContent: 'space-between', bgcolor: 'background.default' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Status chips and indicators */}
      {isExpired(item.expirationDate) && (
        <Chip label="EXPIRED" size="small" sx={{ backgroundColor: theme => theme.palette.error.main, color: 'white', fontWeight: 'medium' }} />
      )}
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        size="small"
        color="error"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(item);
        }}
        aria-label="Delete item"
      >
        <Tooltip title="Delete item">
          <DeleteIcon fontSize="small" />
        </Tooltip>
      </IconButton>
    </Box>
  </CardActions>
</Card>
```

**Key Card Design Standards:**

1. Delete buttons should always be at the bottom in the CardActions component
2. No edit button should be included in the card (edit on click)
3. Page-specific icons must match the sidebar navigation panel standards
4. Status chips should be displayed in the CardActions area
5. Use Divider between CardHeader and CardContent

### Table/List View Layout

Table views should:

- Include enough spacing between action buttons to prevent misclicks
- Use a consistent column structure across similar pages
- Include appropriate pagination controls

```jsx
<Box sx={{ display: 'flex', gap: 2 }}>
  <IconButton
    size="small"
    onClick={(e) => {
      e.stopPropagation();
      handleAction();
    }}
    sx={{ p: 1 }}
  >
    <ActionIcon />
  </IconButton>
</Box>
```

## Responsive Behavior

1. **Mobile Layout:**
   - Stack header components vertically on xs screens
   - Use shortened button text or icon-only buttons when appropriate
   - Full-width search bars and buttons

2. **Tablet/Desktop Layout:**
   - Horizontal header with title and actions side-by-side
   - Fixed-width search bars (minimum 300px)
   - Standard button text labels

3. **Card/Grid View Behavior:**
   - xs: 1 card per row (full width)
   - sm: 2 cards per row
   - md: 3 cards per row
   - lg: 4 cards per row

## Page-Specific Icons

Use consistent icons for similar concepts across the application:

| Page Type | Icon Component | Description |
|-----------|---------------|-------------|
| Recipes | `<MenuBookIcon />` | Recipe management |
| Raw Materials | `<InventoryIcon />` | Raw materials inventory |
| Intermediate Products | `<KitchenIcon />` | Semi-processed ingredients |
| Finished Products | `<LocalDiningIcon />` | Final bakery products |
| Ingredients | `<ShoppingBasketIcon />` | General ingredients/materials |
| Dashboard | `<DashboardIcon />` | Analytics/overview |
| Settings | `<SettingsIcon />` | Configuration |
| Categories | `<CategoryIcon />` | Categorization |
| Storage | `<WarehouseIcon />` | Storage locations |

## Action Icons

Maintain consistent icons for actions:

| Action | Icon Component | Description |
|--------|---------------|-------------|
| Add | `<AddIcon />` | Create new items |
| Edit | `<EditIcon />` | Modify existing items |
| Delete | `<DeleteIcon />` | Remove items |
| View Details | `<VisibilityIcon />` | Inspect item details |
| Search | `<SearchIcon />` | Search functionality |
| Calculate | `<CalculateIcon />` | Cost analysis, calculations |
| Filter | `<FilterListIcon />` | Filter data |
| Settings | `<SettingsIcon />` | Configure options |

## Avatar Standards

For consistent visual recognition across the application, use these avatar standards:

### Page Title Icons

Icons next to page titles should use the appropriate icon from the Page-Specific Icons table with the following style:

```jsx
<Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <PageSpecificIcon color="primary" /> {/* Use color appropriate to the item type */}
  Page Title
</Typography>
```

### Card Avatars

Card avatars should use the appropriate icon with the following style and sizes:

```jsx
<Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
  <PageSpecificIcon fontSize="small" />
</Avatar>
```

### Avatar Color Standards

- **Recipes**: primary.main
- **Raw Materials**: secondary.main
- **Intermediate Products**: warning.main
- **Finished Products**: success.main
