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
export declare const UNIT_SYMBOLS: {
    readonly GRAM: "g";
    readonly KILOGRAM: "kg";
    readonly OUNCE: "oz";
    readonly POUND: "lb";
    readonly MILLILITER: "ml";
    readonly LITER: "L";
    readonly TEASPOON: "tsp";
    readonly TABLESPOON: "tbsp";
    readonly CUP: "cup";
    readonly PIECE: "pcs";
    readonly DOZEN: "dz";
    readonly PACKAGE: "pkg";
};
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
export declare const UNITS: Record<string, UnitDefinition>;
/**
 * Array of all valid unit symbols
 * Use this for validation in Joi schemas
 */
export declare const VALID_UNIT_SYMBOLS: ReadonlyArray<UnitSymbol>;
/**
 * Map of legacy unit names to their correct symbols
 * Use this for data migration and normalization
 */
export declare const LEGACY_UNIT_MAP: Record<string, UnitSymbol>;
/**
 * Normalize a unit string to a valid symbol
 * Returns the symbol if valid, or null if invalid
 */
export declare function normalizeUnit(unit: string): UnitSymbol | null;
/**
 * Get unit definition by symbol
 */
export declare function getUnitDefinition(symbol: UnitSymbol): UnitDefinition | undefined;
/**
 * Format unit display with proper pluralization
 */
export declare function formatUnit(symbol: UnitSymbol, quantity?: number): string;
/**
 * Get units grouped by category
 */
export declare function getUnitsByCategory(): {
    weight: UnitDefinition[];
    volume: UnitDefinition[];
    count: UnitDefinition[];
};
//# sourceMappingURL=units.d.ts.map