import { Router } from 'express';
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeCost,
  updateRecipeCost,
  updateAllRecipeCosts,
  getWhatCanIMake
} from '../controllers/recipeController';
import { normalizeUnitsMiddleware } from '../middleware/unitValidation';

const router = Router();

// Recipe CRUD routes
router.get('/', getRecipes);
router.get('/what-can-i-make', getWhatCanIMake);
router.get('/:id', getRecipeById);
router.get('/:id/cost', getRecipeCost);
router.put('/:id/cost', updateRecipeCost);
router.put('/costs/update-all', updateAllRecipeCosts);
router.post('/', normalizeUnitsMiddleware, createRecipe);
router.put('/:id', normalizeUnitsMiddleware, updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;
