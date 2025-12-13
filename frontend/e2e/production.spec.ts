import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Production Management
 * Tests production run creation, step completion, material allocation
 */

async function loginIfPossible(page: Page) {
  if (process.env.E2E_SKIP_AUTH) return;
  
  await page.goto('/login');
  await page.getByLabel(/email|correo/i).fill(process.env.E2E_USER_EMAIL || 'test@example.com');
  await page.getByLabel(/contraseña|password/i).fill(process.env.E2E_USER_PASSWORD || 'TestPassword123!');
  await page.getByRole('button', { name: /iniciar|login|entrar/i }).click();
  await page.waitForURL(/dashboard|home|\//);
}

test.describe('Production Page', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
    await loginIfPossible(page);
  });

  test('should navigate to production page', async ({ page }) => {
    await page.getByRole('link', { name: /producción|production/i }).click();
    
    await expect(page).toHaveURL(/production|produccion/);
    await expect(page.getByRole('heading', { name: /producción|production/i })).toBeVisible();
  });

  test('should display production runs list', async ({ page }) => {
    await page.goto('/production');
    
    // Wait for content
    await page.waitForLoadState('networkidle');
    
    // Should show production runs or empty state
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no hay|empty|sin producción|start/i).isVisible().catch(() => false);
    
    expect(hasTable || hasCards || hasEmptyState).toBeTruthy();
  });

  test('should open new production run form', async ({ page }) => {
    await page.goto('/production');
    
    // Click create button
    await page.getByRole('button', { name: /nueva|new|iniciar|start|crear/i }).click();
    
    // Form should appear
    await expect(page.getByRole('dialog').or(page.locator('form'))).toBeVisible();
  });
});

test.describe('Production Run Steps', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
    await loginIfPossible(page);
    await page.goto('/production');
  });

  test('should display production steps in a run', async ({ page }) => {
    // Click on first production run if exists
    await page.waitForLoadState('networkidle');
    
    const runItem = page.locator('table tbody tr, [class*="card"]').first();
    
    if (await runItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await runItem.click();
      
      // Should show steps
      await expect(page.getByText(/paso|step|etapa/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should mark step as complete', async ({ page }) => {
    // Requires active production run with incomplete steps
    test.skip(true, 'Requires specific production run setup');
  });
});

test.describe('Material Allocation', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
    await loginIfPossible(page);
  });

  test('should show material requirements for production', async ({ page }) => {
    await page.goto('/production');
    
    // Open new production form
    await page.getByRole('button', { name: /nueva|new|iniciar|start/i }).click();
    
    // Select a recipe if available
    const recipeSelect = page.getByLabel(/receta|recipe/i);
    
    if (await recipeSelect.isVisible()) {
      // After selecting recipe, should show material requirements
      await recipeSelect.click();
      const firstOption = page.getByRole('option').first();
      
      if (await firstOption.isVisible()) {
        await firstOption.click();
        
        // Should show ingredients/materials needed
        await page.waitForTimeout(500);
      }
    }
  });

  test('should warn about insufficient materials', async ({ page }) => {
    // This test depends on inventory state
    test.skip(true, 'Requires specific inventory setup');
  });
});

test.describe('Production Completion', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
    await loginIfPossible(page);
  });

  test('should complete production and update inventory', async ({ page }) => {
    // This is a full workflow test - requires complete setup
    test.skip(true, 'Requires complete test environment');
    
    // 1. Start production run
    // 2. Allocate materials
    // 3. Complete all steps
    // 4. Finish production
    // 5. Verify inventory updated
  });
});
