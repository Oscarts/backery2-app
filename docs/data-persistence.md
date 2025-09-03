# Data Persistence Guidelines

## Overview

This document outlines best practices for managing data persistence in the Bakery Inventory Management application, focusing on database schema, data validation, and handling nullable values.

## Database Schema

### Schema Definition

All database tables and relationships are defined in the Prisma schema file:

```prisma
// /backend/prisma/schema.prisma
```

The schema defines models, relationships, enums, and constraints for the PostgreSQL database.

### Nullable Fields

When defining fields in the schema:

- Mark fields as optional with a `?` when they can be null
- Document why a field is nullable in comments
- Provide default values where appropriate

Example:
```prisma
model Recipe {
  id            String    @id @default(cuid())
  name          String
  description   String?   // Optional field - not all recipes need descriptions
  categoryId    String?   // Optional relationship - not all recipes need categories
  category      Category? @relation(fields: [categoryId], references: [id])
  // ...
}
```

## Data Validation

### Backend Validation

- **Controller Level**: Validate all request data before passing to the database
- **Model Level**: Use Prisma's built-in validation where possible
- **Explicit Checks**: Always check for existence of optional relationship IDs

Example:
```typescript
// Good practice
if (data.categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId }
  });
  
  if (!category) {
    return res.status(400).json({
      success: false,
      error: `Category with ID ${data.categoryId} does not exist`
    });
  }
}
```

### Frontend Validation

- Use form validation libraries (e.g., React Hook Form)
- Provide clear error messages for invalid inputs
- Handle server validation errors gracefully

## Handling Nullable Values

### Backend

1. **Default Values**: Always provide sensible defaults for nullable fields

```typescript
// When working with potentially null values
const description = recipe.description || '';
const category = recipe.category?.name || 'Uncategorized';
```

2. **Optional Chaining**: Use the `?.` operator to access properties on potentially null objects

```typescript
// Good practice
const categoryName = recipe.category?.name;

// Instead of
let categoryName;
if (recipe.category) {
  categoryName = recipe.category.name;
}
```

3. **Nullish Coalescing**: Use the `??` operator to provide defaults for null/undefined values

```typescript
const quantity = data.quantity ?? 0;
```

### Frontend

1. **Component Props**: Provide default props for React components

```tsx
interface RecipeCardProps {
  recipe: Recipe;
  showActions?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  showActions = true 
}) => {
  // ...
}
```

2. **Conditional Rendering**: Always check for existence before rendering

```tsx
{recipe.category && (
  <Typography variant="body2" color="text.secondary">
    Category: {recipe.category.name}
  </Typography>
)}
```

3. **Default Values**: Provide defaults when destructuring

```tsx
const { 
  name, 
  description = 'No description provided',
  category = { name: 'Uncategorized' } 
} = recipe;
```

## API Response Consistency

### Response Structure

All API responses should follow a consistent structure:

```typescript
// Success response
{
  success: true,
  data: T // Where T is the actual data type
}

// Error response
{
  success: false,
  error: string // Error message
}
```

### Data Structure Consistency

- Maintain consistency between database schema, API responses, and frontend types
- Document the expected structure of each API response
- Create validation tests for API response structures

Example test for API response structure:
```javascript
const response = await fetch('/api/recipes/what-can-i-make');
const data = await response.json();

assert.equal(data.success, true);
assert.ok(data.data.recipes);
assert.ok(Array.isArray(data.data.recipes));
```

## Migration Guidelines

When making schema changes:

1. Create a migration plan
2. Back up data if necessary
3. Test migration on development environment first
4. Verify data integrity after migration
5. Update all affected API endpoints
6. Update frontend components that use the data
7. Add/update tests for the modified functionality

## Common Issues to Avoid

1. **Undefined Property Access**: Always check for existence before accessing properties
2. **Inconsistent API Response Formats**: Maintain a consistent structure across all endpoints
3. **Missing Default Values**: Provide defaults for all potentially null/undefined values
4. **Poor Error Handling**: Implement proper error handling for database operations
5. **Insufficient Validation**: Validate all user inputs before saving to database
6. **Schema-Frontend Mismatches**: Keep database schema, API responses, and frontend types in sync

By following these guidelines, we can prevent issues related to data persistence, nullable values, and API response consistency.
