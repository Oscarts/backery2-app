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
interface UnitInfo {
  symbol: string;
  name: string;
}
let validUnitsCache: UnitInfo[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get valid units from database (with caching)
 * Returns both symbol and name for flexible matching
 */
async function getValidUnits(): Promise<UnitInfo[]> {
  const now = Date.now();

  // Return cached value if still valid
  if (validUnitsCache.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
    return validUnitsCache;
  }

  // Fetch from database - get both symbol and name
  const units = await prisma.unit.findMany({
    where: { isActive: true },
    select: { symbol: true, name: true }
  });

  validUnitsCache = units.map(u => ({ symbol: u.symbol, name: u.name }));
  cacheTimestamp = now;

  return validUnitsCache;
}

/**
 * Normalize a unit by matching against both symbol and name
 * Returns the symbol (canonical form) if a match is found
 * Accepts either unit symbol (kg) or name (Kilogram)
 */
function normalizeUnitSync(unit: string, validUnits: UnitInfo[]): string | null {
  const trimmed = unit.trim();
  const lowerUnit = trimmed.toLowerCase();

  // First try exact match against symbol
  const exactSymbol = validUnits.find(u => u.symbol === trimmed);
  if (exactSymbol) return exactSymbol.symbol;

  // Try case-insensitive match against symbol
  const caseInsensitiveSymbol = validUnits.find(u => u.symbol.toLowerCase() === lowerUnit);
  if (caseInsensitiveSymbol) return caseInsensitiveSymbol.symbol;

  // Try exact match against name
  const exactName = validUnits.find(u => u.name === trimmed);
  if (exactName) return exactName.symbol;

  // Try case-insensitive match against name
  const caseInsensitiveName = validUnits.find(u => u.name.toLowerCase() === lowerUnit);
  if (caseInsensitiveName) return caseInsensitiveName.symbol;

  return null;
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
    // Get valid units from database ONCE
    const validUnits = await getValidUnits();
    const validSymbols = validUnits.map(u => u.symbol);

    // List of fields that might contain units
    const unitFields = ['unit', 'yieldUnit', 'targetUnit'];

    // Validate unit fields in body
    for (const field of unitFields) {
      if (req.body[field]) {
        const normalized = normalizeUnitSync(req.body[field], validUnits);

        if (!normalized) {
          return res.status(400).json({
            success: false,
            error: `Invalid unit "${req.body[field]}" for field "${field}"`,
            validUnits: validSymbols,
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
          const normalized = normalizeUnitSync(ingredient.unit, validUnits);

          if (!normalized) {
            return res.status(400).json({
              success: false,
              error: `Invalid unit "${ingredient.unit}" for ingredient ${i + 1}`,
              validUnits: validSymbols,
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
  const normalized = normalizeUnitSync(unit, validUnits);
  return normalized !== null;
}

/**
 * Check if a unit is valid (sync version using cache)
 */
export async function isValidUnitCached(unit: string): Promise<boolean> {
  const validUnits = await getValidUnits();
  const normalized = normalizeUnitSync(unit, validUnits);
  return normalized !== null;
}

/**
 * Clear the units cache (call this when units are added/updated)
 */
export function clearUnitsCache(): void {
  validUnitsCache = [];
  cacheTimestamp = 0;
}
