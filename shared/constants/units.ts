/**
 * Shared Unit Constants
 * 
 * SINGLE SOURCE OF TRUTH for all unit definitions across the application.
 * This file is shared between frontend and backend to ensure consistency.
 * 
 * Usage:
 * - Backend: Import for validation schemas
 * - Frontend: Import for dropdowns and display
 * - Both: Type-safe unit handling
 */

export const UNIT_SYMBOLS = {
  // Weight
  GRAM: 'g',
  KILOGRAM: 'kg',
  OUNCE: 'oz',
  POUND: 'lb',
  
  // Volume
  MILLILITER: 'ml',
  LITER: 'L',
  TEASPOON: 'tsp',
  TABLESPOON: 'tbsp',
  CUP: 'cup',
  
  // Count
  PIECE: 'pcs',
  DOZEN: 'dz',
  PACKAGE: 'pkg',
} as const;

export type UnitSymbol = typeof UNIT_SYMBOLS[keyof typeof UNIT_SYMBOLS];

export interface UnitDefinition {
  symbol: UnitSymbol;
  name: string;
  pluralName: string;
  category: 'weight' | 'volume' | 'count';
  description?: string;
}

/**
 * Complete unit definitions with metadata
 */
export const UNITS: Record<string, UnitDefinition> = {
  // Weight Units
  GRAM: {
    symbol: UNIT_SYMBOLS.GRAM,
    name: 'Gram',
    pluralName: 'Grams',
    category: 'weight',
    description: 'Metric unit of mass'
  },
  KILOGRAM: {
    symbol: UNIT_SYMBOLS.KILOGRAM,
    name: 'Kilogram',
    pluralName: 'Kilograms',
    category: 'weight',
    description: '1000 grams'
  },
  OUNCE: {
    symbol: UNIT_SYMBOLS.OUNCE,
    name: 'Ounce',
    pluralName: 'Ounces',
    category: 'weight',
    description: 'Imperial unit of weight'
  },
  POUND: {
    symbol: UNIT_SYMBOLS.POUND,
    name: 'Pound',
    pluralName: 'Pounds',
    category: 'weight',
    description: '16 ounces'
  },
  
  // Volume Units
  MILLILITER: {
    symbol: UNIT_SYMBOLS.MILLILITER,
    name: 'Milliliter',
    pluralName: 'Milliliters',
    category: 'volume',
    description: '1/1000 of a liter'
  },
  LITER: {
    symbol: UNIT_SYMBOLS.LITER,
    name: 'Liter',
    pluralName: 'Liters',
    category: 'volume',
    description: 'Metric unit of volume'
  },
  TEASPOON: {
    symbol: UNIT_SYMBOLS.TEASPOON,
    name: 'Teaspoon',
    pluralName: 'Teaspoons',
    category: 'volume',
    description: '~5ml'
  },
  TABLESPOON: {
    symbol: UNIT_SYMBOLS.TABLESPOON,
    name: 'Tablespoon',
    pluralName: 'Tablespoons',
    category: 'volume',
    description: '~15ml or 3 teaspoons'
  },
  CUP: {
    symbol: UNIT_SYMBOLS.CUP,
    name: 'Cup',
    pluralName: 'Cups',
    category: 'volume',
    description: '~240ml'
  },
  
  // Count Units
  PIECE: {
    symbol: UNIT_SYMBOLS.PIECE,
    name: 'Piece',
    pluralName: 'Pieces',
    category: 'count',
    description: 'Individual items'
  },
  DOZEN: {
    symbol: UNIT_SYMBOLS.DOZEN,
    name: 'Dozen',
    pluralName: 'Dozens',
    category: 'count',
    description: '12 pieces'
  },
  PACKAGE: {
    symbol: UNIT_SYMBOLS.PACKAGE,
    name: 'Package',
    pluralName: 'Packages',
    category: 'count',
    description: 'Packaged units'
  },
};

