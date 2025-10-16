# RapidPro Design System Documentation

## Overview

This document outlines the design system for the RapidPro Production Planning application. All components and pages should follow these guidelines to maintain consistency across the application.

## Brand Identity

### Logo

The RapidPro logo consists of:
- **Icon**: Speed/dashboard icon in a navy blue gradient box
- **Text**: "RapidPro" with "Production Planning" subtitle
- **Variants**:
  - `full`: Icon + text (use in headers)
  - `icon-only`: Just the icon (use in compact spaces)
  - `text-only`: Just text (use when icon is redundant)

**Usage**:
```tsx
import RapidProLogo from '../components/Brand/RapidProLogo';

<RapidProLogo size="medium" variant="full" />
```

### Color Palette

#### Primary Colors
- **Navy Blue** (Primary): `#0D3B66`
  - Light: `#1565C0`
  - Dark: `#002171`
  - Use for: Main actions, primary UI elements, branding

- **Orange** (Secondary): `#FF8E53`
  - Light: `#FFAB91`
  - Dark: `#E64A19`
  - Use for: Accents, highlights, call-to-action elements

#### Semantic Colors
- **Success**: `#4CAF50` - Confirmations, successful operations
- **Error**: `#F44336` - Errors, destructive actions
- **Warning**: `#FFA726` - Warnings, caution states
- **Info**: `#29B6F6` - Information, neutral notifications

#### Neutral Colors
- **Text Primary**: `#212121`
- **Text Secondary**: `#616161`
- **Background**: `#F8F9FA`
- **Paper**: `#FFFFFF`

## Typography

### Font Family
- **Primary**: Inter, Roboto, Helvetica, Arial, sans-serif
- **Monospace**: Roboto Mono, Courier New, monospace

### Scale

| Level | Size | Weight | Use Case |
|-------|------|--------|----------|
| H1 | 2.25rem (36px) | 600 | Page titles (rare) |
| H2 | 1.875rem (30px) | 600 | Major section headers |
| H3 | 1.5rem (24px) | 500 | Section headers |
| H4 | 1.25rem (20px) | 500 | Subsection headers, card titles |
| H5 | 1.125rem (18px) | 500 | Small headers |
| H6 | 1rem (16px) | 500 | Smallest headers |
| Body 1 | 1rem (16px) | 400 | Regular text |
| Body 2 | 0.875rem (14px) | 400 | Secondary text |
| Caption | 0.75rem (12px) | 400 | Small labels, hints |

### Line Height
- **Tight** (1.2): Headlines
- **Normal** (1.5): Body text
- **Relaxed** (1.75): Long-form content

## Spacing

Based on 8px grid system:

| Token | Value | Use Case |
|-------|-------|----------|
| 0.5 | 4px | Minimal spacing |
| 1 | 8px | Tight spacing |
| 2 | 16px | Default spacing |
| 3 | 24px | Section spacing |
| 4 | 32px | Large spacing |
| 6 | 48px | Extra large spacing |

## Border Radius

Modern rounded design system:

| Token | Value | Use Case |
|-------|-------|----------|
| sm | 8px | Small elements, tooltips |
| base | 12px | Buttons, inputs, chips, default components |
| md | 16px | Cards, panels, containers |
| lg | 20px | Large cards, dialogs, prominent elements |
| xl | 24px | Hero sections, feature cards |
| 2xl | 32px | Extra large elements |
| full | 9999px | Pills, fully rounded avatars |

**Usage**:
```tsx
import { borderRadius } from '../theme/designTokens';

<Card sx={{ borderRadius: borderRadius.md }}> // 16px
<Button sx={{ borderRadius: borderRadius.base }}> // 12px
<Dialog sx={{ borderRadius: borderRadius.lg }}> // 20px
```

## Components

### Buttons

#### Primary Button
- **Style**: Solid background, primary color
- **Use**: Main actions (Save, Create, Submit)
- **Position**: Top-right of sections

```tsx
import { PrimaryButton } from '../components/Common/StandardButtons';

<PrimaryButton onClick={handleSubmit}>
  Save Changes
</PrimaryButton>
```

#### Secondary Button
- **Style**: Outlined, primary color
- **Use**: Alternative actions (Cancel, Back)

```tsx
import { SecondaryButton } from '../components/Common/StandardButtons';

<SecondaryButton onClick={handleCancel}>
  Cancel
</SecondaryButton>
```

#### Create Button
- **Style**: Primary button with Add icon
- **Use**: Creating new items
- **Position**: Always top-right of list/table pages

```tsx
import { CreateButton } from '../components/Common/StandardButtons';

<CreateButton onClick={handleCreate}>
  Add Recipe
</CreateButton>
```

### Page Header

Every page should start with a `PageHeader` component:

