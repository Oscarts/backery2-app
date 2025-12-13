# Super Admin vs Bakery Admin

## Role Definitions

### 🌐 Super Admin (Platform Administrator)
**Purpose**: Manage the multi-tenant platform, clients, and cross-client operations

**Permissions** (15 total):
- ✅ **Clients**: Create, view, edit, delete bakery clients
- ✅ **Users**: Manage users across all clients  
- ✅ **Roles**: Create and manage roles with custom permissions
- ✅ **Permissions**: View available permissions
- ✅ **Settings**: Configure platform-wide settings

**CANNOT Access**:
- ❌ Raw materials, recipes, finished products
- ❌ Production runs and quality tracking
- ❌ Customer orders and invoices
- ❌ Dashboards and reports
- ❌ Bakery-specific inventory

**Use Case**: System administrators who manage multiple bakery clients but don't run bakery operations.

---

### 🏪 Admin (Bakery Administrator)
**Purpose**: Full access to ALL bakery operations within their client

**Permissions** (33+ total):
- ✅ **Dashboard**: View inventory metrics and alerts
- ✅ **Raw Materials**: Full CRUD access
- ✅ **Finished Products**: Full CRUD access  
- ✅ **Recipes**: Create and manage recipes with costing
- ✅ **Production**: Create and track production runs
- ✅ **Customers**: Manage customer database
- ✅ **Customer Orders**: Create and manage orders
- ✅ **Settings**: Configure bakery-specific settings
- ✅ **Users**: Manage users within their bakery
- ✅ **Roles**: View roles (but not manage them)
- ✅ **Reports**: Generate and export reports

**CANNOT Access**:
- ❌ Other bakery clients' data
- ❌ Platform client management
- ❌ Cross-client operations

**Use Case**: Bakery owners/managers who run their bakery operations daily.

---

## Key Differences

| Feature | Super Admin | Bakery Admin |
|---------|------------|--------------|
| Manage Clients | ✅ | ❌ |
| Cross-client Users | ✅ | ❌ |
| Create Roles | ✅ | ❌ |
| Raw Materials | ❌ | ✅ |
| Recipes | ❌ | ✅ |
| Production | ❌ | ✅ |
| Customer Orders | ❌ | ✅ |
| Dashboard | ❌ | ✅ |
| Reports | ❌ | ✅ |

---

## Setup Instructions

### Create Super Admin User

```bash
cd backend
npx tsx scripts/setup-superadmin-role.ts
```

This script:
1. Creates/updates "Super Admin" role in System client
2. Assigns 15 platform management permissions
3. Updates all superadmin users to use this role

### Create Bakery Admin User

Bakery admins are created per-client using the role templates:

```bash
# When creating a new client, the system automatically:
# 1. Copies role templates from System client
# 2. Creates an "Admin" role with full bakery permissions
# 3. Assigns the first user as Admin
```

---

## User Examples

### Super Admin Login
```
Email: superadmin@system.local
Password: super123
Client: System
```

After login, you'll see:
- Client Management page
- User Management (all clients)
- Role Management
- Platform Settings

### Bakery Admin Login
```
Email: admin@demobakery.com
Password: admin123
Client: Demo Bakery
```

After login, you'll see:
- Dashboard with inventory alerts
- Raw Materials, Recipes, Production
- Customer Orders
- Reports

---

## Architecture Notes

### Client Isolation
- **System Client** (`slug: system`): Hosts Super Admin role templates
- **Bakery Clients** (`slug: bakery-slug`): Each has its own roles copied from templates

### Permission System
- Permissions are global (shared across all clients)
- Roles are per-client (isolated to each bakery)
- RolePermissions link roles to permissions
- Users belong to ONE client and ONE role

### Multi-Tenancy
- Super Admins belong to "System" client but can manage all clients
- Bakery Admins belong to their bakery client and are tenant-isolated
- Middleware enforces tenant isolation for all bakery operations

---

## Best Practices

1. **Super Admin accounts should be minimal**: Only for platform administrators
2. **Each bakery gets its own Admin users**: For day-to-day operations
3. **Don't give Super Admins bakery access**: Separation of concerns
4. **Use role templates**: Ensures consistency across clients
5. **Audit Super Admin actions**: They have cross-client access

---

## Scripts Available

- `setup-superadmin-role.ts`: Create/update Super Admin role with correct permissions
- `create-role-templates.ts`: Create bakery role templates (Admin, Manager, Staff, etc.)
- `seed-dev.ts`: Safe seed that creates both Super Admin and Bakery Admin users

---

**Last Updated**: December 13, 2025  
**Super Admin Permissions**: 15  
**Bakery Admin Permissions**: 33+
