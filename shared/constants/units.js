"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_UNIT_MAP = exports.VALID_UNIT_SYMBOLS = exports.UNITS = exports.UNIT_SYMBOLS = void 0;
exports.normalizeUnit = normalizeUnit;
exports.getUnitDefinition = getUnitDefinition;
exports.formatUnit = formatUnit;
exports.getUnitsByCategory = getUnitsByCategory;
exports.UNIT_SYMBOLS = {
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
};
/**
 * Complete unit definitions with metadata
 */
exports.UNITS = {
    // Weight Units
    GRAM: {
        symbol: exports.UNIT_SYMBOLS.GRAM,
        name: 'Gram',
        pluralName: 'Grams',
        category: 'weight',
        description: 'Metric unit of mass'
    },
    KILOGRAM: {
        symbol: exports.UNIT_SYMBOLS.KILOGRAM,
        name: 'Kilogram',
        pluralName: 'Kilograms',
        category: 'weight',
        description: '1000 grams'
    },
    OUNCE: {
        symbol: exports.UNIT_SYMBOLS.OUNCE,
        name: 'Ounce',
        pluralName: 'Ounces',
        category: 'weight',
        description: 'Imperial unit of weight'
    },
    POUND: {
        symbol: exports.UNIT_SYMBOLS.POUND,
        name: 'Pound',
        pluralName: 'Pounds',
        category: 'weight',
        description: '16 ounces'
    },
    // Volume Units
    MILLILITER: {
        symbol: exports.UNIT_SYMBOLS.MILLILITER,
        name: 'Milliliter',
        pluralName: 'Milliliters',
        category: 'volume',
        description: '1/1000 of a liter'
    },
    LITER: {
        symbol: exports.UNIT_SYMBOLS.LITER,
        name: 'Liter',
        pluralName: 'Liters',
        category: 'volume',
        description: 'Metric unit of volume'
    },
    TEASPOON: {
        symbol: exports.UNIT_SYMBOLS.TEASPOON,
        name: 'Teaspoon',
        pluralName: 'Teaspoons',
        category: 'volume',
        description: '~5ml'
    },
    TABLESPOON: {
        symbol: exports.UNIT_SYMBOLS.TABLESPOON,
        name: 'Tablespoon',
        pluralName: 'Tablespoons',
        category: 'volume',
        description: '~15ml or 3 teaspoons'
    },
    CUP: {
        symbol: exports.UNIT_SYMBOLS.CUP,
        name: 'Cup',
        pluralName: 'Cups',
        category: 'volume',
        description: '~240ml'
    },
    // Count Units
    PIECE: {
        symbol: exports.UNIT_SYMBOLS.PIECE,
        name: 'Piece',
        pluralName: 'Pieces',
        category: 'count',
        description: 'Individual items'
    },
    DOZEN: {
        symbol: exports.UNIT_SYMBOLS.DOZEN,
        name: 'Dozen',
        pluralName: 'Dozens',
        category: 'count',
        description: '12 pieces'
    },
    PACKAGE: {
        symbol: exports.UNIT_SYMBOLS.PACKAGE,
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
exports.VALID_UNIT_SYMBOLS = Object.values(exports.UNIT_SYMBOLS);
/**
 * Map of legacy unit names to their correct symbols
 * Use this for data migration and normalization
 */
exports.LEGACY_UNIT_MAP = {
    // Name variations to symbol
    'Piece': exports.UNIT_SYMBOLS.PIECE,
    'Pieces': exports.UNIT_SYMBOLS.PIECE,
    'piece': exports.UNIT_SYMBOLS.PIECE,
    'pieces': exports.UNIT_SYMBOLS.PIECE,
    'Dozen': exports.UNIT_SYMBOLS.DOZEN,
    'dozen': exports.UNIT_SYMBOLS.DOZEN,
    'Kilogram': exports.UNIT_SYMBOLS.KILOGRAM,
    'kilogram': exports.UNIT_SYMBOLS.KILOGRAM,
    'Gram': exports.UNIT_SYMBOLS.GRAM,
    'gram': exports.UNIT_SYMBOLS.GRAM,
    'Liter': exports.UNIT_SYMBOLS.LITER,
    'liter': exports.UNIT_SYMBOLS.LITER,
    'Milliliter': exports.UNIT_SYMBOLS.MILLILITER,
    'milliliter': exports.UNIT_SYMBOLS.MILLILITER,
    'Ounce': exports.UNIT_SYMBOLS.OUNCE,
    'ounce': exports.UNIT_SYMBOLS.OUNCE,
    'Pound': exports.UNIT_SYMBOLS.POUND,
    'pound': exports.UNIT_SYMBOLS.POUND,
    'Cup': exports.UNIT_SYMBOLS.CUP,
    'cup': exports.UNIT_SYMBOLS.CUP,
    'Tablespoon': exports.UNIT_SYMBOLS.TABLESPOON,
    'tablespoon': exports.UNIT_SYMBOLS.TABLESPOON,
    'Teaspoon': exports.UNIT_SYMBOLS.TEASPOON,
    'teaspoon': exports.UNIT_SYMBOLS.TEASPOON,
    'Package': exports.UNIT_SYMBOLS.PACKAGE,
    'package': exports.UNIT_SYMBOLS.PACKAGE,
    'pkg': exports.UNIT_SYMBOLS.PACKAGE,
};
/**
 * Normalize a unit string to a valid symbol
 * Returns the symbol if valid, or null if invalid
 */
function normalizeUnit(unit) {
    // Check if it's already a valid symbol
    if (exports.VALID_UNIT_SYMBOLS.includes(unit)) {
        return unit;
    }
    // Check legacy map
    if (unit in exports.LEGACY_UNIT_MAP) {
        return exports.LEGACY_UNIT_MAP[unit];
    }
    // Try case-insensitive lookup
    const lowerUnit = unit.toLowerCase();
    const entry = Object.entries(exports.LEGACY_UNIT_MAP).find(([key]) => key.toLowerCase() === lowerUnit);
    if (entry) {
        return entry[1];
    }
    return null;
}
/**
 * Get unit definition by symbol
 */
function getUnitDefinition(symbol) {
    return Object.values(exports.UNITS).find(u => u.symbol === symbol);
}
/**
 * Format unit display with proper pluralization
 */
function formatUnit(symbol, quantity = 1) {
    const unit = getUnitDefinition(symbol);
    if (!unit)
        return symbol;
    return quantity === 1 ? unit.name : unit.pluralName;
}
/**
 * Get units grouped by category
 */
function getUnitsByCategory() {
    return {
        weight: Object.values(exports.UNITS).filter(u => u.category === 'weight'),
        volume: Object.values(exports.UNITS).filter(u => u.category === 'volume'),
        count: Object.values(exports.UNITS).filter(u => u.category === 'count'),
    };
}
//# sourceMappingURL=units.js.map