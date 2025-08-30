# Changelog

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

- Added comprehensive development progress tracking to planning.md
- Added mandatory unit testing requirements to documentation
- Updated coding guidelines to emphasize test-driven development
- Implemented structured development tracking for all completed features
- Ensured ApiTest.tsx page remains intact for diagnostic purposes

### Documentation

- Updated MODULES.md with improved backend testing instructions
- Created detailed API testing troubleshooting guide
- Added code guidelines compliance documentation
- Updated deployment instructions
