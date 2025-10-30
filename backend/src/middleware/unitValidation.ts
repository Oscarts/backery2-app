/**
 * Unit Validation Middleware
 * 
 * Provides Joi validation schemas and middleware for unit validation
 * across all backend endpoints.
 */

import Joi from 'joi';
import { VALID_UNIT_SYMBOLS, normalizeUnit, UnitSymbol } from '../../../shared/constants/units';
import { Request, Response, NextFunction } from 'express';

/**
 * Joi schema for unit validation
 * Only accepts valid unit symbols from the shared constants
 */
export const unitSchema = Joi.string()
  .valid(...VALID_UNIT_SYMBOLS)
  .required()
  .messages({
    'any.only': `Unit must be one of: ${VALID_UNIT_SYMBOLS.join(', ')}`,
    'any.required': 'Unit is required',
  });

/**
 * Joi schema for optional unit validation
 */
export const optionalUnitSchema = Joi.string()
  .valid(...VALID_UNIT_SYMBOLS)
  .optional()
  .messages({
    'any.only': `Unit must be one of: ${VALID_UNIT_SYMBOLS.join(', ')}`,
  });

/**
 * Middleware to normalize and validate units in request body
 * 
 * Use this middleware before controller actions to ensure
 * all units are normalized to valid symbols.
 * 
 * Example:
 *   router.post('/recipes', normalizeUnitsMiddleware, createRecipe);
 */
export const normalizeUnitsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // List of fields that might contain units
    const unitFields = ['unit', 'yieldUnit', 'targetUnit'];
    
    // Normalize unit fields in body
    for (const field of unitFields) {
      if (req.body[field]) {
        const normalized = normalizeUnit(req.body[field]);
        
        if (!normalized) {
          return res.status(400).json({
            success: false,
            error: `Invalid unit "${req.body[field]}" for field "${field}"`,
            validUnits: VALID_UNIT_SYMBOLS,
            suggestion: 'Please use one of the valid unit symbols'
          });
        }
        
        req.body[field] = normalized;
      }
    }
    
    // Normalize units in nested ingredients array (for recipes)
    if (req.body.ingredients && Array.isArray(req.body.ingredients)) {
      for (let i = 0; i < req.body.ingredients.length; i++) {
        const ingredient = req.body.ingredients[i];
        if (ingredient.unit) {
          const normalized = normalizeUnit(ingredient.unit);
          
          if (!normalized) {
            return res.status(400).json({
              success: false,
              error: `Invalid unit "${ingredient.unit}" for ingredient ${i + 1}`,
              validUnits: VALID_UNIT_SYMBOLS,
            });
          }
          
          req.body.ingredients[i].unit = normalized;
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate and normalize a single unit value
 * Throws an error if invalid
 */
export function validateUnit(unit: string): UnitSymbol {
  const normalized = normalizeUnit(unit);
  
  if (!normalized) {
    throw new Error(
      `Invalid unit "${unit}". Valid units are: ${VALID_UNIT_SYMBOLS.join(', ')}`
    );
  }
  
  return normalized;
}

/**
 * Check if a unit is valid
 */
export function isValidUnit(unit: string): boolean {
  return normalizeUnit(unit) !== null;
}
