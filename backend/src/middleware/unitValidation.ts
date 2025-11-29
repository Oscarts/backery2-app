/**
 * Unit Validation Middleware
 * 
 * Provides validation middleware for unit validation across all backend endpoints.
 * Uses database units for validation to support dynamic unit management.
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache valid units to avoid repeated database queries
let validUnitsCache: string[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get valid unit symbols from database (with caching)
 */
async function getValidUnits(): Promise<string[]> {
  const now = Date.now();

  // Return cached value if still valid
  if (validUnitsCache.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
    return validUnitsCache;
  }

  // Fetch from database
  const units = await prisma.unit.findMany({
    where: { isActive: true },
    select: { symbol: true }
  });

  validUnitsCache = units.map(u => u.symbol);
  cacheTimestamp = now;

  return validUnitsCache;
}

/**
 * Normalize a unit by trimming whitespace and finding case-insensitive match
 */
async function normalizeUnit(unit: string): Promise<string | null> {
  const trimmed = unit.trim();
  const validUnits = await getValidUnits();
  
  // First try exact match
  if (validUnits.includes(trimmed)) {
    return trimmed;
  }
  
  // Try case-insensitive match
  const lowerUnit = trimmed.toLowerCase();
  const matched = validUnits.find(u => u.toLowerCase() === lowerUnit);
  
  return matched || null;
}

/**
 * Middleware to validate units in request body
 * 
 * Use this middleware before controller actions to ensure
 * all units are valid symbols from the database.
 * 
 * Example:
 *   router.post('/recipes', normalizeUnitsMiddleware, createRecipe);
 */
export const normalizeUnitsMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get valid units from database
    const validUnits = await getValidUnits();

    // List of fields that might contain units
    const unitFields = ['unit', 'yieldUnit', 'targetUnit'];

    // Validate unit fields in body
    for (const field of unitFields) {
      if (req.body[field]) {
        const normalized = await normalizeUnit(req.body[field]);

        if (!normalized) {
          return res.status(400).json({
            success: false,
            error: `Invalid unit "${req.body[field]}" for field "${field}"`,
            validUnits: validUnits,
            suggestion: 'Please use one of the valid unit symbols from the Units settings'
          });
        }

        req.body[field] = normalized;
      }
    }

    // Validate units in nested ingredients array (for recipes)
    if (req.body.ingredients && Array.isArray(req.body.ingredients)) {
      console.log('🔍 Validating ingredient units...');
      console.log('   Valid units:', validUnits);
      console.log('   Number of ingredients:', req.body.ingredients.length);
      
      for (let i = 0; i < req.body.ingredients.length; i++) {
        const ingredient = req.body.ingredients[i];
        console.log(`   Ingredient ${i}:`, JSON.stringify(ingredient, null, 2));
        
        if (ingredient.unit) {
          const normalized = await normalizeUnit(ingredient.unit);
          console.log(`   - Original unit: "${ingredient.unit}"`);
          console.log(`   - Normalized unit: "${normalized}"`);
          console.log(`   - Is valid? ${normalized !== null}`);

          if (!normalized) {
            console.error(`   ❌ INVALID UNIT: "${ingredient.unit}"`);
            return res.status(400).json({
              success: false,
              error: `Invalid unit "${ingredient.unit}" for ingredient ${i + 1}`,
              validUnits: validUnits,
            });
          }

          req.body.ingredients[i].unit = normalized;
        }
      }
      console.log('✅ All ingredient units validated successfully');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate a single unit value against database
 */
export async function validateUnit(unit: string): Promise<boolean> {
  const normalized = await normalizeUnit(unit);
  return normalized !== null;
}

/**
 * Check if a unit is valid (sync version using cache)
 */
export async function isValidUnitCached(unit: string): Promise<boolean> {
  const normalized = await normalizeUnit(unit);
  return normalized !== null;
}
  return validUnitsCache.includes(normalized);
}

/**
 * Clear the units cache (call this when units are added/updated)
 */
export function clearUnitsCache(): void {
  validUnitsCache = [];
  cacheTimestamp = 0;
}
