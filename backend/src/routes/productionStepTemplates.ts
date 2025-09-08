import express from 'express';
import * as stepTemplateController from '../controllers/productionStepTemplateController';

const router = express.Router();

// Get default production step templates
router.get('/default', stepTemplateController.getDefaultStepTemplates);

// Get recipe-specific step templates
router.get('/recipe/:recipeId', stepTemplateController.getRecipeStepTemplates);

// Create custom step template
router.post('/custom', stepTemplateController.createCustomStepTemplate);

export default router;
