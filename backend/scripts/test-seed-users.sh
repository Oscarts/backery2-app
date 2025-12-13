#!/bin/bash
# Test all seed users to verify they work correctly

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          SEED USERS VERIFICATION TEST                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000/api/auth/login"

# Function to test login
test_login() {
    local email=$1
    local password=$2
    local expected_client=$3
    local expected_permissions=$4
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 Testing: $email"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    success=$(echo "$response" | jq -r '.success')
    
    if [ "$success" = "true" ]; then
        user_email=$(echo "$response" | jq -r '.data.user.email')
        client_name=$(echo "$response" | jq -r '.data.user.client.name')
        client_slug=$(echo "$response" | jq -r '.data.user.client.slug')
        role_enum=$(echo "$response" | jq -r '.data.user.role')
        custom_role=$(echo "$response" | jq -r '.data.user.customRole.name')
        perm_count=$(echo "$response" | jq -r '.data.user.permissions | length')
        
        echo -e "${GREEN}✅ LOGIN SUCCESSFUL${NC}"
        echo "   Email: $user_email"
        echo "   Client: $client_name ($client_slug)"
        echo "   Role Enum: $role_enum"
        echo "   Custom Role: $custom_role"
        echo "   Permissions: $perm_count"
        
        # Verify expected values
        if [ "$client_slug" = "$expected_client" ]; then
            echo -e "   ${GREEN}✓${NC} Client matches expected: $expected_client"
        else
            echo -e "   ${RED}✗${NC} Client mismatch! Expected: $expected_client, Got: $client_slug"
        fi
        
        if [ "$perm_count" = "$expected_permissions" ]; then
            echo -e "   ${GREEN}✓${NC} Permissions match expected: $expected_permissions"
        else
            echo -e "   ${YELLOW}⚠${NC}  Permissions mismatch! Expected: $expected_permissions, Got: $perm_count"
        fi
        
        # Show sample permissions
        echo ""
        echo "   Sample Permissions (first 5):"
        echo "$response" | jq -r '.data.user.permissions[0:5] | .[] | "     • " + .resource + ":" + .action'
        
    else
        error=$(echo "$response" | jq -r '.error')
        echo -e "${RED}❌ LOGIN FAILED${NC}"
        echo "   Error: $error"
    fi
    
    echo ""
}

# Test all known seed users
echo "Testing seed users created by npm run db:seed"
echo ""

test_login "admin@demobakery.com" "admin123" "demo-bakery" "33"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing users created by npm run db:seed:dev (if exists)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_login "admin@test.com" "test123" "demo-bakery" "33"
test_login "manager@test.com" "manager123" "demo-bakery" "14"
test_login "staff@test.com" "staff123" "demo-bakery" "12"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing Super Admin user (if exists)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_login "superadmin@system.local" "super123" "system" "15"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          TEST COMPLETE                                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
