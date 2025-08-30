# Icon Standards for Bakery Inventory App

This document outlines the standardized icon usage across the application to ensure consistency and improve user experience.

## Navigation Icons

These icons are used in both the collapsible sidebar and throughout the application for consistent navigation:

| Feature | Icon Component | Description |
|---------|---------------|-------------|
| Dashboard | `<DashboardIcon />` | Main dashboard view |
| Raw Materials | `<InventoryIcon />` | Raw materials inventory management |
| Intermediate Products | `<KitchenIcon />` | Semi-finished products in production |
| Finished Products | `<LocalDiningIcon />` | Ready-to-sell bakery products |
| Recipes | `<MenuBookIcon />` | Recipes and formulations |
| Production | `<FactoryIcon />` | Production planning and execution |
| Contamination | `<WarningIcon />` | Food safety and contamination tracking |
| Reports | `<AssessmentIcon />` | Data analysis and reporting |
| Settings | `<SettingsIcon />` | Application configuration |
| API Test | `<ScienceIcon />` | API testing functionality |

## Additional Icons

| Purpose | Icon Component | Description |
|---------|---------------|-------------|
| Currency/Cost | `<MoneyIcon />` or `<AttachMoney />` | Financial indicators |
| Calendar/Schedule | `<ScheduleIcon />` | Date-related information |
| Alerts/Errors | `<ErrorIcon />` | Critical alerts |
| Warnings | `<WarningIcon />` | Warning alerts |
| Edit | `<EditIcon />` | Edit functionality |
| Refresh | `<RefreshIcon />` | Refresh data |
| Completed | `<CheckCircleIcon />` | Success indicators |
| Expand/Collapse | `<ChevronLeftIcon />` / `<ChevronRightIcon />` | UI expansion controls |

## Implementation Notes

1. The sidebar now supports collapsible functionality for better screen utilization
2. When collapsed, tooltips display the menu item names
3. All navigation buttons and cards use consistent icons across the application
4. Dashboard quick actions use the same icons as the corresponding sidebar items

## Usage Guidelines

1. Always import icons from Material-UI: `import { IconName } from '@mui/icons-material'`
2. Use the standard icon for each feature across all components
3. For new features, consult this document and select an appropriate existing icon or propose a new standard
4. When the sidebar is collapsed, ensure that your page has clear headers since the context from the sidebar is minimized
