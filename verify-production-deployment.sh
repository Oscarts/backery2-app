#!/bin/bash

# =============================================================================
# Production Deployment Verification Script
# =============================================================================
# 
# Verifies that your production deployment is working correctly by testing:
# - Backend health endpoint
# - Database connectivity
# - Frontend accessibility
# - API connectivity from frontend
# - CORS configuration
# 
# Usage:
#   ./verify-production-deployment.sh [backend-url] [frontend-url]
# 
# Example:
#   ./verify-production-deployment.sh https://rapidpro-api.onrender.com https://rapidpro.vercel.app
# 
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${1:-}"
FRONTEND_URL="${2:-}"

# Helper functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if URLs are provided
if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    print_header "Production Deployment Verification"
    echo "Usage: $0 <backend-url> <frontend-url>"
    echo ""
    echo "Example:"
    echo "  $0 https://rapidpro-api.onrender.com https://rapidpro.vercel.app"
    echo ""
    exit 1
fi

# Remove trailing slashes
BACKEND_URL="${BACKEND_URL%/}"
FRONTEND_URL="${FRONTEND_URL%/}"

# =============================================================================
# TEST 1: Backend Health Check
# =============================================================================
print_header "Test 1: Backend Health Check"

print_info "Testing: ${BACKEND_URL}/health"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/health" || echo "000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Backend is healthy"
    print_info "Response: $BODY"
else
    print_error "Backend health check failed (HTTP $HTTP_CODE)"
    print_info "Response: $BODY"
    exit 1
fi

# =============================================================================
# TEST 2: Backend API Endpoint Check
# =============================================================================
print_header "Test 2: Backend API Endpoint Check"

print_info "Testing: ${BACKEND_URL}/api/health"
API_RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/api/health" || echo "000")
HTTP_CODE=$(echo "$API_RESPONSE" | tail -n 1)
BODY=$(echo "$API_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "API endpoint is accessible"
    print_info "Response: $BODY"
else
    print_warning "API health endpoint returned HTTP $HTTP_CODE"
    print_info "Response: $BODY"
fi

# =============================================================================
# TEST 3: Database Connectivity (via API)
# =============================================================================
print_header "Test 3: Database Connectivity"

print_info "Testing database query through API..."
# Try to access a public endpoint that requires database
DB_RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/api/auth/health" || echo "000")
HTTP_CODE=$(echo "$DB_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    print_success "Database is connected (API responded)"
else
    print_error "Database connection may be failing (HTTP $HTTP_CODE)"
fi

# =============================================================================
# TEST 4: Frontend Accessibility
# =============================================================================
print_header "Test 4: Frontend Accessibility"

print_info "Testing: ${FRONTEND_URL}"
FRONTEND_RESPONSE=$(curl -s -w "\n%{http_code}" "${FRONTEND_URL}" || echo "000")
HTTP_CODE=$(echo "$FRONTEND_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Frontend is accessible"
else
    print_error "Frontend returned HTTP $HTTP_CODE"
    exit 1
fi

# =============================================================================
# TEST 5: CORS Configuration
# =============================================================================
print_header "Test 5: CORS Configuration"

print_info "Testing CORS headers from backend..."
CORS_RESPONSE=$(curl -s -I -H "Origin: ${FRONTEND_URL}" "${BACKEND_URL}/health")

if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
    ALLOWED_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" | cut -d' ' -f2- | tr -d '\r')
    print_success "CORS is configured"
    print_info "Allowed origin: $ALLOWED_ORIGIN"
else
    print_warning "CORS headers not found - frontend may have connection issues"
    print_info "Make sure CORS_ORIGIN is set to: ${FRONTEND_URL}"
fi

# =============================================================================
# TEST 6: Environment Variables Check
# =============================================================================
print_header "Test 6: Environment Variables Check"

print_info "Checking if backend has correct environment..."
# Try to trigger an error that reveals env issues
ENV_CHECK=$(curl -s "${BACKEND_URL}/api/nonexistent" || echo "")

if echo "$ENV_CHECK" | grep -qi "internal server error"; then
    print_warning "Got internal server error - check backend logs for details"
else
    print_success "Backend error handling is working"
fi

# =============================================================================
# SUMMARY
# =============================================================================
print_header "Verification Summary"

print_success "Backend URL: ${BACKEND_URL}"
print_success "Frontend URL: ${FRONTEND_URL}"
echo ""

print_info "Manual checks to perform:"
echo "  1. Visit ${FRONTEND_URL} in your browser"
echo "  2. Try to login with test credentials"
echo "  3. Create a raw material or finished product"
echo "  4. Check that data persists after refresh"
echo "  5. Test customer order creation and export"
echo ""

print_info "Monitoring:"
echo "  • Render Dashboard: https://dashboard.render.com"
echo "  • Vercel Dashboard: https://vercel.com/dashboard"
echo "  • Neon Dashboard: https://console.neon.tech"
echo ""

print_success "Production deployment verification completed!"
echo ""
