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

All cards should include proper avatars with appropriate icons as specified in the Page-Specific Icons section. Cards should follow this structure:

```jsx
<Card sx={{
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 6,
    cursor: 'pointer'
  }
}}>
  <CardHeader
    avatar={
      <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
        <ItemIcon fontSize="small" />
      </Avatar>
    }
    title={
      <Typography variant="subtitle1" fontWeight="medium" noWrap>
        {item.name}
      </Typography>
    }
    subheader={
      <Typography variant="body2" color="text.secondary" noWrap>
        {item.category || 'Uncategorized'}
      </Typography>
    }
    sx={{ pb: 1 }}
  />
  <CardContent sx={{ flexGrow: 1, pt: 0 }}>
    {/* Card content here */}
  </CardContent>
  <Divider />
  <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
    {/* Action buttons with sufficient spacing */}
    <Button
      size="small"
      startIcon={<ActionIcon />}
      sx={{ minWidth: 90 }}
      onClick={(e) => {
        e.stopPropagation();
        handleAction();
      }}
    >
      Action
    </Button>
  </CardActions>
</Card>
```

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
| Finished Products | `<InventoryIcon />` | Product inventory |
| Ingredients | `<ShoppingBasketIcon />` | Ingredients/materials |
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
