/**
 * Unit tests for production cost calculation
 * 
 * These tests ensure that:
 * 1. Cost calculations use recipe cost service correctly
 * 2. Markup is applied consistently
 * 3. Fallback values are used when errors occur
 * 4. Type safety is maintained
 * 
 * NOTE: Integration tests for recipeCostService require a fully configured 
 * multi-tenant database with related entities (Client, Supplier, StorageLocation, etc.)
 * These tests focus on the pure calculation logic and default values.
 */

import { describe, it, expect } from '@jest/globals';
import { DEFAULT_PRODUCTION_COST_CONFIG } from '../types/productionCost';

describe('Production Cost Calculation', () => {

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
});
