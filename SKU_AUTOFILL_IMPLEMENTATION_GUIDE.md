# SKU Auto-Fill Implementation Guide

## 🎯 Objective
Speed up raw material creation by allowing users to select an SKU reference and auto-populate common fields, focusing only on batch-specific data.

## ⚠️ CRITICAL CONSTRAINT: ZERO REGRESSION
This is an **OPTIONAL speed enhancement** - all existing functionality must continue working identically without SKU selection.

---

## Step 1: Update Raw Material Form UI with SKU Selector

### Location
`frontend/src/pages/RawMaterials.tsx`

### Changes Required
1. **Add SKU Reference Query** (before form state)
```typescript
// Add after existing queries
const { data: skuReferencesResponse } = useQuery({
  queryKey: ['sku-references'],
  queryFn: skuReferencesApi.getAll,
});
const skuReferences = skuReferencesResponse?.data || [];
```

2. **Add State for SKU Selection**
```typescript
const [selectedSku, setSelectedSku] = useState<SkuReference | null>(null);
const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
```

3. **Add Autocomplete Field** (at top of dialog form, before name field)
```typescript
<Grid item xs={12}>
  <Autocomplete
    options={skuReferences}
    getOptionLabel={(option) => `${option.sku} - ${option.name}`}
    value={selectedSku}
    onChange={(event, newValue) => handleSkuSelect(newValue)}
    renderInput={(params) => (
      <TextField
        {...params}
        label="SKU Reference (Optional)"
        helperText="Select an SKU to auto-fill product details"
        InputProps={{
          ...params.InputProps,
          startAdornment: (
            <>
              <LabelIcon sx={{ color: 'action.active', mr: 1 }} />
              {params.InputProps.startAdornment}
            </>
          ),
        }}
      />
    )}
  />
</Grid>
```

### Validation
- ✅ Field is completely optional
- ✅ Form can be submitted without SKU selection
- ✅ Existing create/edit flows work unchanged

---

## Step 2: Implement Auto-Fill Logic on SKU Selection

### Location
`frontend/src/pages/RawMaterials.tsx`

### Handler Implementation
```typescript
const handleSkuSelect = (sku: SkuReference | null) => {
  setSelectedSku(sku);
  
  if (!sku) {
    // User cleared selection - keep existing form data
    setAutoFilledFields(new Set());
    return;
  }

  // Auto-fill fields from SKU reference
  const fieldsToFill = new Set<string>();
  
  if (sku.name) {
    setFormData(prev => ({ ...prev, name: sku.name }));
    fieldsToFill.add('name');
  }
  
  if (sku.categoryId) {
    setFormData(prev => ({ ...prev, categoryId: sku.categoryId }));
    fieldsToFill.add('categoryId');
  }
  
  if (sku.storageLocationId) {
    setFormData(prev => ({ ...prev, storageLocationId: sku.storageLocationId }));
    fieldsToFill.add('storageLocationId');
  }
  
  if (sku.unit) {
    setFormData(prev => ({ ...prev, unit: sku.unit }));
    fieldsToFill.add('unit');
  }
  
  if (sku.unitPrice !== null && sku.unitPrice !== undefined) {
    setFormData(prev => ({ ...prev, unitPrice: sku.unitPrice }));
    fieldsToFill.add('unitPrice');
  }
  
  if (sku.reorderLevel !== null && sku.reorderLevel !== undefined) {
    setFormData(prev => ({ ...prev, reorderLevel: sku.reorderLevel }));
    fieldsToFill.add('reorderLevel');
  }
  
  // Also save the SKU reference ID for backend
  setFormData(prev => ({ ...prev, skuReferenceId: sku.id }));
  
  setAutoFilledFields(fieldsToFill);
};
```

### Add Visual Indicators for Auto-Filled Fields
```typescript
// Helper function to render field helper text
const getFieldHelperText = (fieldName: string, defaultText?: string) => {
  if (autoFilledFields.has(fieldName)) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} />
        <Typography variant="caption" color="success.main">
          Auto-filled from SKU
        </Typography>
      </Box>
    );
  }
  return defaultText;
};

// Apply to auto-filled fields
<TextField
  fullWidth
  label="Product Name"
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  helperText={getFieldHelperText('name', 'Required')}
  required
/>
```

### Validation
- ✅ Auto-fill only populates if SKU has values
- ✅ User can manually edit any auto-filled field
- ✅ Visual feedback shows which fields came from SKU
- ✅ If no SKU selected, form behaves exactly as before

