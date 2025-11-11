# Multi-Tenant Authentication & Authorization System - Implementation Prompt

## Context

You are a senior full-stack engineer working on the **Bakery Inventory Management System** (RapidPro), a production-ready application built with:

- **Frontend**: React 18 + TypeScript + Material-UI + Vite + React Query
- **Backend**: Express.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT with bcrypt (existing simple auth in place)

## 📚 MANDATORY: Read These Files First (In Order)

1. `README.md` - Project overview and quick start
2. `docs/development-guidelines.md` - Critical coding standards and testing requirements
3. `docs/technical-architecture.md` - System architecture and technology stack
4. `docs/api-reference.md` - Complete backend API documentation
5. `docs/ui-guidelines.md` - Frontend design patterns and Material-UI standards
6. `docs/env.md` - Environment configuration
7. `docs/ai-agent-playbook.md` - Safe development protocol and guardrails

## 🎯 Feature Request: Multi-Tenant Authentication & Authorization System

### Business Requirement

Transform the application from single-tenant to **multi-tenant** to support multiple bakery clients, where:

1. **Multiple Clients (Tenants)**: Each bakery/chocolate shop is a separate client/tenant with isolated data
2. **Multiple Users Per Client**: Each client can have multiple user accounts
3. **Role-Based Access Control (RBAC)**: Users have specific roles with customizable page-level permissions
4. **Mandatory Admin Role**: Every client must have at least one ADMIN user with full system access
5. **Custom Role Configuration**: Clients can define custom roles with specific page access permissions

### Example Use Cases

**Client: ABC Bakery**
- User 1 (Role: Inventory Manager)
  - Access: Raw Materials, Finished Products, Recipes, Production pages
  - No Access: Customer Orders, Customers, Settings
  
- User 2 (Role: Sales Manager)
  - Access: Finished Products, Customer Orders, Customers pages
  - No Access: Raw Materials, Recipes, Production, Settings

- User 3 (Role: Admin)
  - Access: ALL pages including Settings and user management

**Client: XYZ Chocolatier**
- User 1 (Role: Admin)
  - Access: ALL pages
- User 2 (Role: Production Staff)
  - Access: Production, Recipes pages only

## 🏗️ Technical Requirements

### 1. Database Schema Changes (Prisma)

**CRITICAL**: Follow the principle from `docs/development-guidelines.md`:
> "All domain attributes (enums, fields) MUST be modeled in the database schema and exposed by the backend API. Do not introduce UI-only enums."

#### New Models Required

```prisma
model Client {
  id          String   @id @default(cuid())
  name        String   @unique // Company/bakery name
  slug        String   @unique // URL-friendly identifier
  email       String?
  phone       String?
  address     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  users       User[]
  roles       Role[]
  
  // All existing models need clientId foreign key
  rawMaterials         RawMaterial[]
  finishedProducts     FinishedProduct[]
  recipes              Recipe[]
  productionRuns       ProductionRun[]
  customers            Customer[]
  customerOrders       CustomerOrder[]
  categories           Category[]
  suppliers            Supplier[]
  storageLocations     StorageLocation[]
  qualityStatuses      QualityStatus[]
  
  @@map("clients")
}

model Role {
  id          String   @id @default(cuid())
  name        String   // e.g., "Admin", "Inventory Manager", "Sales Manager"
  description String?
  isSystem    Boolean  @default(false) // True for ADMIN role
  clientId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  users       User[]
  permissions RolePermission[]
  
  @@unique([clientId, name])
  @@map("roles")
}

model Permission {
  id          String   @id @default(cuid())
  resource    String   // Page/module identifier (e.g., "raw-materials", "customer-orders")
  action      String   // "view", "create", "edit", "delete"
  description String?
  createdAt   DateTime @default(now())
  
  rolePermissions RolePermission[]
  
  @@unique([resource, action])
  @@map("permissions")
}

model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  permissionId String
  createdAt    DateTime   @default(now())
  
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

enum UserRole {
  ADMIN
  STAFF
  CUSTOM
}
```

#### Update Existing User Model

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         UserRole @default(CUSTOM)  // Legacy: keep for backward compatibility
  roleId       String?  // New: Reference to Role table
  clientId     String   // NEW: Multi-tenant isolation
  firstName    String
  lastName     String
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  client       Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  customRole   Role?    @relation(fields: [roleId], references: [id], onDelete: SetNull)
  
  @@index([clientId])
  @@index([email])
  @@map("users")
}
```

#### Add clientId to ALL Existing Models

**EVERY existing model** (RawMaterial, FinishedProduct, Recipe, ProductionRun, Customer, CustomerOrder, Category, Supplier, StorageLocation, QualityStatus, etc.) needs:

```prisma
model ExampleModel {
  // ... existing fields
  clientId     String
  client       Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  @@index([clientId])
}
```

### 2. Database Migration Strategy

1. Create migration for new Client, Role, Permission, RolePermission tables
2. Create migration to add clientId to User table
3. Create data migration to:
   - Create a default "System" client
   - Migrate existing users to the default client
   - Create default ADMIN role for the client
   - Assign ADMIN role to existing users
4. Create migration to add clientId to all other tables (with default client)
5. Update seed script to include multi-tenant data

### 3. Backend API Changes

#### Authentication Endpoints (Update)

```typescript
POST /api/auth/register
// Body: { email, password, firstName, lastName, clientId, roleId? }
// Note: First user of a client should be ADMIN

