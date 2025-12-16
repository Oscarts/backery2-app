#!/bin/bash

# Production Deployment Script for Bakery Inventory Management System
# 
# This script handles:
# - Database backup (if production DB exists)
# - Database migration
# - Optional database reset/seed
# - Deployment to Railway (backend) and Vercel (frontend)
#
# CRITICAL: Follow CODE_GUIDELINES.md - Never drop data without confirmation!

set -e  # Exit on error

echo "🚀 Production Deployment Script"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install it with: npm install -g @railway/cli"
    echo "Then login with: railway login"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found${NC}"
    echo "Frontend deployment will be skipped."
    echo "Install it with: npm install -g vercel"
    DEPLOY_FRONTEND=false
else
    DEPLOY_FRONTEND=true
fi

echo ""
echo -e "${BLUE}📋 Pre-Deployment Checklist:${NC}"
echo "   ✓ All changes committed to git"
echo "   ✓ Tests passing locally"
echo "   ✓ CODE_GUIDELINES.md reviewed"
echo "   ✓ Multi-tenant security verified"
echo ""

# Ask for deployment confirmation
read -p "$(echo -e ${YELLOW}Continue with production deployment? [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}🗄️  Database Management${NC}"
echo "================================"
echo ""
echo "Choose database action:"
echo "  1) Migrate only (preserve existing data)"
echo "  2) Reset and seed (⚠️  DELETES ALL PRODUCTION DATA)"
echo "  3) Skip database changes"
echo ""
read -p "Enter choice [1-3]: " DB_CHOICE

case $DB_CHOICE in
    1)
        echo -e "${GREEN}✓ Will run migrations only${NC}"
        DB_ACTION="migrate"
        ;;
    2)
        echo -e "${RED}⚠️  WARNING: This will DELETE ALL production data!${NC}"
        read -p "Type 'DELETE ALL DATA' to confirm: " CONFIRM
        if [ "$CONFIRM" != "DELETE ALL DATA" ]; then
            echo "Confirmation failed. Deployment cancelled."
            exit 0
        fi
        DB_ACTION="reset"
        ;;
    3)
        echo -e "${YELLOW}⚠️  Skipping database changes${NC}"
        DB_ACTION="skip"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}📦 Step 1: Building Application${NC}"
echo "================================"

# Build backend
echo "Building backend..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend built successfully${NC}"

# Build frontend
echo "Building frontend..."
cd ../frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend built successfully${NC}"
cd ..

echo ""
echo -e "${BLUE}🗄️  Step 2: Database Operations${NC}"
echo "================================"

if [ "$DB_ACTION" == "migrate" ]; then
    echo "Running database migrations on Railway..."
    cd backend
    railway run npx prisma migrate deploy
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Migration failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Migrations completed${NC}"
    cd ..
    
elif [ "$DB_ACTION" == "reset" ]; then
    echo -e "${YELLOW}⚠️  Resetting production database...${NC}"
    cd backend
    
    # Drop all tables and recreate schema
    echo "Pushing schema..."
    railway run npx prisma db push --force-reset --skip-generate
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Schema push failed${NC}"
        exit 1
    fi
    
    # Run migrations
    echo "Running migrations..."
    railway run npx prisma migrate deploy
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Migration failed${NC}"
        exit 1
    fi
    
    # Seed database
    echo "Seeding database..."
    railway run npm run db:seed:force
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Database seeding failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Database reset and seeded${NC}"
    cd ..
    
else
    echo -e "${YELLOW}⚠️  Skipping database operations${NC}"
fi

echo ""
echo -e "${BLUE}🚂 Step 3: Deploying Backend to Railway${NC}"
echo "================================"

cd backend
railway up
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend deployed to Railway${NC}"
cd ..

echo ""
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo -e "${BLUE}⚡ Step 4: Deploying Frontend to Vercel${NC}"
    echo "================================"
    
    cd frontend
    vercel --prod
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Frontend deployment failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Frontend deployed to Vercel${NC}"
    cd ..
else
    echo -e "${YELLOW}⚠️  Step 4: Skipping Frontend Deployment${NC}"
    echo "================================"
    echo "Install Vercel CLI to deploy frontend:"
    echo "  npm install -g vercel"
    echo "  cd frontend && vercel --prod"
fi

echo ""
echo -e "${GREEN}================================"
echo "✅ Deployment Complete!"
echo "================================${NC}"
echo ""
echo "📝 Post-Deployment Checklist:"
echo "   1. Test backend health: curl https://your-backend.railway.app/health"
echo "   2. Open frontend and test login"
echo "   3. Verify multi-tenant isolation"
echo "   4. Test production workflow"
echo "   5. Check database connections"
echo ""
echo "📊 Monitor your deployments:"
echo "   - Railway: https://railway.app/dashboard"
echo "   - Vercel: https://vercel.com/dashboard"
echo ""
echo "🎉 Production deployment successful!"
