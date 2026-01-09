#!/bin/bash

# SKU Reference Entity - Implementation Execution Script
# This script guides you through the implementation phases
# Run: bash EXECUTE_SKU_REFERENCE_FEATURE.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}SKU Reference Entity - Implementation Guide${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check we're on the right branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "feature/full-sku-reference-entity" ]; then
    echo -e "${YELLOW}⚠️  Warning: You're on branch '$current_branch'${NC}"
    echo -e "${YELLOW}   Expected: feature/full-sku-reference-entity${NC}"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✓ On correct branch: $current_branch${NC}"
echo ""

# Phase selection
echo "Select implementation phase:"
echo "1. Phase 1: Database Schema (2-3 hours)"
echo "2. Phase 2: Backend API (3-4 hours)"
echo "3. Phase 3: Frontend Implementation (4-5 hours)"
echo "4. Phase 4: Testing (2-3 hours)"
echo "5. Phase 5: Documentation (1 hour)"
echo "6. Phase 6: Final Review & Merge (1 hour)"
echo "7. Show full implementation plan"
echo "8. Run all tests"
echo "9. Exit"
echo ""
read -p "Enter phase number (1-9): " phase

case $phase in
    1)
        echo -e "${BLUE}================================================${NC}"
        echo -e "${BLUE}Phase 1: Database Schema${NC}"
        echo -e "${BLUE}================================================${NC}"
        echo ""
        echo "Tasks to complete:"
        echo "1. Update backend/prisma/schema.prisma"
        echo "   - Add fields to SkuMapping model"
        echo "   - Add relations to RawMaterial, FinishedProduct"
        echo "   - Update Category and StorageLocation models"
        echo ""
        echo "2. Run migration:"
        echo "   cd backend"
        echo "   npx prisma migrate dev --name add_full_sku_reference_entity"
        echo "   npx prisma generate"
        echo ""
        echo "3. Update seed data in backend/prisma/seed.ts"
        echo ""
        echo "4. Test migration:"
        echo "   npm run db:seed:force"
        echo "   npx prisma studio"
        echo ""
        echo -e "${YELLOW}📖 See SKU_REFERENCE_IMPLEMENTATION_PLAN.md for detailed schema changes${NC}"
        echo ""
        read -p "Press Enter to open implementation plan..."
        cat SKU_REFERENCE_IMPLEMENTATION_PLAN.md | less
        ;;
    
    2)
        echo -e "${BLUE}================================================${NC}"
        echo -e "${BLUE}Phase 2: Backend API${NC}"
        echo -e "${BLUE}================================================${NC}"
        echo ""
        echo "Tasks to complete:"
        echo "1. Create backend/src/controllers/skuReferenceController.ts"
        echo "2. Create backend/src/routes/skuReferenceRoutes.ts"
        echo "3. Register routes in backend/src/app.ts"
        echo "4. Update rawMaterialController.ts with prefill endpoint"
        echo ""
        echo -e "${RED}CRITICAL: Ensure all queries filter by clientId!${NC}"
        echo ""
        echo "Test with curl:"
        echo "  curl -H 'Authorization: Bearer TOKEN' http://localhost:8000/api/sku-references"
        echo ""
        echo -e "${YELLOW}📖 See SKU_REFERENCE_IMPLEMENTATION_PLAN.md for complete controller code${NC}"
        ;;
    
    3)
        echo -e "${BLUE}================================================${NC}"
        echo -e "${BLUE}Phase 3: Frontend Implementation${NC}"
        echo -e "${BLUE}================================================${NC}"
        echo ""
        echo "Tasks to complete:"
        echo "1. Create frontend/src/services/skuReferenceApi.ts"
        echo "2. Update frontend/src/pages/SkuReference.tsx (add CRUD)"
        echo "3. Update frontend/src/pages/RawMaterials.tsx (add template creation)"
        echo "4. Update navigation order in Layout component"
        echo ""
        echo "Start development servers:"
        echo "  ./start-with-data.sh"
        echo ""
        echo -e "${YELLOW}📖 See SKU_REFERENCE_IMPLEMENTATION_PLAN.md for detailed frontend code${NC}"
        ;;
    
    4)
        echo -e "${BLUE}================================================${NC}"
        echo -e "${BLUE}Phase 4: Testing${NC}"
        echo -e "${BLUE}================================================${NC}"
        echo ""
        echo "Create test files:"
        echo "1. backend/test-sku-reference-crud.js"
        echo "2. backend/test-sku-reference-integration.js"
        echo "3. backend/test-sku-reference-isolation.js"
        echo ""
        echo "Run tests:"
        echo "  cd backend"
        echo "  node test-sku-reference-crud.js"
        echo "  node test-sku-reference-integration.js"
        echo "  node test-sku-reference-isolation.js"
        echo ""
        read -p "Run all existing tests now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd backend
            npm test
            cd ..
        fi
        ;;
    
    5)
        echo -e "${BLUE}================================================${NC}"
        echo -e "${BLUE}Phase 5: Documentation${NC}"
        echo -e "${BLUE}================================================${NC}"
        echo ""
        echo "Update documentation:"
        echo "1. docs/api-reference.md (add SKU reference endpoints)"
        echo "2. README.md (add feature to list)"
        echo "3. Create SKU_REFERENCE_USER_GUIDE.md"
        echo "4. .github/copilot-instructions.md (add SKU reference info)"
        echo ""
        echo -e "${YELLOW}📖 See SKU_REFERENCE_IMPLEMENTATION_PLAN.md for documentation templates${NC}"
        ;;
    
    6)
        echo -e "${BLUE}================================================${NC}"
        echo -e "${BLUE}Phase 6: Final Review & Merge${NC}"
        echo -e "${BLUE}================================================${NC}"
        echo ""
        echo "Pre-merge checklist:"
        echo "□ All tests passing"
        echo "□ No console errors"
        echo "□ Multi-tenant isolation verified"
        echo "□ Documentation updated"
        echo "□ Code follows patterns"
        echo "□ No security vulnerabilities"
        echo ""
        echo "Ready to merge to main?"
        echo ""
        read -p "Show git status? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git status
            echo ""
            git diff --stat
        fi
        echo ""
        echo "Merge commands:"
        echo "  git add ."
        echo "  git commit -m 'feat: Add full SKU reference entity system'"
        echo "  git push origin feature/full-sku-reference-entity"
        echo "  git checkout main"
        echo "  git merge feature/full-sku-reference-entity"
        echo "  git push origin main"
        ;;
    
    7)
        echo -e "${BLUE}================================================${NC}"
        echo -e "${BLUE}Full Implementation Plan${NC}"
        echo -e "${BLUE}================================================${NC}"
        echo ""
        cat SKU_REFERENCE_IMPLEMENTATION_PLAN.md | less
        ;;
    
    8)
        echo -e "${BLUE}================================================${NC}"
        echo -e "${BLUE}Running All Tests${NC}"
        echo -e "${BLUE}================================================${NC}"
        echo ""
        cd backend
        npm test
        cd ..
        echo ""
        echo -e "${GREEN}✓ All tests completed${NC}"
        ;;
    
    9)
        echo "Exiting..."
        exit 0
        ;;
    
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo -e "${GREEN}================================================${NC}"
echo "1. Review the implementation plan: SKU_REFERENCE_IMPLEMENTATION_PLAN.md"
echo "2. Follow the phase-by-phase guide"
echo "3. Test thoroughly after each phase"
echo "4. Run this script again to move to the next phase"
echo ""
echo "Happy coding! 🚀"
echo ""
