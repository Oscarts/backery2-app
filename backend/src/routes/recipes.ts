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

const router = Router();

// Recipe CRUD routes
router.get('/', getRecipes);
router.get('/what-can-i-make', getWhatCanIMake);
router.get('/:id', getRecipeById);
router.get('/:id/cost', getRecipeCost);
router.put('/:id/cost', updateRecipeCost);
router.put('/costs/update-all', updateAllRecipeCosts);
router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;