POST /api/auth/login
// Body: { email, password }
// Response: { token, user: { id, email, firstName, lastName, clientId, role, permissions } }

GET /api/auth/me
// Headers: Authorization: Bearer <token>
// Response: { user, permissions, client }

POST /api/auth/switch-client (if user belongs to multiple clients)
// Body: { clientId }
```

#### New Client Management Endpoints

```typescript
POST /api/clients
// Create new client (super-admin only or public registration)

GET /api/clients
// List all clients (super-admin only)

GET /api/clients/:id
// Get client details

PUT /api/clients/:id
// Update client

DELETE /api/clients/:id
// Deactivate client
```

#### New Role & Permission Endpoints

```typescript
GET /api/clients/:clientId/roles
// List all roles for a client

POST /api/clients/:clientId/roles
// Create custom role

PUT /api/clients/:clientId/roles/:roleId
// Update role permissions

DELETE /api/clients/:clientId/roles/:roleId
// Delete custom role (cannot delete ADMIN)

GET /api/permissions
// List all available permissions (resources/actions)
```

#### New User Management Endpoints (Enhanced)

```typescript
GET /api/clients/:clientId/users
// List all users in client

POST /api/clients/:clientId/users
// Create user in client

PUT /api/users/:userId
// Update user details/role

PUT /api/users/:userId/role
// Change user role

DELETE /api/users/:userId
// Deactivate user
```

#### Middleware Updates

```typescript
// 1. Authentication Middleware (update existing)
// - Verify JWT token
// - Extract user and clientId
// - Attach to req.user and req.clientId

// 2. New: Tenant Isolation Middleware
// - Automatically filter all queries by clientId
// - Prevent cross-tenant data access

