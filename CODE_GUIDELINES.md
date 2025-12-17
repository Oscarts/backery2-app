# Code Guidelines & Best Practices

## 🚨 CRITICAL RULES - NEVER VIOLATE THESE

### Data Safety First
- **NEVER run destructive database commands without explicit user confirmation**
- **NEVER use `--force-reset`, `DROP DATABASE`, or similar without backup verification**
- **ALWAYS check if data exists before suggesting destructive operations**
- **ALWAYS create backups before schema migrations or risky operations**
- **NEVER assume the database is empty or test data**

Note: See `docs/DB_RESET_INCIDENT.md` for a recent example of a migration failure and remediation steps. Use that document as a runbook when performing destructive DB operations.

### Development Process
- **ALWAYS verify current state before making changes**
  - Check what exists in the database
  - Check what files are present
  - Check what code is currently running
- **ALWAYS test changes in isolation before applying them**
- **ALWAYS preserve existing data and functionality**
- **NEVER introduce breaking changes without migration path**

### Multi-Tenant Security (CRITICAL)
- **ALWAYS filter by `clientId` in database queries**
- **NEVER allow cross-tenant data access**
- **ALWAYS use `req.user!.clientId` for tenant isolation**
- **ALWAYS use `findFirst` with `clientId` filter instead of `findUnique`**
- **VERIFY tenant isolation in all CRUD operations (GET, CREATE, UPDATE, DELETE)**

## 📋 How to Request Safe Development

### When asking for database changes:
```
"Before making any database changes:
1. Show me what data currently exists
2. Create a backup strategy
3. Explain the impact
4. Wait for my approval"
```

### When asking for code changes:
```
"Please audit [feature/controller] following CODE_GUIDELINES.md:
1. Check current implementation
2. Identify issues without making changes
3. Propose fixes with explanation
4. Wait for approval before implementing"
```

### When debugging issues:
```
"Debug [issue] following CODE_GUIDELINES.md:
1. Check current state first
2. Verify what's working
3. Identify root cause
4. Propose minimal fix"
```

## 🛡️ Security Audit Checklist

### For Every Controller/Route:
- [ ] All GET operations filter by `clientId`
- [ ] All CREATE operations set `clientId` from `req.user!.clientId`
- [ ] All UPDATE operations verify `clientId` match
- [ ] All DELETE operations verify `clientId` match
- [ ] Nested queries include `clientId` filters
- [ ] Related data queries check tenant ownership
- [ ] No direct access by ID without `clientId` verification

### Authentication & Authorization:
- [ ] JWT tokens include `clientId`
- [ ] Middleware verifies token and sets `req.user`
- [ ] Protected routes use authentication middleware
- [ ] Role-based permissions checked where needed
- [ ] Password hashing uses bcrypt with salt rounds >= 10

## 💻 Code Quality Standards

### TypeScript Best Practices:
- **Use strong typing** - avoid `any`, use proper interfaces/types
- **Handle errors properly** - try/catch with meaningful messages
- **Validate input** - check required fields, types, formats
- **Return consistent responses** - use standard API response format
- **Document complex logic** - add comments for non-obvious code

### Database Operations:
```typescript
// ✅ CORRECT - Multi-tenant safe
const items = await prisma.item.findMany({
  where: { 
    clientId: req.user!.clientId,
    // other filters
  }
});

// ❌ WRONG - No tenant isolation
const items = await prisma.item.findMany({
  where: { 
    // missing clientId filter
  }
});

// ✅ CORRECT - Safe update with verification
const item = await prisma.item.findFirst({
  where: { 
    id,
    clientId: req.user!.clientId 
  }
});
if (!item) throw new Error('Not found');
const updated = await prisma.item.update({
  where: { id },
  data: { ...updates }
});

// ❌ WRONG - Direct update without tenant check
const updated = await prisma.item.update({
  where: { id },
  data: { ...updates }
});
```

