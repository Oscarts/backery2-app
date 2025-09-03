# API Response Validation

## Overview

This document outlines guidelines for ensuring API response structure consistency between backend and frontend. The goal is to prevent "white screen" issues and other frontend rendering problems caused by mismatches in expected data structures.

## Recent Issue: "What Can I Make" Page White Screen

**Problem**: The frontend's "What Can I Make" page displayed a white screen due to a mismatch between:

- What the backend API returned
- What the frontend components expected

**Root Cause**:

- Backend: Returned a nested structure with `canMake` and `cannotMake` arrays
- Frontend: Expected a single flat array with a `canMake` boolean property on each item

**Solution**:

- Modified backend to return data in the format expected by the frontend
- Added a dedicated test to validate the API response structure

## API Contract Testing Guidelines

### 1. Create Tests for Response Structure

Each API endpoint should have a test that specifically validates the response structure. For example:

```javascript
// Example from test-what-can-i-make.js
async function runTests() {
  const response = await fetch('http://localhost:8000/api/recipes/what-can-i-make');
  const data = await response.json();
  
  // Check base response structure
  assert.equal(data.success, true, 'Response should have success=true');
  assert.ok(data.data, 'Response should have a data object');
  
  // Check data fields
  const analysis = data.data;
  assert.ok(typeof analysis.totalRecipes === 'number', 'totalRecipes should be a number');
  assert.ok(typeof analysis.canMakeCount === 'number', 'canMakeCount should be a number');
  assert.ok(Array.isArray(analysis.recipes), 'recipes should be an array');
  
  // Check individual item structure
  if (analysis.recipes.length > 0) {
    const recipe = analysis.recipes[0];
    assert.ok(recipe.recipeId, 'Recipe should have recipeId');
    assert.ok(recipe.recipeName, 'Recipe should have recipeName');
    // ... additional field checks
  }
}
```

### 2. Document Type Interfaces

All frontend type definitions must be documented and kept in sync with backend responses.

```typescript
// In frontend/src/types/index.ts
export interface WhatCanIMakeAnalysis {
  totalRecipes: number;
  canMakeCount: number;
  recipes: RecipeAnalysis[];
}

export interface RecipeAnalysis {
  recipeId: string;
  recipeName: string;
  category: string;
  yieldQuantity: number;
  yieldUnit: string;
  canMake: boolean;
  maxBatches: number;
  missingIngredients: MissingIngredient[];
}
```

### 3. Required Testing for New APIs

For all new API endpoints:

1. Create a test file that validates:
   - HTTP response status (200, 201, etc.)
   - Response structure matches TypeScript interface
   - All required fields exist and have correct types
   - Handling of edge cases (empty arrays, null values, etc.)

2. Add the test to `run-all-tests.js` to ensure it runs with the full test suite

## Best Practices

1. **Use TypeScript interfaces** for both frontend and backend to document API contracts
2. **Validate API responses** before returning them from the backend
3. **Test all endpoints** for structure consistency
4. **Check nullability** of properties that might not always exist
5. **Document breaking changes** to API responses in CHANGELOG.md
6. **Update tests first** when modifying API responses

By following these guidelines, we can prevent future issues with API response structure mismatches.
