#!/bin/bash

# Commit script for saving all changes
# Created: August 30, 2025

echo "🔍 Checking for changes..."
git status

echo "📝 Adding all changes..."
git add .

echo "💾 Committing changes..."
git commit -m "UI/UX improvements, documentation restructure, and enhanced development standards

- Enhanced Finished Products table with Production Date and Storage Location columns
- Combined SKU and Batch into a single column for better space utilization
- Moved form buttons to top for better accessibility
- Created comprehensive docs folder with 6 essential documents
- Reorganized all documentation into clear, purpose-driven structure
- Added mandatory development guidelines with testing requirements
- Implemented structured development progress tracking
- Moved legacy documentation to archive for reference
- Updated project README with new documentation structure"

echo "🚀 Changes committed successfully!"
echo "📤 You can now push changes with: git push origin main"