// 3. New: Permission Middleware
// - Check if user has required permission for resource/action
// - Example: requirePermission('raw-materials', 'view')
```

### 4. Frontend Changes

#### Context/State Management

```typescript
// Create new contexts
interface AuthContextType {
  user: User | null;
  client: Client | null;
  permissions: Permission[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  canAccessPage: (pagePath: string) => boolean;
}

interface ClientContextType {
  client: Client | null;
  setClient: (client: Client) => void;
}
```

#### Route Protection

```typescript
// Update ProtectedRoute component
<ProtectedRoute 
  path="/raw-materials" 
  component={RawMaterialsPage}
  requiredPermission={{ resource: 'raw-materials', action: 'view' }}
/>
```

#### New Pages/Components

1. **Client Registration Page** (`/register-client`)
   - Create new client account
   - Auto-create first admin user

2. **Login Page** (update existing `/login`)
   - Email/password login
   - Display client name after login

3. **User Management Page** (`/settings/users`)
   - List users in client
   - Create/edit/deactivate users
   - Assign roles

4. **Role Management Page** (`/settings/roles`)
   - List custom roles
   - Create/edit roles
   - Configure page permissions (checkboxes for each page)

5. **Client Settings Page** (`/settings/client`)
   - Update client details
   - View subscription info (future)

#### Navigation Updates

```typescript
// Update Layout/Navigation to:
// - Show only permitted pages in menu
// - Display client name in header
// - Show current user role
// - Add user dropdown menu (logout, profile, switch client)
```

#### Permission-Based UI Elements

```typescript
// Add utility components
<PermissionGate resource="raw-materials" action="create">
  <Button>Add Raw Material</Button>
</PermissionGate>

<PermissionGate resource="customer-orders" action="delete">
  <IconButton><DeleteIcon /></IconButton>
</PermissionGate>
```

### 5. Default Permissions Structure

Define standard page resources:

```typescript
const PAGE_RESOURCES = {
  dashboard: 'dashboard',
  rawMaterials: 'raw-materials',
  finishedProducts: 'finished-products',
  recipes: 'recipes',
  production: 'production',
  customers: 'customers',
  customerOrders: 'customer-orders',
  settings: 'settings',
  users: 'users',
  roles: 'roles',
};

const ACTIONS = {
  view: 'view',
  create: 'create',
  edit: 'edit',
  delete: 'delete',
};

// Default ADMIN role gets ALL permissions
// Custom roles get selective permissions
```

### 6. Data Isolation Strategy

**CRITICAL**: Implement Row-Level Security pattern:

```typescript
// In all Prisma queries, automatically filter by clientId
async function findRawMaterials(clientId: string, filters: any) {
  return prisma.rawMaterial.findMany({
    where: {
      clientId, // ALWAYS include this
      ...filters,
    },
  });
}

// Use middleware to inject clientId automatically
prisma.$use(async (params, next) => {
  if (params.model && params.action === 'findMany') {
    params.args.where = {
      ...params.args.where,
      clientId: getCurrentClientId(), // From JWT context
    };
  }
  return next(params);
});
```

## 🧪 Testing Requirements

**MANDATORY**: Follow `docs/development-guidelines.md` testing standards.

### Backend Tests Required

1. **Auth Tests**:
   - Client registration creates default admin
   - Login returns correct permissions
   - JWT includes clientId and roleId
   - Token refresh maintains client context

2. **Tenant Isolation Tests**:
   - Users cannot access other clients' data
   - Queries automatically filter by clientId
   - Cross-tenant access attempts return 403

3. **Permission Tests**:
   - Admin role has all permissions
   - Custom roles have only assigned permissions
   - Missing permission returns 403
   - Permission checks work for all CRUD operations

4. **User Management Tests**:
   - Create user in client
   - Assign/change roles
   - Cannot delete last admin
   - Deactivate/reactivate users

### Frontend Tests Required

1. **Auth Flow Tests**:
   - Registration creates client + admin
   - Login stores JWT and loads permissions
   - Logout clears state
   - Protected routes redirect non-authenticated users

2. **Permission UI Tests**:
   - Menu shows only permitted pages
   - Buttons render based on permissions
   - Unauthorized page access shows 403

3. **Role Management Tests**:
   - Create custom role
   - Assign permissions
   - Update role affects user access immediately

## 📋 Implementation Checklist

### Phase 1: Database Schema (Week 1)

- [ ] Create Client, Role, Permission, RolePermission models
- [ ] Update User model with clientId and roleId
- [ ] Add clientId to ALL existing models
- [ ] Create and test migrations
- [ ] Update seed script with multi-tenant data
- [ ] Test backward compatibility with existing data

### Phase 2: Backend Core (Week 1-2)

- [ ] Implement authentication updates (JWT with client context)
- [ ] Create tenant isolation middleware
- [ ] Create permission checking middleware
- [ ] Update all existing controllers to filter by clientId
- [ ] Implement client management endpoints
- [ ] Implement role management endpoints
- [ ] Implement user management endpoints
- [ ] Write comprehensive API tests
- [ ] Update API documentation

### Phase 3: Frontend Core (Week 2-3)

- [ ] Create AuthContext with permissions
- [ ] Create ClientContext
- [ ] Update login/registration pages
- [ ] Implement ProtectedRoute with permissions
- [ ] Create PermissionGate component
- [ ] Update navigation to show only permitted pages
- [ ] Update all existing pages to use permission checks
- [ ] Add client name to header/layout

### Phase 4: Admin UI (Week 3)

- [ ] Create User Management page
- [ ] Create Role Management page
- [ ] Create Client Settings page
- [ ] Add user profile/dropdown menu
- [ ] Implement role assignment UI
- [ ] Create permission configuration UI (checkboxes)
- [ ] Add "Cannot delete last admin" validation
- [ ] Write frontend tests

### Phase 5: Testing & Polish (Week 4)

- [ ] Run full test suite (backend + frontend)
- [ ] Test tenant isolation thoroughly
- [ ] Test all permission combinations
- [ ] Test edge cases (last admin, role deletion, etc.)
- [ ] Performance testing with multiple clients
- [ ] Security audit (XSS, CSRF, SQL injection)
- [ ] Update all documentation
- [ ] Create migration guide for existing users

## 🚨 Critical Guidelines

### From `docs/development-guidelines.md`:

1. **Real API Only**: Never use mock data, always connect to actual database
2. **Backend First**: All enums/types must exist in Prisma schema before frontend
3. **Test Coverage**: Every feature must have unit tests
4. **TypeScript Strict**: No `any` types, proper interfaces
5. **Documentation**: Update API docs, UI docs, and progress tracking

### Security Considerations:

1. **JWT Security**:
   - Store clientId in JWT payload
   - Verify clientId matches requested resources
   - Use short token expiry (15 min) with refresh tokens

2. **Tenant Isolation**:
   - NEVER trust clientId from request body
   - ALWAYS use clientId from verified JWT
   - Implement Prisma middleware for automatic filtering
   - Test cross-tenant access attempts return 403

3. **Permission Checks**:
   - Check permissions on EVERY API endpoint
   - Use middleware decorators for consistency
   - Frontend checks are UX-only, backend is authoritative

4. **Default Admin Protection**:
   - Cannot delete last admin user
   - Cannot remove admin role from last admin
   - Admin role cannot be deleted
   - Admin permissions cannot be modified

### Data Migration Safety:

1. Create migrations incrementally
2. Test each migration in isolation
3. Provide rollback scripts
4. Test with production-like data volume
5. Document migration steps clearly

## 📖 Example Code Patterns

### Backend Permission Middleware

```typescript
// middleware/permissions.ts
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Admin always has access
    if (user.role === 'ADMIN') {
      return next();
    }
    
