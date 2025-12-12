# Settings Architecture Proposal - Global vs Client Settings

## Problem Statement

Following CODE_GUIDELINES.md, units of measurement are **global** (shared across all clients) but currently editable by all users in their Settings page. This violates the multi-tenant architecture principle:

- **Global resources** (Units) should only be managed by Super Admin
- **Client-specific resources** (Categories, Suppliers, Storage Locations, Quality Statuses) should be managed by Organization Admins

## Proposed Architecture

### 1. **Global Settings** (Super Admin Only - `/settings/global`)

**Accessible by:** Super Admin (9 permissions)  
**Access Control:** Requires `settings:edit` OR create new `global-settings:*` permissions  
**Route:** `/settings/global`

**Global Settings Include:**
- ✅ **Units of Measurement** (kg, L, g, mL, etc.)
  - Shared across ALL clients
  - Standardized measurement units
  - Cannot be deleted if in use by any client
  - CRUD operations: Create, Edit, Activate/Deactivate

**Why Global:**
- Units like "Kilogram", "Liter" are universal standards
- No need for each bakery to have their own "kg" definition
- Ensures data consistency across the platform
- Simplifies reporting and analytics at platform level

**UI Location:**
```
Settings (Super Admin Menu)
├── Clients (manage bakery clients)
├── Role Templates (manage role templates)
└── Global Settings ← NEW
    └── Units of Measurement
```

---

### 2. **Client Settings** (Organization Admin - `/settings`)

**Accessible by:** Admin, Manager roles (has `settings:view` + `settings:edit`)  
**Access Control:** Filtered by `clientId`  
**Route:** `/settings` (existing)

**Client Settings Include:**
- ✅ **Categories** (client-specific)
  - Raw Material Categories (Flours, Sugars, Dairy, etc.)
  - Finished Product Categories (Breads, Pastries, Cakes, etc.)
  - Each bakery defines their own category structure
  
- ✅ **Suppliers** (client-specific)
  - Contact information
  - Addresses
  - Each bakery has different suppliers
  
- ✅ **Storage Locations** (client-specific)
  - Warehouses, Freezers, Dry Storage, etc.
  - Physical locations unique to each bakery
  
- ✅ **Quality Statuses** (client-specific)
  - Good, Damaged, Expired, etc.
  - Different bakeries may have different quality workflows

**Why Client-Specific:**
- Each bakery has unique operational needs
- Categories, suppliers, storage vary by location
- Quality workflows differ by business
- Full control for bakery owners

**UI Location:**
```
Settings (Organization Admin Menu)
├── Raw Material Categories
├── Finished Product Categories
├── Suppliers
├── Storage Locations
└── Quality Statuses
```

---

## Implementation Plan

### Phase 1: Backend Changes

#### 1.1 Update Unit Controller
```typescript
// backend/src/controllers/unitController.ts

// Restrict create/update/delete to Super Admin only
export const createUnit = async (req: Request, res: Response) => {
  // Verify Super Admin role
  if (req.user!.roleId !== SUPER_ADMIN_ROLE_ID) {
    return res.status(403).json({ 
      error: 'Forbidden: Only Super Admin can manage global units' 
    });
  }
  // ... existing create logic
};

// Allow all authenticated users to READ units
export const getAllUnits = async (req: Request, res: Response) => {
  // No clientId filter - units are global
  const units = await prisma.unit.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });
  res.json({ success: true, data: units });
};
```

#### 1.2 Update Routes Protection
```typescript
// backend/src/routes/units.ts
router.get('/', authenticate, getAllUnits);  // Anyone can read
router.post('/', authenticate, requireSuperAdmin, createUnit);  // Super Admin only
router.put('/:id', authenticate, requireSuperAdmin, updateUnit);  // Super Admin only
router.delete('/:id', authenticate, requireSuperAdmin, deleteUnit);  // Super Admin only
```

#### 1.3 Create Super Admin Middleware
```typescript
// backend/src/middleware/requireSuperAdmin.ts
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user?.roleId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const role = await prisma.role.findUnique({
    where: { id: user.roleId }
  });
  
  if (role?.name !== 'Super Admin' || !role?.isSystem) {
    return res.status(403).json({ 
      error: 'Forbidden: This action requires Super Admin privileges' 
    });
  }
  
  next();
};
```

---

### Phase 2: Frontend Changes

#### 2.1 Create Global Settings Page (Super Admin Only)
```tsx
// frontend/src/pages/GlobalSettings.tsx
import UnitsManagement from '../components/Settings/UnitsManagement';

const GlobalSettings: React.FC = () => {
  const { hasPermission } = useAuth();
  
  // Only Super Admin can access
  if (!hasPermission('clients', 'view')) {
    return <Navigate to="/" />;
  }
  
  return (
    <Container>
      <Typography variant="h4">Global Settings</Typography>
      <Typography variant="body2" color="text.secondary">
        Platform-wide settings that affect all clients
      </Typography>
      
      <Accordion>
        <AccordionSummary>
          <UnitsIcon />
          <Typography>Units of Measurement</Typography>
          <Chip label="Global" color="warning" size="small" />
        </AccordionSummary>
        <AccordionDetails>
          <UnitsManagement readOnly={false} />
        </AccordionDetails>
      </Accordion>
    </Container>
  );
};
```