### API Controller Pattern:
```typescript
// Standard CRUD operations must follow this pattern:

export const getItems = async (req: Request, res: Response) => {
  try {
    // 1. Extract query params
    const { page = 1, limit = 10, search } = req.query;
    
    // 2. Build where clause with clientId
    const where = {
      clientId: req.user!.clientId,
      // Add other filters
    };
    
    // 3. Execute query with pagination
    const items = await prisma.item.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { /* relations */ }
    });
    
    // 4. Get total count
    const total = await prisma.item.count({ where });
    
    // 5. Return standard response
    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve items',
      details: error.message 
    });
  }
};
```

## 🧪 Testing Requirements

### Before Committing:
- [ ] Code builds without errors (`npm run build`)
- [ ] Type checks pass (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Existing tests pass
- [ ] New functionality has tests
- [ ] Manual testing completed

### Database Testing:
- [ ] Test with multiple clients/tenants
- [ ] Verify data isolation
- [ ] Test edge cases (empty data, large datasets)
- [ ] Verify migrations work correctly

## 📝 Documentation Standards

### Code Comments:
```typescript
/**
 * Retrieves paginated list of items for current client
 * @param req - Express request with authenticated user
 * @param res - Express response
 * @returns JSON with items array and pagination metadata
 * @security Filters by req.user.clientId for multi-tenant isolation
 */
```

### API Changes:
- Document new endpoints in API docs
- Update Postman/API collections
- Add examples of request/response
- Note breaking changes clearly

### Database Changes:
- Document schema changes in migration files
- Explain why change was needed
- Note any data transformations required
- Provide rollback instructions

## 🔄 Git Workflow

### Branch Naming:
- `feature/scope-description` - New features
- `fix/scope-description` - Bug fixes  
- `security/scope-description` - Security updates
- `refactor/scope-description` - Code improvements

### Commit Messages:
```
type(scope): Short description

- Detailed change 1
- Detailed change 2
- Tests added/updated
- Security implications addressed
```

Types: `feat`, `fix`, `security`, `refactor`, `docs`, `test`, `chore`

### Before Push:
1. Review all changes in diff
2. Run tests locally
3. Verify no sensitive data in commits
4. Ensure commits are logical and atomic
5. Rebase if needed to clean history

## ⚠️ Common Pitfalls to Avoid

### Database:
- ❌ Using `findUnique` without `clientId` check afterward
- ❌ Deleting data without WHERE clause
- ❌ Running migrations without backup
- ❌ Hardcoding IDs or client references
- ❌ Not handling foreign key constraints

### Security:
- ❌ Trusting client-provided `clientId`
- ❌ Exposing internal IDs in URLs without validation
- ❌ Not sanitizing user input
- ❌ Logging sensitive data (passwords, tokens)
- ❌ Missing authentication on protected routes

### Code Quality:
- ❌ Catching errors without handling them
- ❌ Using `any` type excessively
- ❌ Not validating required fields
- ❌ Inconsistent error messages
- ❌ Leaving console.logs in production code

## 📚 Reference Architecture

### Project Structure:
```
backend/
├── src/
│   ├── controllers/     # Request handlers with tenant isolation
│   ├── middleware/      # Auth, validation, error handling
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   └── utils/           # Helpers and utilities
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Sample data (never destructive)
└── tests/               # Test suites

frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API client services
│   └── utils/           # Frontend utilities
```

### Multi-Tenant Data Model:
- Every tenant-specific table has `clientId` foreign key
- `Client` table is the root of tenant hierarchy
- `User` belongs to one `Client`
- All CRUD operations filter by current user's `clientId`

## 🎯 Summary: The Golden Rules

1. **NEVER delete data without confirmation and backup**
2. **ALWAYS filter by clientId in multi-tenant queries**
3. **ALWAYS verify current state before making changes**
4. **ALWAYS test changes before committing**
5. **ALWAYS handle errors gracefully**
6. **ALWAYS use strong typing**
7. **ALWAYS document complex logic**
8. **ALWAYS think about security implications**
9. **ALWAYS preserve backward compatibility**
10. **ALWAYS ask for clarification when uncertain**

---

## How to Ensure Compliance

**When requesting work from AI/assistants, use this format:**

```
Follow CODE_GUIDELINES.md strictly:
[Your request here]

Requirements:
1. Check current state first
2. No destructive operations without approval
3. Maintain multi-tenant security
4. Test before implementing
5. Provide explanation of changes
```

This ensures safe, secure, and maintainable code development.
