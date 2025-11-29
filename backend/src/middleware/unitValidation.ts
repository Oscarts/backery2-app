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
 * Normalize a unit by trimming whitespace
 */
function normalizeUnit(unit: string): string {
  return unit.trim();
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
        const normalized = normalizeUnit(req.body[field]);
        
        if (!validUnits.includes(normalized)) {
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
      for (let i = 0; i < req.body.ingredients.length; i++) {
        const ingredient = req.body.ingredients[i];
        if (ingredient.unit) {
          const normalized = normalizeUnit(ingredient.unit);
          
          if (!validUnits.includes(normalized)) {
            return res.status(400).json({
              success: false,
              error: `Invalid unit "${ingredient.unit}" for ingredient ${i + 1}`,
              validUnits: validUnits,
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
 * Validate a single unit value against database
 */
export async function validateUnit(unit: string): Promise<boolean> {
  const validUnits = await getValidUnits();
  const normalized = normalizeUnit(unit);
  return validUnits.includes(normalized);
}

/**
 * Check if a unit is valid (sync version using cache)
 */
export function isValidUnitCached(unit: string): boolean {
  if (validUnitsCache.length === 0) {
    // Cache not populated, can't validate synchronously
    return true; // Optimistic - let database constraint handle it
  }
  const normalized = normalizeUnit(unit);
  return validUnitsCache.includes(normalized);
}

/**
 * Clear the units cache (call this when units are added/updated)
 */
export function clearUnitsCache(): void {
  validUnitsCache = [];
  cacheTimestamp = 0;
}
