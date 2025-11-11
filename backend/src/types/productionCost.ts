/**
 * Types and interfaces for production cost calculations
 */

export interface ProductionCostCalculation {
    totalCost: number;
    costPerUnit: number;
    quantity: number;
    recipeId: string;
    recipeName?: string;
    breakdown: {
        materialCost: number;
        overheadCost: number;
        overheadPercentage: number;
    };
}

export interface SalePriceCalculation {
    salePrice: number;
    costPerUnit: number;
    markupPercentage: number;
    markupAmount: number;
}

export interface ProductionCostConfig {
    defaultMarkupPercentage: number;
    fallbackCostPerUnit: number;
    fallbackSalePrice: number;
}

export const DEFAULT_PRODUCTION_COST_CONFIG: ProductionCostConfig = {
    defaultMarkupPercentage: 0.50, // 50% markup
    fallbackCostPerUnit: 5.0,
    fallbackSalePrice: 10.0,
};