    // Check custom role permissions
    const hasPermission = await checkUserPermission(
      user.id,
      resource,
      action
    );
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `You don't have permission to ${action} ${resource}` 
      });
    }
    
    next();
  };
};

// Usage in routes
router.get(
  '/raw-materials',
  authenticate,
  requirePermission('raw-materials', 'view'),
  getRawMaterials
);
```

### Frontend Permission Hook

```typescript
// hooks/usePermissions.ts
export const usePermissions = () => {
  const { user, permissions } = useAuth();
  
  const hasPermission = useCallback((resource: string, action: string) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    
    return permissions.some(
      p => p.resource === resource && p.action === action
    );
  }, [user, permissions]);
  
  const canAccessPage = useCallback((pagePath: string) => {
    const pageResourceMap = {
      '/raw-materials': 'raw-materials',
      '/finished-products': 'finished-products',
      '/recipes': 'recipes',
      '/production': 'production',
      '/customers': 'customers',
      '/customer-orders': 'customer-orders',
      '/settings': 'settings',
    };
    
    const resource = pageResourceMap[pagePath];
    return resource ? hasPermission(resource, 'view') : false;
  }, [hasPermission]);
  
  return { hasPermission, canAccessPage };
};
```

### Role Management UI Component

```typescript
// components/RolePermissionsEditor.tsx
const RolePermissionsEditor: React.FC<{ roleId: string }> = ({ roleId }) => {
  const { data: role } = useQuery(['role', roleId], () => api.getRole(roleId));
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  const pageResources = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'raw-materials', label: 'Raw Materials' },
    { id: 'finished-products', label: 'Finished Products' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'production', label: 'Production' },
    { id: 'customers', label: 'Customers' },
    { id: 'customer-orders', label: 'Customer Orders' },
    { id: 'settings', label: 'Settings' },
  ];
  
  const actions = ['view', 'create', 'edit', 'delete'];
  
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Page</TableCell>
            {actions.map(action => (
              <TableCell key={action} align="center">
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {pageResources.map(page => (
            <TableRow key={page.id}>
              <TableCell>{page.label}</TableCell>
              {actions.map(action => (
                <TableCell key={action} align="center">
                  <Checkbox
                    checked={selectedPermissions.includes(`${page.id}:${action}`)}
                    onChange={(e) => handlePermissionChange(page.id, action, e.target.checked)}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

## 📝 Documentation Updates Required

After implementation, update:

1. **`README.md`**: Add multi-tenant features section
2. **`docs/api-reference.md`**: Document all new endpoints
3. **`docs/technical-architecture.md`**: Update schema and auth flow diagrams
4. **`docs/development-guidelines.md`**: Add multi-tenant development patterns
5. **`docs/ui-guidelines.md`**: Add permission-based UI component patterns
6. **`docs/development-progress.md`**: Log completion dates and features

## 🎯 Success Criteria

- [ ] Multiple clients can exist with isolated data
- [ ] Users can only access their client's data
- [ ] Admin users have full access to all pages
- [ ] Custom roles can be created with selective page access
- [ ] Cannot delete last admin user
- [ ] All existing features work with multi-tenant architecture
- [ ] All tests pass (backend + frontend)
- [ ] Documentation is complete and up-to-date
- [ ] No performance degradation with tenant filtering
- [ ] Security audit passes (no cross-tenant data leaks)

## 💡 Future Enhancements (Out of Scope for Now)

- Super-admin portal for managing all clients
- Client subscription/billing system
- Multi-language support per client
- Client-specific branding/theming
- Audit logs per client
- Client data export/backup
- User invitation system with email verification

---

## 🚀 Ready to Start?

1. Read all documentation files listed above
2. Set up your development environment using `./start-with-data.sh`
3. Create a feature branch: `git checkout -b feature/multi-tenant-auth`
4. Follow the implementation checklist phase by phase
5. Write tests alongside each feature
6. Update documentation as you go
7. Commit frequently with clear messages

**Questions or clarifications needed?** Ask before implementing to avoid rework.

Good luck! 🎉
