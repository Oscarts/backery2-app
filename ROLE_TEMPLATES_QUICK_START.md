# Role Templates - Quick Start Guide

## 🚀 What Are Role Templates?

Role templates are **pre-configured roles stored in the System client** that are automatically copied to every new bakery client. This ensures all clients start with a consistent, well-defined set of roles and permissions.

## 📦 Available Templates

| Template | Permissions | Use Case |
|----------|------------|----------|
| **Admin** | 33 | Full bakery operations + user management |
| **Sales Manager** | 14 | Customer orders and sales |
| **Inventory Manager** | 12 | Raw materials & finished products |
| **Production Manager** | 12 | Recipes and production runs |

**Note**: Super Admin (15 permissions) is also a template but only used for platform management, not copied to bakery clients.

## ⚡ Quick Commands

```bash
# Verify templates exist and are correct
npm run verify:role-templates

# Create/update templates in System client
npm run setup:role-templates

# Full seed (includes template creation)
npm run db:seed

# Setup Super Admin role
npm run setup:superadmin
```

## 🔄 How Templates Work

### On Fresh Setup (Seed)
```
1. Create System client
2. Create 4 role templates (isSystem: true)
3. Create Demo Bakery client
4. Copy templates to Demo Bakery (isSystem: false)
5. Assign Admin role to admin user
```

### When Creating New Client (API)
```
1. clientController.ts queries System client
2. Finds all roles where isSystem = true
3. Excludes "Super Admin" role
4. Copies each template to new client
5. New client has 4 working roles immediately
```

## ✏️ Customizing Templates

### Option 1: Edit Seed File
```typescript
// backend/prisma/seed.ts
async function createRoleTemplates(systemClientId: string) {
  const roleTemplates = [
    {
      name: 'Admin',
      permissions: [
        { resource: 'dashboard', action: 'view' },
        // Add/remove permissions here
      ]
    }
  ];
}
```

### Option 2: Edit Script File
```typescript
// backend/scripts/create-role-templates.ts
const roleTemplates = [
  {
    name: 'Admin',
    description: 'Full access to all bakery operations',
    permissions: [
      // Edit permissions here
    ]
  }
];
```

After editing, run:
```bash
npm run setup:role-templates
```

**⚠️ Important**: Template changes only affect NEW clients. Existing clients keep their current roles.

## 🔍 Verifying Templates

Run the verification script:
```bash
npm run verify:role-templates
```

Output shows:
- All templates in System client (isSystem: true)
- All copied roles in Demo Bakery (isSystem: false)
- Permission counts for each role
- Summary statistics

## 📊 Template Permissions Breakdown

### Admin (33 permissions)
```
dashboard:view
raw-materials: view, create, edit, delete
finished-products: view, create, edit, delete
recipes: view, create, edit, delete
production: view, create, edit, delete
customers: view, create, edit, delete
customer-orders: view, create, edit, delete
settings: view, edit
users: view, create, edit, delete
roles: view
reports: view
```

### Sales Manager (14 permissions)
```
dashboard:view
raw-materials: view
finished-products: view
recipes: view
production: view
customers: view, create, edit, delete
customer-orders: view, create, edit, delete
reports: view
```

### Inventory Manager (12 permissions)
```
dashboard:view
raw-materials: view, create, edit, delete
finished-products: view, create, edit, delete
recipes: view
production: view
reports: view
```

### Production Manager (12 permissions)
```
dashboard:view
raw-materials: view
finished-products: view
recipes: view, create, edit, delete
production: view, create, edit, delete
reports: view
```

## 🎯 Common Tasks

### Add a New Template
1. Edit `createRoleTemplates()` in `backend/prisma/seed.ts`
2. Add new role object to `roleTemplates` array
3. Run `npm run setup:role-templates`

### Modify Template Permissions
1. Find the template in `createRoleTemplates()`
2. Add/remove permissions in the array
3. Run `npm run setup:role-templates`

### Sync Existing Clients
```bash
npx tsx backend/scripts/sync-clients-with-templates.ts
```
This updates all existing clients to match current templates.

### Check Which Roles Exist
```sql
-- In Prisma Studio or psql
SELECT c.name as client, r.name as role, r."isSystem", 
       COUNT(rp.id) as permissions
FROM roles r
JOIN clients c ON r."clientId" = c.id
LEFT JOIN role_permissions rp ON rp."roleId" = r.id
GROUP BY c.name, r.name, r."isSystem"
ORDER BY c.name, r.name;
```

## 🐛 Troubleshooting

### Templates Not Showing in Demo Bakery
```bash
# Re-run seed to recreate everything
npm run db:seed:force
```

### Templates Missing Permissions
```bash
# Recreate templates
npm run setup:role-templates

# Verify they have correct permissions
npm run verify:role-templates
```

### Admin User Has No Permissions
Check that admin user has roleId assigned:
```sql
SELECT email, "roleId", role FROM users WHERE email = 'admin@demobakery.com';
```

If roleId is null:
```bash
# Re-run seed to fix
npm run db:seed:force
```

## 📚 Related Documentation

- [ROLE_TEMPLATES_IMPLEMENTATION_COMPLETE.md](./ROLE_TEMPLATES_IMPLEMENTATION_COMPLETE.md) - Full implementation details
- [ROLE_TEMPLATE_SYSTEM_COMPLETE.md](./ROLE_TEMPLATE_SYSTEM_COMPLETE.md) - Original implementation
- [SUPER_ADMIN_GUIDE.md](./SUPER_ADMIN_GUIDE.md) - Super Admin vs Bakery Admin
- [README.md](./README.md#-role-templates-system) - Project README section

## ✅ Checklist for New Setup

- [ ] Run `npm run db:seed` to create templates
- [ ] Run `npm run verify:role-templates` to confirm
- [ ] Run `npm run setup:superadmin` for Super Admin
- [ ] Login as `admin@demobakery.com` / `admin123`
- [ ] Verify user has 33 permissions in profile
- [ ] Create a test user with "Sales Manager" role
- [ ] Verify Sales Manager can access customers but not settings

---

**Quick Reference Card**:
```
CREATE TEMPLATES:   npm run setup:role-templates
VERIFY TEMPLATES:   npm run verify:role-templates
FULL SEED:          npm run db:seed
SUPER ADMIN:        npm run setup:superadmin
TEST LOGIN:         admin@demobakery.com / admin123
```