#### 2.2 Update Client Settings Page
```tsx
// frontend/src/pages/Settings.tsx
const Settings: React.FC = () => {
  const { hasPermission } = useAuth();
  
  return (
    <Container>
      <Typography variant="h4">Client Settings</Typography>
      <Typography variant="body2" color="text.secondary">
        Manage your bakery's configuration
      </Typography>
      
      {/* Remove Units section - moved to Global Settings */}
      
      <SettingsSection title="Categories">
        {/* Existing categories */}
      </SettingsSection>
      
      <SettingsSection title="Suppliers">
        {/* Existing suppliers */}
      </SettingsSection>
      
      {/* ... other client settings */}
    </Container>
  );
};
```

#### 2.3 Update UnitsManagement Component
```tsx
// frontend/src/components/Settings/UnitsManagement.tsx
interface UnitsManagementProps {
  readOnly?: boolean;  // Show read-only view for non-Super Admins
}

const UnitsManagement: React.FC<UnitsManagementProps> = ({ readOnly = true }) => {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('clients', 'edit'); // Super Admin check
  
  return (
    <Box>
      {!canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Units are managed globally by the platform administrator.
          You can view available units but cannot modify them.
        </Alert>
      )}
      
      <Table>
        {/* Show units in read-only mode */}
      </Table>
      
      {canEdit && (
        <Button onClick={() => setOpenForm(true)}>
          Add Unit
        </Button>
      )}
    </Box>
  );
};
```

#### 2.4 Update Layout Navigation
```tsx
// frontend/src/components/Layout/Layout.tsx

// Super Admin sees:
{hasPermission('clients', 'view') && (
  <>
    <ListItem button component={Link} to="/settings/clients">
      <BusinessIcon />
      <ListItemText primary="Clients" />
    </ListItem>
    <ListItem button component={Link} to="/settings/role-templates">
      <RoleIcon />
      <ListItemText primary="Role Templates" />
    </ListItem>
    <ListItem button component={Link} to="/settings/global">
      <GlobalSettingsIcon />
      <ListItemText primary="Global Settings" />
    </ListItem>
  </>
)}

// Organization Admin sees:
{hasPermission('settings', 'view') && (
  <ListItem button component={Link} to="/settings">
    <SettingsIcon />
    <ListItemText primary="Settings" />
  </ListItem>
)}
```

---

## Summary of Changes

### Backend
| Resource | Current | Proposed | Access Control |
|----------|---------|----------|----------------|
| Units | Editable by all | Read-only for clients, Edit for Super Admin | `requireSuperAdmin` middleware |
| Categories | Client-specific ✅ | No change | `requirePermission('settings', 'edit')` + clientId filter |
| Suppliers | Client-specific ✅ | No change | `requirePermission('settings', 'edit')` + clientId filter |
| Storage | Client-specific ✅ | No change | `requirePermission('settings', 'edit')` + clientId filter |
| Quality Statuses | Client-specific ✅ | No change | `requirePermission('settings', 'edit')` + clientId filter |

### Frontend
| Page | Route | Role | Contains |
|------|-------|------|----------|
| **Global Settings** | `/settings/global` | Super Admin | Units of Measurement |
| **Client Settings** | `/settings` | Org Admin + | Categories, Suppliers, Storage, Quality |
| **Role Templates** | `/settings/role-templates` | Super Admin | Role templates |
| **Clients** | `/settings/clients` | Super Admin | Client management |

---

## Benefits

✅ **Clear Separation of Concerns**
- Platform-level config (units) managed centrally
- Client-level config managed by bakery owners

✅ **Follows Multi-Tenant Best Practices**
- Global resources shared efficiently
- Client resources properly isolated

✅ **Security Compliance**
- Super Admin can't accidentally modify client data
- Org Admins can't create conflicting global units

✅ **Better UX**
- Super Admin sees platform management tools
- Org Admin sees bakery management tools
- No confusion about what's editable

✅ **Follows CODE_GUIDELINES.md**
- Proper clientId filtering maintained
- Permission-based access control
- Clear role separation

---

## Migration Path

1. ✅ Create `requireSuperAdmin` middleware
2. ✅ Update unit routes with Super Admin protection
3. ✅ Create GlobalSettings.tsx page
4. ✅ Update Settings.tsx to remove Units section
5. ✅ Update UnitsManagement.tsx with read-only mode
6. ✅ Update Layout navigation based on role
7. ✅ Test with Super Admin and Org Admin users
8. ✅ Document changes in CODE_GUIDELINES.md

---

## Future Enhancements

**Additional Global Settings (Future):**
- Currency settings (USD, EUR, CAD, etc.)
- Tax rates (if standardized)
- Default system configurations

**Additional Client Settings (Future):**
- Business hours
- Notification preferences
- Custom branding
- Report templates