```tsx
import PageHeader from '../components/Common/PageHeader';
import { MenuBook as MenuBookIcon } from '@mui/icons-material';

<PageHeader
  title="Recipes"
  subtitle="Manage your production recipes"
  icon={<MenuBookIcon />}
  onRefresh={handleRefresh}
  refreshing={isRefreshing}
  actions={
    <CreateButton onClick={handleCreate}>
      Add Recipe
    </CreateButton>
  }
/>
```

### Cards

#### Base Card Styling
- **Border Radius**: 16px (`md`) - Modern rounded corners
- **Shadow**: Elevation 1-2 by default
- **Padding**: 16-24px depending on content
- **Hover**: Slight lift and shadow increase

```tsx
<Card
  sx={{
    p: 3,
    borderRadius: borderRadius.md, // 16px - Modern rounded
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 6,
    },
  }}
>
  {/* Content */}
</Card>
```

### Tables

- **Header**: Bold text, light gray background
- **Rows**: Hover effect
- **Borders**: Subtle gray dividers
- **Pagination**: Bottom of table

### Forms

#### Field Spacing
- Vertical margin: 16px (`2`)
- Grid gap: 16px (`2`)

#### Field Width
- Full width in mobile
- Appropriate columns in desktop (Grid with xs/sm/md/lg)

#### Validation
- Error state: Red border + helper text
- Required fields: Asterisk in label

## Layout Patterns

### Page Structure

```tsx
<Box>
  <PageHeader
    title="Page Title"
    subtitle="Description"
    icon={<Icon />}
    actions={<CreateButton />}
  />
  
  <Box sx={{ mb: 3 }}>
    {/* Search and filters */}
  </Box>
  
  <Box>
    {/* Main content: table, cards, or grid */}
  </Box>
</Box>
```

### Grid System

Use Material-UI Grid with 12-column layout:

```tsx
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    {/* Content */}
  </Grid>
</Grid>
```

### Breakpoints
- **xs**: 0px (mobile)
- **sm**: 600px (tablet portrait)
- **md**: 960px (tablet landscape / small desktop)
- **lg**: 1280px (desktop)
- **xl**: 1920px (large desktop)

## Responsive Design

### Mobile First Approach

1. Design for mobile (320px+) first
2. Enhance for tablet (768px+)
3. Optimize for desktop (1024px+)

### Touch Targets
- Minimum 44x44px for touch
- Adequate spacing between interactive elements

### Navigation
- Hamburger menu on mobile
- Collapsible sidebar on desktop
- Bottom navigation for key actions (optional)

## Accessibility

### Requirements
- WCAG 2.1 AA compliance minimum
- Color contrast ratio: 4.5:1 for text
- Keyboard navigation support
- ARIA labels for screen readers
- Focus indicators visible

### Best Practices
- Use semantic HTML
- Provide alt text for images
- Label form inputs properly
- Ensure logical tab order

## Animation & Transitions

### Duration
- **Fast**: 150ms - Micro-interactions
- **Base**: 200ms - Default (buttons, hover)
- **Slow**: 300ms - Complex transitions
- **Slower**: 500ms - Page transitions

### Easing
- **easeOut**: Most UI transitions
- **easeInOut**: Smooth movements
- **easeIn**: Exit animations

```tsx
sx={{
  transition: 'all 0.2s ease-out',
}}
```

## Icon Usage

### Icon Library
Material-UI Icons (imported from `@mui/icons-material`)

### Guidelines
- Use filled icons for active/selected states
- Use outlined icons for inactive states
- Consistent size within context
- Pair with text when possible for clarity

## Best Practices

### Do's ✅
- Use design tokens from `designTokens.ts`
- Follow the Recipe page as the reference design
- Maintain consistent button positions across similar pages
- Use PageHeader component on every page
- Test on mobile, tablet, and desktop
- Keep spacing consistent (8px grid)
- Use semantic color names

### Don'ts ❌
- Don't hardcode color values
- Don't mix different design patterns
- Don't create custom buttons without reason
- Don't ignore responsive breakpoints
- Don't skip accessibility considerations
- Don't use inline styles for theming

## Reference Implementation

The **Recipes page** (`/recipes`) serves as the gold standard for:
- Module structure and card design
- Button styling and placement
- Typography hierarchy
- Spacing and layout rhythm
- Responsive behavior
- Interactive elements

Study this page when implementing new features or pages.

## Maintenance

### Adding New Components
1. Follow existing patterns
2. Use design tokens
3. Make it responsive
4. Test accessibility
5. Document usage

### Updating Design System
1. Update `designTokens.ts` first
2. Update `theme.ts` if needed
3. Update this documentation
4. Communicate changes to team
5. Update affected components

## Resources

- **Figma**: [Design files link]
- **Tokens**: `/src/theme/designTokens.ts`
- **Theme**: `/src/theme/theme.ts`
- **Components**: `/src/components/`
- **Logo**: `/src/components/Brand/RapidProLogo.tsx`

---

Last Updated: October 16, 2025
Version: 1.0.0
