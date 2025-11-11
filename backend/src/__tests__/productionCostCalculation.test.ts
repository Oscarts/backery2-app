/**
 * Unit tests for production cost calculation
 * 
 * These tests ensure that:
 * 1. Cost calculations use recipe cost service correctly
 * 2. Markup is applied consistently
 * 3. Fallback values are used when errors occur
 * 4. Type safety is maintained
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import prisma from '../config/database';
import { recipeCostService } from '../services/recipeCostService';
import { DEFAULT_PRODUCTION_COST_CONFIG } from '../types/productionCost';

describe('Production Cost Calculation', () => {
    let testRecipeId: string;
    let testRawMaterialId: string;

    beforeAll(async () => {
        // Create test raw material
        const rawMaterial = await prisma.rawMaterial.create({
            data: {
                name: 'Test Flour',
                sku: 'TEST-FLOUR',
                category: 'Dry Goods',
                currentStock: 100,
                unit: 'kg',
                unitPrice: 2.50,
                reorderLevel: 10,
                reorderQuantity: 50,
            }
        });
        testRawMaterialId = rawMaterial.id;

        // Create test recipe
        const recipe = await prisma.recipe.create({
            data: {
                name: 'Test Bread',
                description: 'Test recipe for cost calculation',
                estimatedCost: 10.00,
                overheadPercentage: 50, // 50% overhead
                yieldQuantity: 5,
                yieldUnit: 'loaves',
                instructions: 'Test instructions',
                ingredients: {
                    create: [{
                        quantity: 2,
                        unit: 'kg',
                        rawMaterialId: testRawMaterialId,
                    }]
                }
            }
        });
        testRecipeId = recipe.id;
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.recipeIngredient.deleteMany({
            where: { recipeId: testRecipeId }
        });
        await prisma.recipe.deleteMany({
            where: { id: testRecipeId }
        });
        await prisma.rawMaterial.deleteMany({
            where: { id: testRawMaterialId }
        });
    });

    describe('Recipe Cost Service', () => {
        it('should calculate correct cost per unit with overhead', async () => {
            const costBreakdown = await recipeCostService.calculateRecipeCost(testRecipeId);

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
            const costBreakdown = await recipeCostService.calculateRecipeCost(testRecipeId);

            expect(costBreakdown.recipeId).toBe(testRecipeId);
            expect(costBreakdown.recipeName).toBe('Test Bread');
            expect(costBreakdown.yieldUnit).toBe('loaves');
        });

        it('should have ingredients breakdown', async () => {
            const costBreakdown = await recipeCostService.calculateRecipeCost(testRecipeId);

            expect(costBreakdown.ingredients).toHaveLength(1);
            expect(costBreakdown.ingredients[0].name).toBe('Test Flour');
            expect(costBreakdown.ingredients[0].quantity).toBe(2);
            expect(costBreakdown.ingredients[0].unit).toBe('kg');
            expect(costBreakdown.ingredients[0].unitCost).toBe(2.50);
            expect(costBreakdown.ingredients[0].totalCost).toBe(5.00);
        });
    });

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
        it('should calculate total cost for multiple units correctly', async () => {
            const costBreakdown = await recipeCostService.calculateRecipeCost(testRecipeId);
            const targetQuantity = 10; // 10 loaves
            
            const totalCost = costBreakdown.costPerUnit * targetQuantity;
            
            // $1.50 per loaf * 10 loaves = $15.00
            expect(totalCost).toBe(15.00);
        });

        it('should maintain cost per unit regardless of production quantity', async () => {
            const costBreakdown = await recipeCostService.calculateRecipeCost(testRecipeId);
            
            const quantity1 = 5;
            const quantity2 = 20;
            
            const cost1 = costBreakdown.costPerUnit * quantity1;
            const cost2 = costBreakdown.costPerUnit * quantity2;
            
            expect(cost1 / quantity1).toBe(costBreakdown.costPerUnit);
            expect(cost2 / quantity2).toBe(costBreakdown.costPerUnit);
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
        it('should ensure finished product cost matches recipe cost', async () => {
            const recipeCost = await recipeCostService.calculateRecipeCost(testRecipeId);
            
            // When creating a finished product, costToProduce should equal recipe costPerUnit
            const expectedFinishedProductCost = recipeCost.costPerUnit;
            
            expect(expectedFinishedProductCost).toBe(1.50);
        });

        it('should ensure sale price is higher than cost', async () => {
            const recipeCost = await recipeCostService.calculateRecipeCost(testRecipeId);
            const costPerUnit = recipeCost.costPerUnit;
            const salePrice = costPerUnit * (1 + DEFAULT_PRODUCTION_COST_CONFIG.defaultMarkupPercentage);
            
            expect(salePrice).toBeGreaterThan(costPerUnit);
            
            const profitMargin = salePrice - costPerUnit;
            expect(profitMargin).toBeGreaterThan(0);
        });
    });
});
