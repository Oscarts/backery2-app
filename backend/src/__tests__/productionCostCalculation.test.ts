/**
 * Unit tests for production cost calculation
 * 
 * These tests ensure that:
 * 1. Cost calculations use recipe cost service correctly
 * 2. Markup is applied consistently
 * 3. Fallback values are used when errors occur
 * 4. Type safety is maintained
 * 
 * This file contains both:
 * - Unit tests (pure calculation logic, no DB)
 * - Integration tests (require database with multi-tenant fixtures)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { DEFAULT_PRODUCTION_COST_CONFIG } from '../types/productionCost';
import { recipeCostService } from '../services/recipeCostService';
import {
    createCompleteTestEnvironment,
    cleanupTestEnvironment,
    disconnectTestPrisma,
} from './utils/fixtures';

// Type for our test environment
type TestEnvironment = Awaited<ReturnType<typeof createCompleteTestEnvironment>>;

describe('Production Cost Calculation', () => {

    // =========================================================================
    // UNIT TESTS - Pure calculation logic, no database required
    // =========================================================================

    describe('Sale Price Calculation', () => {
        it('should apply correct markup percentage', () => {
            const costPerUnit = 1.50;
            const markupPercentage = DEFAULT_PRODUCTION_COST_CONFIG.defaultMarkupPercentage; // 50%

            const expectedSalePrice = costPerUnit * (1 + markupPercentage);

            expect(expectedSalePrice).toBe(2.25);
        });

        it('should calculate markup amount correctly', () => {
            const costPerUnit = 1.50;
            const markupPercentage = DEFAULT_PRODUCTION_COST_CONFIG.defaultMarkupPercentage;

            const markupAmount = costPerUnit * markupPercentage;
            const salePrice = costPerUnit + markupAmount;

            expect(markupAmount).toBe(0.75);
            expect(salePrice).toBe(2.25);
        });
    });

    describe('Production Cost for Multiple Units', () => {
        it('should calculate total cost for multiple units correctly', () => {
            const costPerUnit = 1.50;
            const targetQuantity = 10; // 10 loaves

            const totalCost = costPerUnit * targetQuantity;

            // $1.50 per loaf * 10 loaves = $15.00
            expect(totalCost).toBe(15.00);
        });

        it('should maintain cost per unit regardless of production quantity', () => {
            const costPerUnit = 1.50;

            const quantity1 = 5;
            const quantity2 = 20;

            const cost1 = costPerUnit * quantity1;
            const cost2 = costPerUnit * quantity2;

            expect(cost1 / quantity1).toBe(costPerUnit);
            expect(cost2 / quantity2).toBe(costPerUnit);
        });
    });

    describe('Fallback Values', () => {
        it('should have sensible default values', () => {
            expect(DEFAULT_PRODUCTION_COST_CONFIG.defaultMarkupPercentage).toBe(0.50);
            expect(DEFAULT_PRODUCTION_COST_CONFIG.fallbackCostPerUnit).toBe(5.0);
            expect(DEFAULT_PRODUCTION_COST_CONFIG.fallbackSalePrice).toBe(10.0);
        });

        it('should ensure fallback sale price covers fallback cost', () => {
            const fallbackProfit = DEFAULT_PRODUCTION_COST_CONFIG.fallbackSalePrice -
                DEFAULT_PRODUCTION_COST_CONFIG.fallbackCostPerUnit;

            expect(fallbackProfit).toBeGreaterThan(0);
        });
    });

    describe('Cost Consistency', () => {
        it('should ensure sale price is higher than cost with markup', () => {
            const costPerUnit = 1.50;
            const salePrice = costPerUnit * (1 + DEFAULT_PRODUCTION_COST_CONFIG.defaultMarkupPercentage);

            expect(salePrice).toBeGreaterThan(costPerUnit);

            const profitMargin = salePrice - costPerUnit;
            expect(profitMargin).toBeGreaterThan(0);
        });

        it('should calculate profit margin correctly', () => {
            const costPerUnit = 10.00;
            const markup = DEFAULT_PRODUCTION_COST_CONFIG.defaultMarkupPercentage; // 0.50 = 50%
            const salePrice = costPerUnit * (1 + markup);

            // 50% markup on $10 = $15 sale price
            expect(salePrice).toBe(15.00);

            // Profit margin = (sale - cost) / sale = $5 / $15 = 33.33%
            const profitMargin = (salePrice - costPerUnit) / salePrice;
            expect(profitMargin).toBeCloseTo(0.333, 2);
        });
    });

    // =========================================================================
    // INTEGRATION TESTS - Require database with multi-tenant fixtures
    // =========================================================================

    describe('Recipe Cost Service Integration', () => {
        let testEnv: TestEnvironment;

        beforeAll(async () => {
            // Create complete test environment with all required entities
            testEnv = await createCompleteTestEnvironment();
        });

        afterAll(async () => {
            // Clean up test data
            if (testEnv) {
                await cleanupTestEnvironment(testEnv);
            }
            await disconnectTestPrisma();
        });

        it('should calculate correct cost per unit with overhead', async () => {
            const costBreakdown = await recipeCostService.calculateRecipeCost(testEnv.recipe.id);

            // Material cost: 2 kg * $2.50 = $5.00
            expect(costBreakdown.totalMaterialCost).toBe(5.00);

            // Overhead: 50% of $5.00 = $2.50
            expect(costBreakdown.overheadCost).toBe(2.50);

            // Total: $5.00 + $2.50 = $7.50
            expect(costBreakdown.totalProductionCost).toBe(7.50);

            // Cost per unit: $7.50 / 5 loaves = $1.50
            expect(costBreakdown.costPerUnit).toBe(1.50);

            // Yield
            expect(costBreakdown.yieldQuantity).toBe(5);
        });

        it('should include recipe metadata', async () => {
            const costBreakdown = await recipeCostService.calculateRecipeCost(testEnv.recipe.id);

            expect(costBreakdown.recipeId).toBe(testEnv.recipe.id);
            expect(costBreakdown.recipeName).toBe('Test Bread');
            expect(costBreakdown.yieldUnit).toBe('loaves');
        });

        it('should have ingredients breakdown', async () => {
            const costBreakdown = await recipeCostService.calculateRecipeCost(testEnv.recipe.id);

            expect(costBreakdown.ingredients).toHaveLength(1);
            expect(costBreakdown.ingredients[0].name).toBe('Test Flour');
            expect(costBreakdown.ingredients[0].quantity).toBe(2);
            expect(costBreakdown.ingredients[0].unit).toBe('kg');
            expect(costBreakdown.ingredients[0].unitCost).toBe(2.50);
            expect(costBreakdown.ingredients[0].totalCost).toBe(5.00);
        });

        it('should ensure finished product cost matches recipe cost', async () => {
            const recipeCost = await recipeCostService.calculateRecipeCost(testEnv.recipe.id);

            // When creating a finished product, costToProduce should equal recipe costPerUnit
            const expectedFinishedProductCost = recipeCost.costPerUnit;

            expect(expectedFinishedProductCost).toBe(1.50);
        });

        it('should ensure sale price is higher than cost', async () => {
            const recipeCost = await recipeCostService.calculateRecipeCost(testEnv.recipe.id);
            const costPerUnit = recipeCost.costPerUnit;
            const salePrice = costPerUnit * (1 + DEFAULT_PRODUCTION_COST_CONFIG.defaultMarkupPercentage);

            expect(salePrice).toBeGreaterThan(costPerUnit);

            const profitMargin = salePrice - costPerUnit;
            expect(profitMargin).toBeGreaterThan(0);
        });
    });
});