---

## Step 3: Add 'Create New SKU' Quick Action (OPTIONAL)

### Location
`frontend/src/pages/RawMaterials.tsx`

### Implementation (Low Priority)
```typescript
// Add button in Autocomplete's renderOption or noOptionsText
<Autocomplete
  noOptionsText={
    <Box sx={{ p: 1 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        No SKU references found
      </Typography>
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setShowCreateSkuDialog(true)}
      >
        Create New SKU Reference
      </Button>
    </Box>
  }
  // ... rest of props
/>
```

### Note
- This is a UX enhancement, not critical for MVP
- Can be implemented later if the basic auto-fill proves valuable
- Skip if time is limited

---

## Step 4: Update Backend to Save sku_reference_id

### Location
`backend/src/controllers/rawMaterialController.ts`

### Schema Updates

**File:** `backend/src/validation/rawMaterialSchema.ts` (or inline in controller)
```typescript
const createSchema = Joi.object({
  name: Joi.string().required(),
  sku: Joi.string().allow(null, ''),
  skuReferenceId: Joi.string().allow(null, '').optional(), // ADD THIS
  categoryId: Joi.string().allow(null, ''),
  supplierId: Joi.string().required(),
  batchNumber: Joi.string().required(),
  // ... rest of fields
});

const updateSchema = Joi.object({
  name: Joi.string(),
  sku: Joi.string().allow(null, ''),
  skuReferenceId: Joi.string().allow(null, '').optional(), // ADD THIS
  // ... rest of fields
});
```

### Controller Updates

**Create Method:**
```typescript
create: async (req: Request, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
  }

  const clientId = req.user!.clientId;

  // CRITICAL: If skuReferenceId provided, verify it belongs to this tenant
  if (value.skuReferenceId) {
    const skuReference = await prisma.skuMapping.findFirst({
      where: {
        id: value.skuReferenceId,
        clientId, // Multi-tenant security check
      },
    });

    if (!skuReference) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SKU reference or not found',
      });
    }
  }

  const rawMaterial = await prisma.rawMaterial.create({
    data: {
      ...value,
      clientId,
      skuReferenceId: value.skuReferenceId || null, // Allow null
    },
    include: {
      category: true,
      supplier: true,
      storageLocation: true,
      qualityStatus: true,
      skuReference: true, // Include SKU reference in response
    },
  });

  res.status(201).json({ success: true, data: rawMaterial });
}
```

**Update Method:**
```typescript
update: async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error, value } = updateSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
  }

  const clientId = req.user!.clientId;

  // Verify raw material belongs to this tenant
  const existing = await prisma.rawMaterial.findFirst({
    where: { id, clientId },
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Raw material not found',
    });
  }

  // If changing SKU reference, verify it belongs to this tenant
  if (value.skuReferenceId !== undefined) {
    if (value.skuReferenceId) {
      const skuReference = await prisma.skuMapping.findFirst({
        where: {
          id: value.skuReferenceId,
          clientId,
        },
      });

      if (!skuReference) {
        return res.status(400).json({
          success: false,
          error: 'Invalid SKU reference or not found',
        });
      }
    }
  }

  const updated = await prisma.rawMaterial.update({
    where: { id },
    data: {
      ...value,
      skuReferenceId: value.skuReferenceId !== undefined ? value.skuReferenceId : undefined,
    },
    include: {
      category: true,
      supplier: true,
      storageLocation: true,
      qualityStatus: true,
      skuReference: true,
    },
  });

  res.json({ success: true, data: updated });
}
```

**GetAll Method (include SKU reference):**
```typescript
getAll: async (req: Request, res: Response) => {
  // ... existing code
  
  const rawMaterials = await prisma.rawMaterial.findMany({
    where: {
      clientId,
      // ... existing filters
    },
    include: {
      category: true,
      supplier: true,
      storageLocation: true,
      qualityStatus: true,
      skuReference: true, // ADD THIS
    },
    // ... rest of query
  });
  
  // ... rest of method
}
```

### Validation
- ✅ `skuReferenceId` is optional in schema
- ✅ Existing API calls without this field succeed
- ✅ Multi-tenant validation on SKU reference
- ✅ Null values handled gracefully
- ✅ SKU reference included in responses

---

## Step 5: Implement SKU Reference Display in Table

### Location
`frontend/src/pages/RawMaterials.tsx`

