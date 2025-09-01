# Changelog

## Unreleased

### UI Consistency

- Standardized Finished Products page header and layout margins to match other pages:
  - Container now uses `maxWidth="xl"` with `mt: 4, mb: 4`
  - Title uses `<Typography variant="h4" component="h1">` without custom font overrides
  - Aligns with conventions documented in `docs/ui-guidelines.md`

### Finished Products Filters

- Simplified filters: removed Category and Expiration dropdowns
- Added a single "Search By" selector (All Attributes, Product, SKU, Batch) + search box
- Updated filtering logic accordingly

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
