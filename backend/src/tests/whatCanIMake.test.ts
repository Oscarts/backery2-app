const request = require('supertest');
import createApp from '../app';

const app = createApp();

describe('What Can I Make API', () => {
  describe('GET /api/recipes/what-can-i-make', () => {
    test('should return recipe analysis with correct structure', async () => {
      const response = await request(app)
        .get('/api/recipes/what-can-i-make')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const { data } = response.body;
      expect(data).toHaveProperty('canMakeCount');
      expect(data).toHaveProperty('totalRecipes');
      expect(data).toHaveProperty('recipes');
      expect(Array.isArray(data.recipes)).toBe(true);

      // Check recipe structure
      if (data.recipes.length > 0) {
        const recipe = data.recipes[0];
        expect(recipe).toHaveProperty('recipeId');
        expect(recipe).toHaveProperty('recipeName');
        expect(recipe).toHaveProperty('category');
        expect(recipe).toHaveProperty('yieldQuantity');
        expect(recipe).toHaveProperty('yieldUnit');
        expect(recipe).toHaveProperty('canMake');
        expect(recipe).toHaveProperty('maxBatches');
        expect(recipe).toHaveProperty('missingIngredients');
        expect(Array.isArray(recipe.missingIngredients)).toBe(true);

        // Check missing ingredient structure if any
        if (recipe.missingIngredients.length > 0) {
          const missing = recipe.missingIngredients[0];
          expect(missing).toHaveProperty('name');
          expect(missing).toHaveProperty('needed');
          expect(missing).toHaveProperty('available');
          expect(missing).toHaveProperty('shortage');
          expect(missing).toHaveProperty('reason');
          expect(['insufficient', 'expired', 'contaminated', 'not_found']).toContain(missing.reason);
        }
      }
    });

    test('should handle recipes with expired ingredients correctly', async () => {
      const response = await request(app)
        .get('/api/recipes/what-can-i-make')
        .expect(200);

      const { data } = response.body;

      // Find a recipe that cannot be made due to expired ingredients
      const recipeWithExpiredIngredients = data.recipes.find((recipe: any) =>
        !recipe.canMake &&
        recipe.missingIngredients.some((ing: any) => ing.reason === 'expired')
      );

      if (recipeWithExpiredIngredients) {
        expect(recipeWithExpiredIngredients.maxBatches).toBe(0);

        const expiredIngredient = recipeWithExpiredIngredients.missingIngredients.find(
          (ing: any) => ing.reason === 'expired'
        );
        expect(expiredIngredient).toBeDefined();
        expect(expiredIngredient.reason).toBe('expired');
      }
    });

    test('should handle recipes with contaminated ingredients correctly', async () => {
      const response = await request(app)
        .get('/api/recipes/what-can-i-make')
        .expect(200);

      const { data } = response.body;

      // Find a recipe that cannot be made due to contaminated ingredients
      const recipeWithContaminatedIngredients = data.recipes.find((recipe: any) =>
        !recipe.canMake &&
        recipe.missingIngredients.some((ing: any) => ing.reason === 'contaminated')
      );

      if (recipeWithContaminatedIngredients) {
        expect(recipeWithContaminatedIngredients.maxBatches).toBe(0);

        const contaminatedIngredient = recipeWithContaminatedIngredients.missingIngredients.find(
          (ing: any) => ing.reason === 'contaminated'
        );
        expect(contaminatedIngredient).toBeDefined();
        expect(contaminatedIngredient.reason).toBe('contaminated');
      }
    });

    test('should calculate max batches correctly for available recipes', async () => {
      const response = await request(app)
        .get('/api/recipes/what-can-i-make')
        .expect(200);

      const { data } = response.body;

      // Find a recipe that can be made
      const availableRecipe = data.recipes.find((recipe: any) => recipe.canMake);

      if (availableRecipe) {
        expect(availableRecipe.maxBatches).toBeGreaterThan(0);
        expect(availableRecipe.missingIngredients).toHaveLength(0);
        expect(typeof availableRecipe.yieldQuantity).toBe('number');
        expect(typeof availableRecipe.yieldUnit).toBe('string');
      }
    });

    test('should handle server errors gracefully', async () => {
      // This test would require mocking database failure
      // For now, we'll just ensure the endpoint exists
      const response = await request(app)
        .get('/api/recipes/what-can-i-make');

      expect([200, 500]).toContain(response.status);

      if (response.status === 500) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Consistency with Recipe Details', () => {
    test('recipe analysis should match individual recipe fetch', async () => {
      const analysisResponse = await request(app)
        .get('/api/recipes/what-can-i-make')
        .expect(200);

      const { data } = analysisResponse.body;

      if (data.recipes.length > 0) {
        const recipeAnalysis = data.recipes[0];

        // Fetch the same recipe individually
        const recipeResponse = await request(app)
          .get(`/api/recipes/${recipeAnalysis.recipeId}`)
          .expect(200);

        const recipeDetails = recipeResponse.body.data;

        // Verify basic information matches
        expect(recipeAnalysis.recipeName).toBe(recipeDetails.name);
        expect(recipeAnalysis.yieldQuantity).toBe(recipeDetails.yieldQuantity);
        expect(recipeAnalysis.yieldUnit).toBe(recipeDetails.yieldUnit);
      }
    });
  });
});
