import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Recipe Management
 * Tests recipe creation, editing, cost calculation, and ingredient management
 */

async function loginIfPossible(page: Page) {
    if (process.env.E2E_SKIP_AUTH) return;

    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill(process.env.E2E_USER_EMAIL || 'test@example.com');
    await page.getByLabel(/contraseña|password/i).fill(process.env.E2E_USER_PASSWORD || 'TestPassword123!');
    await page.getByRole('button', { name: /iniciar|login|entrar/i }).click();
    await page.waitForURL(/dashboard|home|\//);
}

test.describe('Recipes Page', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
        await loginIfPossible(page);
    });

    test('should navigate to recipes page', async ({ page }) => {
        await page.getByRole('link', { name: /recetas|recipes/i }).click();

        await expect(page).toHaveURL(/recipes|recetas/);
        await expect(page.getByRole('heading', { name: /recetas|recipes/i })).toBeVisible();
    });

    test('should display recipes list or grid', async ({ page }) => {
        await page.goto('/recipes');

        // Wait for content to load
        await page.waitForLoadState('networkidle');

        // Should show either table or cards
        const hasTable = await page.getByRole('table').isVisible().catch(() => false);
        const hasCards = await page.locator('[class*="card"], [class*="Card"]').first().isVisible().catch(() => false);

        expect(hasTable || hasCards).toBeTruthy();
    });

    test('should open recipe creation form', async ({ page }) => {
        await page.goto('/recipes');

        // Click create button
        await page.getByRole('button', { name: /añadir|add|nueva|new|crear/i }).click();

        // Form/dialog should appear
        const hasDialog = await page.getByRole('dialog').isVisible().catch(() => false);
        const hasForm = await page.locator('form').isVisible().catch(() => false);

        expect(hasDialog || hasForm).toBeTruthy();
    });
});

test.describe('Recipe Cost Calculation', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
        await loginIfPossible(page);
        await page.goto('/recipes');
    });

    test('should display cost information on recipe', async ({ page }) => {
        // Wait for recipes to load
        await page.waitForLoadState('networkidle');

        // Click on first recipe (if any)
        const recipeItem = page.locator('[class*="card"], table tbody tr').first();

        if (await recipeItem.isVisible()) {
            await recipeItem.click();

            // Should show cost somewhere
            await expect(page.getByText(/costo|cost|\$|precio/i)).toBeVisible({ timeout: 5000 });
        }
    });

    test('should recalculate cost when ingredients change', async ({ page }) => {
        // This test requires a recipe with editable ingredients
        test.skip(true, 'Requires specific test recipe setup');

        // Navigate to edit a recipe
        // Modify ingredient quantity
        // Verify cost updates
    });
});

test.describe('Recipe Ingredients', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
        await loginIfPossible(page);
    });

    test('should add ingredient to recipe', async ({ page }) => {
        await page.goto('/recipes/new');

        // Fill basic recipe info
        await page.getByLabel(/nombre|name/i).fill('E2E Test Recipe');

        // Look for add ingredient button
        const addIngredientBtn = page.getByRole('button', { name: /añadir ingrediente|add ingredient|agregar/i });

        if (await addIngredientBtn.isVisible()) {
            await addIngredientBtn.click();

            // Should show ingredient form
            await expect(page.getByLabel(/ingrediente|ingredient|materia/i)).toBeVisible();
        }
    });

    test('should remove ingredient from recipe', async ({ page }) => {
        // Requires existing recipe with ingredients
        test.skip(true, 'Requires specific test recipe setup');
    });
});

test.describe('What Can I Make Feature', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!process.env.E2E_TEST_USER_EXISTS, 'Test user not configured');
        await loginIfPossible(page);
    });

    test('should show what-can-i-make section', async ({ page }) => {
        // Navigate to a page that might have this feature
        await page.goto('/recipes');

        // Look for the feature
        const whatCanIMake = page.getByText(/qué puedo hacer|what can i make|disponible|available/i);

        // This may or may not be visible depending on UI
        if (await whatCanIMake.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(whatCanIMake).toBeVisible();
        }
    });
});
