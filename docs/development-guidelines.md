# Development Guidelines

## 🚨 CRITICAL: Read Before Coding

These guidelines are mandatory for all development work. Following them ensures code quality, maintainability, and project consistency.

## 🎯 Core Development Principles

### 1. Project Setup

#### Automated Setup (Recommended)

The project includes a setup script `run.sh` that automates the entire development environment setup:

```bash
./run.sh
```

This script will:

- Install all dependencies (root, backend, and frontend)
- Set up environment configurations
- Initialize and seed the database
- Start development servers

Requirements:

- Node.js and npm
- PostgreSQL (running)

The script includes error checking and will guide you through any missing requirements.

#### Manual Setup

If you prefer manual setup, follow these steps:

1. Install dependencies in root, backend, and frontend
2. Configure environment variables
3. Run database migrations and seed
4. Start development servers

See detailed steps in the project README.md

### 2. Real API Only - NO EXCEPTIONS

**✅ ALWAYS USE:**

- `import { api } from '../services/realApi';`
- Real database data from PostgreSQL
- Actual HTTP requests to `http://localhost:8000/api`
- Persistent data that survives page refreshes
- Real validation and error handling from backend

**❌ NEVER USE:**

- `import { api } from '../services/mockApi';`
- Mock data or in-memory arrays
- Fake/simulated API responses
- Temporary data that resets on refresh

**Why:** All features must work with actual database constraints and be production-ready, not demo-ready.

### 1b. Backend + Frontend Parity — No Frontend-only Enums

- All domain attributes (enums, fields like production status) MUST be modeled in the database schema and exposed by the backend API.
- Do not introduce UI-only enums, temp fields, or client-only state for persistent data.
- Changes must be implemented end-to-end: Prisma schema + migrations → controllers/services → frontend types → UI.
- PRs that add attributes in the frontend without backend support will be rejected.

Checklist for new attributes:

- [ ] Prisma schema updated and migration created/applied
- [ ] Controller DTO validation (Joi/Zod) updated
- [ ] API filtering/query support as needed
- [ ] Frontend types and services updated
- [ ] UI added/updated with accessible display
- [ ] Docs updated (API Reference, UI Guidelines, Changelog)

### 2. Mandatory Testing Requirements

**Every feature MUST include:**

**Backend API Tests:**

- Happy path (successful operations)
- Error conditions (invalid inputs, missing data)
- Edge cases (boundaries, large datasets)
- Database constraint validation
- HTTP status code verification

**Frontend Component Tests:**

- Component rendering tests
- User interaction tests
- State management tests
- Error handling tests

**Before marking ANY feature as complete:**

- All tests must pass
- Code coverage must be maintained
- API endpoints must be functional

### 3. Code Quality Standards

**TypeScript Usage:**

- Strict typing enabled
- No `any` types except in exceptional documented cases
- Proper interface definitions for all data structures
- Generic types where appropriate

**Code Structure:**

- Functions must be documented with JSDoc
- Complex logic must have explanatory comments
- File organization follows established patterns
- Consistent naming conventions

**Error Handling:**

- All API calls must have proper error handling
- User-friendly error messages
- Proper HTTP status codes
- Graceful degradation when possible

## 🧪 Testing Requirements

### Backend Testing

**Location:** `/backend/test-*.js` files

**Test Structure:**

```javascript
// 1. Server health check
console.log('🔍 Checking server health...');
// 2. Test actual endpoints
console.log('✅ Testing [Feature] API...');
// 3. Verify responses and data
console.log('✅ All tests passed!');
```

**Command:** `cd backend && node test-[feature].js`

### Frontend Testing

**Location:** `/frontend/src/**/*.test.tsx` files

**Test Requirements:**

- Component rendering
- User interactions
- API integration
- Error scenarios

**Command:** `cd frontend && npm run test`

### Test-Driven Development Process

1. **Before Coding:** Write test cases for expected functionality
2. **During Coding:** Run tests frequently to ensure progress
3. **After Coding:** Verify all tests pass and add edge case tests
4. **Before Commit:** Run full test suite to prevent regressions

## 🎨 UI/UX Standards

### Component Guidelines

**Material-UI Usage:**

- Use established component patterns
- Maintain responsive design principles
- Follow accessibility best practices
- Consistent spacing and typography

**Responsive Design:**

- Mobile-first development approach
- Test on multiple screen sizes
- Use Material-UI breakpoints system
- Optimize for touch interfaces

**State Management:**

- Use React hooks for local state
- Proper loading states for async operations
- Error boundaries for component errors
- Optimistic updates where appropriate

### Design Patterns

**Forms:**

- Action buttons at the top for accessibility
- Proper validation feedback
- Loading states during submission
- Clear error messages

**Tables:**

- Mobile-responsive with card views
- Sorting and filtering capabilities
- Pagination for large datasets
- Loading skeletons

**Navigation:**

- Clear breadcrumbs
- Consistent menu structure
- Active state indicators
- Responsive navigation patterns

## 📝 Documentation Requirements

### Code Documentation

**Required for all functions:**

```typescript
/**
 * Brief description of what the function does
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws Description of possible errors
 */
```

**Required for components:**

```typescript
/**
 * Component description and purpose
 * @param props - Component props interface
 * @returns JSX.Element
 */
```

### Feature Documentation

**After completing any feature:**

1. **Update API Reference** - Document new endpoints and data models
2. **Update Development Progress** - Add completion entry with details
3. **Update UI Guidelines** - Document new patterns or components
4. **Update Technical Architecture** - Note any structural changes

### Commit Guidelines

**Commit Message Format:**

```text
feat(scope): brief description

- Bullet point of what was added/changed
- Include testing information
- Note any breaking changes
- Reference related issues/PRs
```

## 🔧 Development Environment

### Required Setup

**Backend Server:**

- Must run on `http://localhost:8000`
- PostgreSQL database must be accessible
- All API endpoints must be functional
- Environment variables properly configured

**Frontend Development:**

- Vite development server on `http://localhost:3002`
- Hot module replacement enabled
- TypeScript compilation working
- ESLint and Prettier configured

### Development Workflow

1. **Start Development Servers:**

   ```bash
   npm run dev  # Starts both frontend and backend
   ```

2. **Before Coding:**
   - Read relevant documentation
   - Check development progress for current status
   - Understand existing patterns and standards

3. **During Development:**
   - Follow TDD approach
   - Run tests frequently
   - Check for ESLint errors
   - Test on multiple screen sizes

4. **Before Committing:**
   - Run full test suite
   - Update documentation
   - Add development progress entry
   - Verify all guidelines followed

## ⚠️ Common Pitfalls to Avoid

1. **Using Mock Data** - Always use real API and database
2. **Skipping Tests** - Tests are mandatory, not optional
3. **Poor Error Handling** - Always handle errors gracefully
4. **Breaking Responsive Design** - Test on mobile devices
5. **Inconsistent Patterns** - Follow established UI/UX guidelines
6. **Missing Documentation** - Update docs with every feature
7. **Ignoring TypeScript Errors** - Fix all type errors before committing
8. **API Response Mismatches** - Ensure backend responses match frontend expectations
9. **Missing API Structure Tests** - Add tests to validate response structures
10. **Nullable Values Handling** - Always handle potential null/undefined values

## 🎯 Quality Gates

**Before any code can be considered complete:**

- ✅ All tests pass (backend and frontend)
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Responsive design verified
- ✅ Error handling implemented
- ✅ Documentation updated
- ✅ Development progress recorded
- ✅ Real API integration confirmed

**These guidelines ensure every feature is production-ready and maintains project quality standards.**
