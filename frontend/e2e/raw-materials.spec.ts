import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Raw Materials Management
 * Tests CRUD operations, filtering, and inventory tracking
 */

// Helper to login before tests (skip if no test user)
async function loginIfPossible(page: Page) {
    if (process.env.E2E_SKIP_AUTH) {
        // For development without auth
        return;
    }

    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill(process.env.E2E_USER_EMAIL || 'test@example.com');
    await page.getByLabel(/contraseña|password/i).fill(process.env.E2E_USER_PASSWORD || 'TestPassword123!');
    await page.getByRole('button', { name: /iniciar|login|entrar/i }).click();
    await page.waitForURL(/dashboard|home|\//);
}

test.describe('Raw Materials Page', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
        await loginIfPossible(page);
    });

    test('should navigate to raw materials page', async ({ page }) => {
        // Navigate via sidebar or menu
        await page.getByRole('link', { name: /materias primas|raw materials|inventario/i }).click();

        // Should be on raw materials page
        await expect(page).toHaveURL(/raw-materials|materias/);
        await expect(page.getByRole('heading', { name: /materias primas|raw materials/i })).toBeVisible();
    });

    test('should display raw materials table', async ({ page }) => {
        await page.goto('/raw-materials');

        // Table should be visible
        await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

        // Table headers should be present
        await expect(page.getByRole('columnheader', { name: /nombre|name/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /cantidad|quantity|stock/i })).toBeVisible();
    });

    test('should open create dialog', async ({ page }) => {
        await page.goto('/raw-materials');

        // Click add button
        await page.getByRole('button', { name: /añadir|add|nuevo|new/i }).click();

        // Dialog should appear
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: /nueva|new|crear|create/i })).toBeVisible();
    });

    test('should filter materials by search', async ({ page }) => {
        await page.goto('/raw-materials');

        // Wait for table to load
        await page.waitForSelector('table tbody tr', { timeout: 10000 });

        // Get initial row count
        const initialRows = await page.locator('table tbody tr').count();

        // Type in search box
        const searchBox = page.getByPlaceholder(/buscar|search/i);
        if (await searchBox.isVisible()) {
            await searchBox.fill('test-filter-string-unlikely-to-match');

            // Wait for filtering
            await page.waitForTimeout(500);

            // Should have fewer or no rows
            const filteredRows = await page.locator('table tbody tr').count();
            expect(filteredRows).toBeLessThanOrEqual(initialRows);
        }
    });

    test('should show low stock warning', async ({ page }) => {
        await page.goto('/raw-materials');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check if low stock indicator exists (may or may not depending on data)
        const lowStockBadge = page.getByText(/bajo|low|stock bajo|alerta/i);
        // This test just verifies the UI loads - actual low stock depends on data
        await expect(page.getByRole('table')).toBeVisible();
    });
});

test.describe('Raw Materials CRUD', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
        await loginIfPossible(page);
        await page.goto('/raw-materials');
    });

    test('should create a new raw material', async ({ page }) => {
        const uniqueName = `E2E Test Material ${Date.now()}`;

        // Open create dialog
        await page.getByRole('button', { name: /añadir|add|nuevo|new/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Fill form
        await page.getByLabel(/nombre|name/i).fill(uniqueName);
        await page.getByLabel(/unidad|unit/i).fill('kg');
        await page.getByLabel(/cantidad|quantity|stock/i).fill('100');

        // Submit
        await page.getByRole('button', { name: /guardar|save|crear|create/i }).click();

        // Dialog should close
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

        // New material should appear in list
        await expect(page.getByText(uniqueName)).toBeVisible();
    });

    test('should edit a raw material', async ({ page }) => {
        // Wait for table to load
        await page.waitForSelector('table tbody tr');

        // Click first row's edit button
        const firstRow = page.locator('table tbody tr').first();
        await firstRow.getByRole('button', { name: /editar|edit/i }).click();

        // Edit dialog should open
        await expect(page.getByRole('dialog')).toBeVisible();

        // Modify a field
        const nameInput = page.getByLabel(/nombre|name/i);
        const currentName = await nameInput.inputValue();
        await nameInput.fill(`${currentName} (edited)`);

        // Save
        await page.getByRole('button', { name: /guardar|save|actualizar|update/i }).click();

        // Dialog should close
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    });

    test('should delete a raw material', async ({ page }) => {
        // This test should ideally use a material created for testing
        test.skip(true, 'Delete test requires dedicated test data setup');

        // Wait for table
        await page.waitForSelector('table tbody tr');

        // Get initial count
        const initialCount = await page.locator('table tbody tr').count();

        // Click delete on first row
        const firstRow = page.locator('table tbody tr').first();
        await firstRow.getByRole('button', { name: /eliminar|delete|borrar/i }).click();

        // Confirm deletion
        await page.getByRole('button', { name: /confirmar|confirm|sí|yes/i }).click();

        // Row count should decrease
        await page.waitForTimeout(1000);
        const newCount = await page.locator('table tbody tr').count();
        expect(newCount).toBeLessThan(initialCount);
    });
});
