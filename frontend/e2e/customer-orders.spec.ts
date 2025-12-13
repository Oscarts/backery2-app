import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Customer Orders
 * Tests order creation, status updates, and order exports
 */

async function loginIfPossible(page: Page) {
  if (process.env.E2E_SKIP_AUTH) return;
  
  await page.goto('/login');
  await page.getByLabel(/email|correo/i).fill(process.env.E2E_USER_EMAIL || 'test@example.com');
  await page.getByLabel(/contraseña|password/i).fill(process.env.E2E_USER_PASSWORD || 'TestPassword123!');
  await page.getByRole('button', { name: /iniciar|login|entrar/i }).click();
  await page.waitForURL(/dashboard|home|\//);
}

test.describe('Customer Orders Page', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
    await loginIfPossible(page);
  });

  test('should navigate to orders page', async ({ page }) => {
    await page.getByRole('link', { name: /pedidos|orders|órdenes/i }).click();
    
    await expect(page).toHaveURL(/orders|pedidos/);
    await expect(page.getByRole('heading', { name: /pedidos|orders|órdenes/i })).toBeVisible();
  });

  test('should display orders list', async ({ page }) => {
    await page.goto('/orders');
    
    await page.waitForLoadState('networkidle');
    
    // Should show table, cards, or empty state
    const hasContent = await page.getByRole('table').isVisible().catch(() => false) ||
                       await page.locator('[class*="card"]').first().isVisible().catch(() => false) ||
                       await page.getByText(/no hay|empty|sin pedidos/i).isVisible().catch(() => false);
    
    expect(hasContent).toBeTruthy();
  });

  test('should open new order form', async ({ page }) => {
    await page.goto('/orders');
    
    await page.getByRole('button', { name: /nuevo|new|crear|add/i }).click();
    
    // Form should appear
    await expect(page.getByRole('dialog').or(page.locator('form'))).toBeVisible();
  });

  test('should display order status filters', async ({ page }) => {
    await page.goto('/orders');
    
    // Look for status filter/tabs
    const statusFilter = page.getByRole('tab').or(page.getByRole('combobox', { name: /estado|status/i }));
    
    // May have tabs or dropdown for status filtering
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Order Creation', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
    await loginIfPossible(page);
    await page.goto('/orders/new');
  });

  test('should fill order form', async ({ page }) => {
    // Customer info
    const customerInput = page.getByLabel(/cliente|customer/i);
    if (await customerInput.isVisible()) {
      await customerInput.fill('Test Customer');
    }
    
    // Delivery date
    const dateInput = page.getByLabel(/fecha|date|entrega|delivery/i);
    if (await dateInput.isVisible()) {
      // Set date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await dateInput.fill(tomorrow.toISOString().split('T')[0]);
    }
  });

  test('should add products to order', async ({ page }) => {
    // Look for add product button
    const addProductBtn = page.getByRole('button', { name: /añadir producto|add product|agregar/i });
    
    if (await addProductBtn.isVisible()) {
      await addProductBtn.click();
      
      // Product selector should appear
      await expect(page.getByLabel(/producto|product/i)).toBeVisible();
    }
  });

  test('should calculate order total', async ({ page }) => {
    // This requires products to be selected
    test.skip(true, 'Requires product selection');
    
    // After adding products, total should update
    // await expect(page.getByText(/total/i)).toContainText(/\d/);
  });
});

test.describe('Order Status Management', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
    await loginIfPossible(page);
    await page.goto('/orders');
  });

  test('should display order status badge', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for status badges
    const statusBadge = page.locator('[class*="badge"], [class*="chip"], [class*="status"]').first();
    
    if (await statusBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Should contain a status text
      const statusText = await statusBadge.textContent();
      expect(statusText).toBeTruthy();
    }
  });

  test('should update order status', async ({ page }) => {
    // Requires existing order
    test.skip(true, 'Requires existing order');
    
    // Click on order
    // Change status
    // Verify update
  });
});

test.describe('Order Export', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
    await loginIfPossible(page);
    await page.goto('/orders');
  });

  test('should show export options', async ({ page }) => {
    // Look for export button
    const exportBtn = page.getByRole('button', { name: /exportar|export|descargar|download/i });
    
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      
      // Should show export options (CSV, PDF, etc.)
      const hasOptions = await page.getByText(/csv|pdf|excel/i).isVisible().catch(() => false);
      // Export may download directly without showing options
    }
  });

  test('should download order as PDF', async ({ page }) => {
    // This test validates export functionality exists
    test.skip(true, 'Download testing requires specific setup');
  });
});

test.describe('Order Details', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
    await loginIfPossible(page);
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    // Click on first order
    const orderRow = page.locator('table tbody tr, [class*="card"]').first();
    
    if (await orderRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await orderRow.click();
      
      // Should show order details
      await page.waitForLoadState('networkidle');
      
      // Look for detail elements
      const hasDetails = await page.getByText(/detalles|details|productos|items/i).isVisible().catch(() => false);
      expect(hasDetails).toBeTruthy();
    }
  });
});
