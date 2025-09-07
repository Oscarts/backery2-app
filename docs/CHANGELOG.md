# Changelog

## Unreleased

### Critical Bug Fixes

- **🔧 FIXED: Production Capacity Calculation (Sept 7, 2025)**
  - Fixed `maxBatches` calculation in "What Can I Make" analysis
  - Was hardcoded to 1 batch for all recipes, now properly calculates based on ingredient availability
  - Implemented limiting ingredient analysis (finds ingredient that runs out first)
  - **Impact**: 50x improvement in production capacity accuracy (e.g., 500kg vs 10kg for bread dough)
  - Added comprehensive unit tests to prevent regression
  - See: `/docs/fixes/production-capacity-calculation-fix.md` for detailed analysis

### Bug Fixes

- Fixed "What Can I Make" page white screen issue:
  - Updated backend API response format to match frontend expectations
  - Added validation test to ensure API response structure consistency
  - Improved error handling and logging for recipe ingredients
  - Added support for recipes with missing ingredients

### Frontend Improvements

- Enhanced Recipe Selection Dialog with proper availability indicators:
  - Red/green visual cues for recipe availability
  - Disabled interaction for unavailable recipes
  - Clear shortage information display
  - Accurate batch count display: "(50 batches possible)" instead of hardcoded values

### Documentation

- Added comprehensive API response validation guidelines
- Updated data persistence documentation with best practices
- Enhanced development guidelines for handling nullable values
- Created testing guidelines for API response structure validation

### UI Improvements

- Updated IntermediateProducts page to match FinishedProducts page UI:
  - Added responsive view toggle (list/card view)
  - Improved KPI cards with icons and visual indicators
  - Enhanced header layout and filter components
  - Added contamination status indicator below category
  - Implemented card view for mobile devices
  - Updated form dialog with actions at top per UI guidelines
  - Updated search functionality to match finished products page
  - Replaced category filter with search by attribute functionality
  - **Added clickable KPI cards for smart filtering**
  - **Implemented indicator filtering by expiration status and production status**

- Updated RawMaterials page to match FinishedProducts page UI:
  - Added responsive view toggle (list/card view)
  - Added KPI cards with icons showing key metrics
  - Enhanced header layout and added mobile-friendly controls
  - Updated filter components to use search by attribute
  - Removed category dropdown filter
  - Added contamination status indicator below category
  - Improved expiration date display
  - Added card view for mobile devices
  - **Added clickable KPI cards for smart filtering**
  - **Implemented indicator filtering by expiration, low stock, and contamination**

- Updated UI guidelines with inventory page patterns based on Finished Products page
- Added standardized contamination status display patterns for table and card views
- Optimized contamination status display to save column space in tables
- Enhanced card view with consistent status indicators at the bottom
- Updated Intermediate Products page to match UI guidelines:
  - Added responsive dual-view toggle (list/card views)
  - Implemented KPI cards at the top of the page
  - Added mobile-friendly filters with drawer interface
  - Updated contamination status display pattern
  - Improved form dialog with actions at the top

### Development Environment

- Added `run.sh` script for automated project setup:
  - One-command installation and configuration
  - Automatic dependency installation
  - Database setup and seeding
  - Development server startup
  - Environment configuration
  - Improved developer experience with clear error handling

## Previous Changes

### UI Consistency

- Standardized Finished Products page header and layout margins to match other pages:
  - Container now uses `maxWidth="xl"` with `mt: 4, mb: 4`
  - Title uses `<Typography variant="h4" component="h1">` without custom font overrides
  - Aligns with conventions documented in `docs/ui-guidelines.md`

### Finished Products Filters

- Simplified filters: removed Category and Expiration dropdowns
- Added a single "Search By" selector (All Attributes, Product, SKU, Batch) + search box
- Updated filtering logic accordingly

### Finished Products Indicators

- Adjusted top indicators layout to fill available width at xs/sm/md
- Made indicators clickable to act as quick filters (toggle behavior):
  - Total Products → clears indicator filter
  - Expiring Soon → filters to expiring soon
  - Low Stock → filters to low stock

### Finished Products Production Status

- Added Production Status display to Finished Products:
  - Table view: new Status column (desktop)
  - Card view: Moved status indicator to the card footer next to other alerts
- Status display changed to a subtle colored dot with tooltip (less aggressive)
- Status values and colors mirror Intermediate Products:
  - IN_PRODUCTION (primary), COMPLETED (success), ON_HOLD (warning), DISCARDED (error)
- Types updated with a shared `ProductionStatus` alias for consistency
- Create/Edit Form: Added a "Production Status" select with default "In Production"

### Feature Removal: Reservations (Finished Products)

- Removed the "Reserved Items" indicator from Finished Products page
- Deprecated reservation functionality across the app:
  - Frontend: Hide/remove any reserved counts and actions on Finished Products
  - API: Marked `PUT /finished-products/:id/reserve` and `PUT /finished-products/:id/release` as deprecated (removal planned)
  - Data model: `reserved`/`reservedQuantity` considered deprecated; future API responses will not include these fields
  - Documentation updated (API Reference, Feature Scope, Technical Architecture)

## Version 1.0.0 (2025-08-30)

### UI/UX Improvements

- **Finished Products Table**:
  - Added Production Date and Storage Location columns
  - Combined SKU and Batch into a single column for better space utilization
  - Improved mobile view with additional information in card layout

- **Edit Product Dialog**:
  - Moved Update and Cancel buttons to the top of the form for better accessibility
  - Users no longer need to scroll to the bottom to save changes

### Code Cleanup

- Moved unused or backup files to archive directory
  - Dashboard_new.tsx
  - IntermediateProducts_backup.tsx
  - IntermediateProducts_broken.tsx
  - RawMaterialsNew.tsx

### Testing

- Verified API Tests
- Created enhanced test scripts with server health checks
- Added comprehensive troubleshooting guide in `api-test-troubleshooting.md`
- Created improved test pattern in `test-quality-status-enhanced.js`
- Identified and documented solution for the 24 failing tests

### Documentation Enhancements

- Created comprehensive docs folder with 6 essential documents
- Reorganized all documentation into clear, purpose-driven structure
- Added mandatory development guidelines with testing requirements
- Implemented structured development progress tracking
- Consolidated scattered documentation into unified system
- Moved legacy documentation to archive for reference
- Ensured ApiTest.tsx page remains intact for diagnostic purposes

### Documentation

- Updated MODULES.md with improved backend testing instructions
- Created detailed API testing troubleshooting guide
- Added code guidelines compliance documentation
- Updated deployment instructions
