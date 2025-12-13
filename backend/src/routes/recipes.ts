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

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Get all recipes
 *     description: Retrieve all recipes for the current tenant
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 */
router.get('/', getRecipes);

/**
 * @swagger
 * /recipes/what-can-i-make:
 *   get:
 *     summary: What can I make?
 *     description: Get recipes that can be made with current inventory levels
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: List of producible recipes with quantities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       recipe:
 *                         $ref: '#/components/schemas/Recipe'
 *                       maxQuantity:
 *                         type: number
 *                         description: Maximum batches that can be made
 *                       limitingIngredient:
 *                         type: string
 */
router.get('/what-can-i-make', getWhatCanIMake);

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Get recipe by ID
 *     description: Get detailed recipe with ingredients
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe details with ingredients
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', getRecipeById);

/**
 * @swagger
 * /recipes/{id}/cost:
 *   get:
 *     summary: Get recipe cost breakdown
 *     description: Calculate detailed cost breakdown for a recipe
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cost breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMaterialCost:
 *                   type: number
 *                 overheadCost:
 *                   type: number
 *                 totalProductionCost:
 *                   type: number
 *                 costPerUnit:
 *                   type: number
 *                 ingredients:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/:id/cost', getRecipeCost);

/**
 * @swagger
 * /recipes/{id}/cost:
 *   put:
 *     summary: Update recipe cost
 *     description: Recalculate and update recipe estimated cost
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cost updated
 */
router.put('/:id/cost', updateRecipeCost);

/**
 * @swagger
 * /recipes/costs/update-all:
 *   put:
 *     summary: Update all recipe costs
 *     description: Recalculate costs for all recipes based on current ingredient prices
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: All costs updated
 */
router.put('/costs/update-all', updateAllRecipeCosts);

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Create recipe
 *     description: Create a new recipe with ingredients
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, yieldQuantity, yieldUnit, ingredients]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               instructions:
 *                 type: string
 *               yieldQuantity:
 *                 type: number
 *               yieldUnit:
 *                 type: string
 *               overheadPercentage:
 *                 type: number
 *                 default: 50
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     rawMaterialId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *     responses:
 *       201:
 *         description: Recipe created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', normalizeUnitsMiddleware, createRecipe);

/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Update recipe
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', normalizeUnitsMiddleware, updateRecipe);

/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Delete recipe
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', deleteRecipe);

export default router;
