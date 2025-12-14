#!/bin/bash
# Cleanup Script: Remove Temporal Documentation Files
# Created: 2025-12-14
# Purpose: Remove progress/status/summary files and agent prompts that are no longer needed

set -e

echo "🧹 Cleaning up temporal documentation files..."
echo ""

# Create archive directory for backup (just in case)
ARCHIVE_DIR="docs/archive-$(date +%Y%m%d)"
mkdir -p "$ARCHIVE_DIR"

# Count files to be deleted
TEMPORAL_FILES=(
  "API_TEST_FIXES_COMPLETE.md"
  "API_TEST_FIX_FINISHED_PRODUCT.md"
  "API_TEST_INDEX_FIX_REPORT.md"
  "CUSTOMER_ORDERS_BACKEND_TESTS_COMPLETE.md"
  "CUSTOMER_ORDERS_COMPLETE_REPORT.md"
  "CUSTOMER_ORDERS_FINAL_SUMMARY.md"
  "CUSTOMER_ORDERS_IMPLEMENTATION_STATUS.md"
  "CUSTOMER_ORDERS_PROGRESS.md"
  "CUSTOMER_ORDERS_TEST_SUITE_SUMMARY.md"
  "DOCUMENTATION_UPDATE_SUMMARY.md"
  "ENHANCED_RECIPE_UI_SUMMARY.md"
  "ENHANCED_UX_UI_COMPLETE.md"
  "ENHANCED_UX_UI_SUMMARY.md"
  "PERMISSION_SYSTEM_SUMMARY.md"
  "PRODUCTION_COST_FIX_COMPLETE.md"
  "PRODUCTION_SYSTEM_IMPROVEMENTS_SUMMARY.md"
  "PRODUCTION_SYSTEM_STATUS.md"
  "PRODUCTION_TRACKING_COMPLETE.md"
  "PROJECT-SUMMARY.md"
  "PROJECT_COMPLETION_SUMMARY.md"
  "PR_SUMMARY.md"
  "PUBLICATION_COMPLETE.md"
  "RAPIDPRO_MODERNIZATION_SUMMARY.md"
  "RAPIDPRO_PROJECT_COMPLETE.md"
  "RECIPE_COST_IMPLEMENTATION_SUMMARY.md"
  "ROLE_TEMPLATES_IMPLEMENTATION_COMPLETE.md"
  "ROLE_TEMPLATE_SYSTEM_COMPLETE.md"
  "STOCK_VALIDATION_FIX_COMPLETE.md"
  "SYSTEM_COMPLETION_REPORT.md"
  "SYSTEM_HEALTH_REPORT.md"
  "SYSTEM_STATUS_REPORT.md"
  "VERIFICATION-REPORT.md"
  "WORK-IN-PROGRESS-STATUS.md"
  "WORK_PROGRESS.md"
  "AGENT_CONTINUATION_PROMPT.md"
  "MULTI_TENANT_AUTH_PROMPT.md"
)

REVIEW_FILES=(
  "CHANGES_DOCUMENTATION.md"
  "CUSTOMER_ORDERS_API_TESTS_INTEGRATION.md"
  "CUSTOMER_ORDERS_UX_REDESIGN.md"
  "INGREDIENT_UNIT_FIX_DOCUMENTATION.md"
  "INVENTORY_DEDUCTION_FIX.md"
  "MULTI_BATCH_ALLOCATION_FIX.md"
  "NEXT_STEPS_CUSTOMER_ORDERS.md"
  "PERMISSION_TESTING.md"
  "PRODUCTION_COMPLETION_FIX.md"
  "PRODUCTION_QUANTITY_EXPLANATION.md"
  "PRODUCTION_STEPS_CUSTOMIZATION_FIX.md"
  "PUBLICATION_READY.md"
  "RECIPE_VALIDATION_ERROR_FIX.md"
  "ROUNDED_DESIGN_UPDATE.md"
  "SETUP-SCRIPTS.md"
  "SMART_RAW_MATERIALS_DOCUMENTATION.md"
  "TENANT_ISOLATION_FIX.md"
  "TEST_COVERAGE.md"
  "TEST_FAILURE_ANALYSIS.md"
)

echo "📦 Moving ${#TEMPORAL_FILES[@]} temporal files to archive..."
for file in "${TEMPORAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    mv "$file" "$ARCHIVE_DIR/"
    echo "  ✓ Archived: $file"
  fi
done

echo ""
echo "📦 Moving ${#REVIEW_FILES[@]} fix/implementation detail files to archive..."
for file in "${REVIEW_FILES[@]}"; do
  if [ -f "$file" ]; then
    mv "$file" "$ARCHIVE_DIR/"
    echo "  ✓ Archived: $file"
  fi
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  • Archived files: $(ls -1 $ARCHIVE_DIR | wc -l)"
echo "  • Location: $ARCHIVE_DIR"
echo "  • Remaining docs: $(ls -1 *.md 2>/dev/null | wc -l)"
echo ""
echo "💡 Tip: Review archived files in $ARCHIVE_DIR"
echo "        Delete the archive directory if you don't need them."
