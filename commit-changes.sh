#!/bin/bash

# Commit script for saving all changes
# Created: August 30, 2025

echo "🔍 Checking for changes..."
git status

echo "📝 Adding all changes..."
git add .

echo "💾 Committing changes..."
git commit -m "UI/UX improvements, API test fixes, and enhanced documentation

- Enhanced Finished Products table with Production Date and Storage Location columns
- Combined SKU and Batch into a single column for better space utilization
- Moved form buttons to top for better accessibility
- Created archive directory for unused files
- Added enhanced API testing scripts with server health checks
- Added comprehensive API testing documentation
- Updated MODULES.md with improved testing instructions
- Updated CHANGELOG.md with detailed version history
- Added development progress tracking system to planning.md
- Implemented mandatory unit testing requirements documentation"

echo "🚀 Changes committed successfully!"
echo "📤 You can now push changes with: git push origin main"