### Add Column to Table Header
```typescript
<TableHead>
  <TableRow>
    <TableCell>Name</TableCell>
    <TableCell>SKU</TableCell>
    <TableCell>SKU Reference</TableCell> {/* ADD THIS */}
    <TableCell>Category</TableCell>
    {/* ... rest of columns */}
  </TableRow>
</TableHead>
```

### Add Column to Table Body
```typescript
<TableBody>
  {rawMaterials.map((rm) => (
    <TableRow key={rm.id}>
      <TableCell>{rm.name}</TableCell>
      <TableCell>{rm.sku}</TableCell>
      <TableCell>
        {rm.skuReference ? (
          <Tooltip 
            title={
              <Box>
                <Typography variant="caption" display="block">
                  <strong>SKU:</strong> {rm.skuReference.sku}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Name:</strong> {rm.skuReference.name}
                </Typography>
                {rm.skuReference.unitPrice && (
                  <Typography variant="caption" display="block">
                    <strong>Unit Price:</strong> ${rm.skuReference.unitPrice}
                  </Typography>
                )}
              </Box>
            }
          >
            <Chip
              label={rm.skuReference.sku}
              size="small"
              icon={<LabelIcon />}
              color="primary"
              variant="outlined"
            />
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )}
      </TableCell>
      <TableCell>{rm.category?.name || '-'}</TableCell>
      {/* ... rest of cells */}
    </TableRow>
  ))}
</TableBody>
```

### Update Type Definition
**File:** `frontend/src/types/index.ts`
```typescript
export interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  skuReferenceId?: string | null; // ADD THIS
  skuReference?: SkuReference | null; // ADD THIS (for populated data)
  // ... rest of fields
}
```

### Validation
- ✅ Column shows SKU badge when reference exists
- ✅ Shows "-" when no SKU reference (handles null gracefully)
- ✅ Tooltip provides additional SKU details
- ✅ Table layout remains intact
- ✅ No breaking changes to existing columns

---

## Step 6: Regression Testing - Existing Workflows

### Test Cases (WITHOUT using SKU feature)

#### 6.1 Raw Material CRUD
- [ ] **Create**: Add new raw material manually (all fields) - should work exactly as before
- [ ] **Edit**: Update existing raw material - should work exactly as before
- [ ] **Delete**: Remove raw material - should work exactly as before
- [ ] **View**: List all raw materials - table should display correctly

#### 6.2 Form Functionality
- [ ] All dropdowns work (Category, Supplier, Storage Location, Quality Status)
- [ ] Date pickers work (Purchase Date, Expiration Date)
- [ ] Number inputs work (Quantity, Unit Price, Reorder Level)
- [ ] Validation errors show correctly
- [ ] Form reset works
- [ ] Cancel button works

#### 6.3 Table Features
- [ ] Pagination works
- [ ] Search/filter works
- [ ] Sorting works
- [ ] Actions (edit, delete) work
- [ ] Export functionality works

#### 6.4 Integration with Other Features
- [ ] Production runs can consume raw materials
- [ ] Recipes can reference raw materials
- [ ] Material traceability works
- [ ] Inventory levels update correctly
- [ ] Reserved quantities work

#### 6.5 Multi-Tenant Isolation
- [ ] User can only see their tenant's raw materials
- [ ] Cannot access other tenant's data
- [ ] SKU references filtered by tenant

### Acceptance Criteria
**ALL tests must pass before enabling SKU feature in production.**

---

## Step 7: Test New SKU-Based Workflow

### Test Cases (WITH SKU feature)

#### 7.1 Happy Path - SKU Selection
- [ ] Select SKU from autocomplete
- [ ] Verify name auto-fills
- [ ] Verify category auto-fills
- [ ] Verify storage location auto-fills
- [ ] Verify unit auto-fills
- [ ] Verify unit price auto-fills
- [ ] Verify reorder level auto-fills
- [ ] Visual indicators show auto-filled fields
- [ ] Fill remaining fields (supplier, batch, dates, quantity)
- [ ] Submit form
- [ ] Verify raw material created with skuReferenceId
- [ ] Check table shows SKU badge

#### 7.2 Manual Override
- [ ] Select SKU (auto-fills fields)
- [ ] Manually change name - should allow override
- [ ] Manually change category - should allow override
- [ ] Manually change unit price - should allow override
- [ ] Submit form
- [ ] Verify overridden values saved, not SKU values

#### 7.3 No SKU Selection
- [ ] Leave SKU field empty
- [ ] Fill all fields manually
- [ ] Submit form
- [ ] Verify raw material created without skuReferenceId
- [ ] Check table shows "-" in SKU column

