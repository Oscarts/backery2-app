import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * Tests login, signup, logout, and session management
 */

// Test credentials - adjust based on test database setup
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from login page
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check essential UI elements
    await expect(page.getByRole('heading', { name: /iniciar sesión|login/i })).toBeVisible();
    await expect(page.getByLabel(/email|correo/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar|login|entrar/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /iniciar|login|entrar/i }).click();
    
    // Should show validation messages
    await expect(page.getByText(/obligatorio|required|email/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.getByLabel(/email|correo/i).fill('invalid@test.com');
    await page.getByLabel(/contraseña|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar|login|entrar/i }).click();
    
    // Should show error message
    await expect(page.getByText(/inválido|invalid|error|incorrect/i)).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to signup page', async ({ page }) => {
    // Click signup link
    await page.getByRole('link', { name: /registrar|signup|crear cuenta|register/i }).click();
    
    // Should be on signup page
    await expect(page).toHaveURL(/signup|register/);
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // This test requires a valid test user in the database
    // Skip if no test user exists
    test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
    
    await page.getByLabel(/email|correo/i).fill(TEST_USER.email);
    await page.getByLabel(/contraseña|password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /iniciar|login|entrar/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard|home|\//);
    await expect(page.getByText(/dashboard|panel|inicio/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected routes
    const protectedRoutes = [
      '/dashboard',
      '/inventory',
      '/raw-materials',
      '/finished-products',
      '/recipes',
      '/production',
      '/orders',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    }
  });
});

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should display signup form correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /registrar|signup|crear/i })).toBeVisible();
    await expect(page.getByLabel(/nombre|name/i)).toBeVisible();
    await expect(page.getByLabel(/email|correo/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i).first()).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    // Enter weak password
    await page.getByLabel(/nombre|name/i).fill('Test User');
    await page.getByLabel(/email|correo/i).fill('newuser@test.com');
    
    // Get password fields
    const passwordFields = page.getByLabel(/contraseña|password/i);
    await passwordFields.first().fill('weak');
    
    // Submit and check for validation error
    await page.getByRole('button', { name: /registrar|signup|crear/i }).click();
    
    // Should show password requirement message
    await expect(page.getByText(/mínimo|minimum|characters|caracteres|strong/i)).toBeVisible();
  });
});