/**
 * Array of all valid unit symbols
 * Use this for validation in Joi schemas
 */
export const VALID_UNIT_SYMBOLS: ReadonlyArray<UnitSymbol> = Object.values(UNIT_SYMBOLS);

/**
 * Map of legacy unit names to their correct symbols
 * Use this for data migration and normalization
 */
export const LEGACY_UNIT_MAP: Record<string, UnitSymbol> = {
  // Name variations to symbol
  'Piece': UNIT_SYMBOLS.PIECE,
  'Pieces': UNIT_SYMBOLS.PIECE,
  'piece': UNIT_SYMBOLS.PIECE,
  'pieces': UNIT_SYMBOLS.PIECE,
  'Dozen': UNIT_SYMBOLS.DOZEN,
  'dozen': UNIT_SYMBOLS.DOZEN,
  'Kilogram': UNIT_SYMBOLS.KILOGRAM,
  'kilogram': UNIT_SYMBOLS.KILOGRAM,
  'Gram': UNIT_SYMBOLS.GRAM,
  'gram': UNIT_SYMBOLS.GRAM,
  'Liter': UNIT_SYMBOLS.LITER,
  'liter': UNIT_SYMBOLS.LITER,
  'Milliliter': UNIT_SYMBOLS.MILLILITER,
  'milliliter': UNIT_SYMBOLS.MILLILITER,
  'Ounce': UNIT_SYMBOLS.OUNCE,
  'ounce': UNIT_SYMBOLS.OUNCE,
  'Pound': UNIT_SYMBOLS.POUND,
  'pound': UNIT_SYMBOLS.POUND,
  'Cup': UNIT_SYMBOLS.CUP,
  'cup': UNIT_SYMBOLS.CUP,
  'Tablespoon': UNIT_SYMBOLS.TABLESPOON,
  'tablespoon': UNIT_SYMBOLS.TABLESPOON,
  'Teaspoon': UNIT_SYMBOLS.TEASPOON,
  'teaspoon': UNIT_SYMBOLS.TEASPOON,
  'Package': UNIT_SYMBOLS.PACKAGE,
  'package': UNIT_SYMBOLS.PACKAGE,
  'pkg': UNIT_SYMBOLS.PACKAGE,
};

/**
 * Normalize a unit string to a valid symbol
 * Returns the symbol if valid, or null if invalid
 */
export function normalizeUnit(unit: string): UnitSymbol | null {
  // Check if it's already a valid symbol
  if (VALID_UNIT_SYMBOLS.includes(unit as UnitSymbol)) {
    return unit as UnitSymbol;
  }
  
  // Check legacy map
  if (unit in LEGACY_UNIT_MAP) {
    return LEGACY_UNIT_MAP[unit];
  }
  
  // Try case-insensitive lookup
  const lowerUnit = unit.toLowerCase();
  const entry = Object.entries(LEGACY_UNIT_MAP).find(
    ([key]) => key.toLowerCase() === lowerUnit
  );
  
  if (entry) {
    return entry[1];
  }
  
  return null;
}

/**
 * Get unit definition by symbol
 */
export function getUnitDefinition(symbol: UnitSymbol): UnitDefinition | undefined {
  return Object.values(UNITS).find(u => u.symbol === symbol);
}

/**
 * Format unit display with proper pluralization
 */
export function formatUnit(symbol: UnitSymbol, quantity: number = 1): string {
  const unit = getUnitDefinition(symbol);
  if (!unit) return symbol;
  
  return quantity === 1 ? unit.name : unit.pluralName;
}

/**
 * Get units grouped by category
 */
export function getUnitsByCategory() {
  return {
    weight: Object.values(UNITS).filter(u => u.category === 'weight'),
    volume: Object.values(UNITS).filter(u => u.category === 'volume'),
    count: Object.values(UNITS).filter(u => u.category === 'count'),
  };
}