#### 7.4 Edit Existing
- [ ] Edit raw material created WITH SKU
  - [ ] SKU shown in form
  - [ ] Can change SKU to different one
  - [ ] Can remove SKU
  - [ ] Can keep SKU and update other fields
- [ ] Edit raw material created WITHOUT SKU
  - [ ] Can add SKU reference
  - [ ] Form works normally

#### 7.5 SKU Reference Deletion
- [ ] Create raw material with SKU reference
- [ ] Delete the SKU reference
- [ ] Verify raw material still exists and displays correctly
- [ ] Edit raw material - should work (skuReference will be null)

#### 7.6 Multi-Tenant Security
- [ ] User A creates raw material with SKU from their tenant
- [ ] User B (different tenant) cannot see User A's raw materials
- [ ] User B cannot select User A's SKU references
- [ ] API properly validates tenant ownership

### Acceptance Criteria
- All SKU-based workflows function correctly
- No errors in console
- No breaking changes to existing functionality

---

## Rollback Plan

### If Regression Detected
1. **Immediate**: Revert feature flag (if implemented) or hide SKU field with CSS
2. **Database**: No rollback needed - skuReferenceId is nullable
3. **Code**: Revert commits related to SKU auto-fill
4. **Communication**: Notify users feature is temporarily disabled

### Feature Flag (Optional Enhancement)
Add environment variable to enable/disable SKU feature:
```typescript
// frontend/.env
VITE_ENABLE_SKU_AUTOFILL=true

// Use in code
const skuFeatureEnabled = import.meta.env.VITE_ENABLE_SKU_AUTOFILL === 'true';

{skuFeatureEnabled && (
  <Grid item xs={12}>
    {/* SKU Autocomplete */}
  </Grid>
)}
```

---

## Success Metrics

### Before Implementation
- Average time to create raw material: ~X minutes
- Fields manually entered: 12

### After Implementation (Expected)
- Average time to create raw material with SKU: ~Y minutes (50% reduction)
- Fields manually entered with SKU: 6 (batch-specific only)
- Fields auto-filled: 6
- Adoption rate: Track % of raw materials created with SKU reference

---

## Implementation Checklist

### Frontend
- [ ] Step 1: Add SKU autocomplete to form
- [ ] Step 2: Implement auto-fill handler
- [ ] Step 2: Add visual indicators for auto-filled fields
- [ ] Step 3: (Optional) Add "Create New SKU" quick action
- [ ] Step 5: Add SKU column to table
- [ ] Step 5: Update TypeScript types

### Backend
- [ ] Step 4: Update validation schemas (add skuReferenceId)
- [ ] Step 4: Update create method (save skuReferenceId)
- [ ] Step 4: Update update method (save skuReferenceId)
- [ ] Step 4: Update getAll method (include skuReference)
- [ ] Step 4: Add multi-tenant validation for SKU references

### Testing
- [ ] Step 6: Run all regression tests (existing workflows)
- [ ] Step 7: Test all SKU-based workflows
- [ ] Step 7: Verify multi-tenant isolation
- [ ] Step 7: Test edge cases (null, delete, override)

### Documentation
- [x] Implementation guide created
- [ ] Update user documentation
- [ ] Add inline code comments
- [ ] Update API documentation

---

## Notes for Implementation

### Best Practices
1. **Implement one step at a time** - test each before moving to next
2. **Commit frequently** - easier to rollback specific changes
3. **Test manually after each step** - don't wait until the end
4. **Keep existing code intact** - only add new functionality
5. **Handle null gracefully** - everywhere skuReference might be used

### Common Pitfalls to Avoid
- ❌ Making SKU field required
- ❌ Breaking existing validation rules
- ❌ Not handling null skuReferenceId
- ❌ Forgetting multi-tenant filtering on SKU queries
- ❌ Auto-filling fields without allowing override
- ❌ Not testing without SKU selection

### Code Review Checklist
- [ ] All new fields are optional
- [ ] No breaking changes to existing APIs
- [ ] Multi-tenant security enforced
- [ ] Null values handled everywhere
- [ ] Visual feedback for users
- [ ] TypeScript types updated
- [ ] No console errors or warnings

---

## Summary

This implementation adds SKU-based auto-fill as a **completely optional speed enhancement** to raw material creation. The key principle is **zero regression** - everything that worked before must continue working identically. Users can choose to use SKU references for speed, or continue creating raw materials manually as they always have.
