# UI/UX Design Guidelines for Bakery App

This document outlines the established UI/UX patterns and design decisions for the bakery inventory management application to maintain consistency across all components and views.

## Status Indicators

### Quality Status Indicators

- **Display Style**: Outlined chips with colored borders
- **Text Color**: Same as the border color
- **Border Width**: 1.5px for better visibility
- **Font Weight**: Medium for improved readability
- **Usage**: Used in both card and table views to show product quality status

```jsx
// Example implementation
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

### Expiration Status Indicators

#### Expired Products (Critical)

- **Display Style**: Filled chip with colored background
- **Background Color**: Error color (red)
- **Text Color**: White
- **Font Weight**: Medium
- **Usage**: Used to prominently highlight expired products

```jsx
// Example implementation
<Chip 
  label="EXPIRED" 
  size="small" 
  sx={{ 
    backgroundColor: theme => theme.palette.error.main, 
    color: 'white', 
    fontWeight: 'medium' 
  }} 
/>
```

#### Expiring Soon Products (Warning)

- **Display Style**: Text-only indicator (no chip)
- **Text Color**: Warning color (amber/orange)
- **Font Weight**: Medium
- **Format**: "X days remaining"
- **Usage**: Displayed below the expiration date

```jsx
// Example implementation
<Typography 
  variant="caption" 
  color="warning.main" 
  fontWeight="medium" 
  sx={{ display: 'block' }}
>
  {days} days remaining
</Typography>
```

### Stock Status Indicators

#### Out of Stock (Critical)

- **Display Style**: Text-only with emphasis
- **Text Color**: Error color (red)
- **Font Weight**: Bold
- **Text**: "Out of Stock"

```jsx
// Example implementation
<Typography sx={{ color: 'error.main', fontWeight: 'bold' }}>
  Out of Stock
</Typography>
```

#### Low Stock (Warning)

- **Display Style**: Regular quantity display with subtle emphasis
- **Text Color**: Warning color (amber/orange)
- **Font Weight**: Bold
- **Additional Style**: Bottom border in warning color
- **Content**: Actual quantity with unit

```jsx
// Example implementation
<Typography
  sx={{
    fontWeight: 'bold',
    color: 'warning.main',
    borderBottom: '1px solid',
    borderColor: 'warning.main'
  }}
>
  {formatQuantity(product.quantity, product.unit)}
</Typography>
```

#### Normal Stock

- **Display Style**: Regular text
- **Text Color**: Default text color
- **Content**: Actual quantity with unit

## Layout Guidelines

### Card View

#### Card Structure

```text
┌─────────────────────────────┐
│ Product Name + Contamination│  ← Header 
│ SKU + Batch                 │
├─────────────────────────────┤
│                             │
│ Product Details Grid        │  ← Content
│ (Available, Price, etc.)    │
│                             │
├─────────────────────────────┤
│ [Status][Expiry] │ [Actions]│  ← Bottom Bar
└─────────────────────────────┘
```

- **CardHeader**: Contains product name and contamination status
- **CardContent**: Contains product details in a grid layout
- **CardActions**: Contains status indicators (quality, expiration) and action buttons

### Table View

#### Column Organization

- **Product Column**: Shows product name, contamination status, and category
- **Quantity Column**: Shows quantity with appropriate stock status styling
- **Expiration Column**: Shows date and expiration status (if applicable)
- **Quality Column**: Shows quality status chip
- **Actions Column**: Contains action buttons

## General Principles

1. **Visual Hierarchy**
   - Critical alerts (expired, out of stock) use stronger visual indicators
   - Warnings (low stock, expiring soon) use moderate emphasis
   - Normal status uses minimal styling

2. **Consistency**
   - Similar information is displayed in similar ways across different views
   - Status indicators follow consistent patterns based on severity

3. **Information Density**
   - Avoid redundant information (e.g., showing category only once)
   - Group related information together

4. **Accessibility**
   - Ensure adequate color contrast
   - Don't rely solely on color to convey information
   - Use text labels alongside visual indicators

5. **Responsiveness**
   - Mobile views may hide less critical information
   - Maintain core functionality and critical alerts on all device sizes

## Best Practices for Future Development

1. Use the established patterns for new components or features
2. Maintain the visual hierarchy for different alert levels
3. Avoid introducing new styles for similar types of information
4. When in doubt, refer to this guide and existing implementation
5. Document any new UI/UX patterns that are introduced
