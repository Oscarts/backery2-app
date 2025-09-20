import { finishedProductsApi } from '../realApi';
import { MaterialBreakdown } from '../../types';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock API base URL (should match the actual API configuration)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

describe('finishedProductsApi - Material Tracking', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getMaterialBreakdown', () => {
    const mockMaterialBreakdown: MaterialBreakdown = {
      finishedProduct: {
        id: 'product-456',
        name: 'Chocolate Croissant (BATCH-001)',
        batchNumber: 'BATCH-001',
        productionDate: '2025-09-18T10:00:00Z',
        quantity: 12,
        unit: 'pieces',
        costToProduce: 5.25,
        sku: 'CHOCO-CROISSANT-BATCH-001',
      },
      productionRun: {
        id: 'prod-123',
        name: '12 Chocolate Croissants',
        recipe: {
          id: 'recipe-1',
          name: 'Chocolate Croissant',
          description: 'Delicious chocolate-filled croissants',
          categoryId: 'cat-1',
          yieldQuantity: 12,
          yieldUnit: 'pieces',
          prepTime: 180,
          cookTime: 25,
          instructions: ['Mix dough', 'Add chocolate', 'Bake'],
          version: 1,
          isActive: true,
          emoji: '🥐',
          difficulty: 'MEDIUM',
          estimatedTotalTime: 205,
          estimatedCost: 5.00,
          equipmentRequired: ['oven'],
          createdAt: '2025-09-18T09:00:00Z',
          updatedAt: '2025-09-18T09:00:00Z',
        },
        completedAt: '2025-09-18T10:30:00Z',
      },
      materials: [
        {
          id: 'alloc-1',
          materialType: 'RAW_MATERIAL',
          materialName: 'All-Purpose Flour',
          materialSku: 'FLOUR-001',
          materialBatchNumber: 'FLOUR-BATCH-001',
          quantityAllocated: 500,
          quantityConsumed: 475,
          unit: 'g',
          unitCost: 0.004,
          totalCost: 2.00,
          status: 'CONSUMED',
          notes: undefined,
          consumedAt: '2025-09-18T10:15:00Z',
        },
      ],
      costBreakdown: {
        materialCost: 5.50,
        totalCost: 6.60,
        materials: [
          {
            id: 'alloc-1',
            materialType: 'RAW_MATERIAL',
            materialName: 'All-Purpose Flour',
            materialSku: 'FLOUR-001',
            materialBatchNumber: 'FLOUR-BATCH-001',
            quantityAllocated: 500,
            quantityConsumed: 475,
            unit: 'g',
            unitCost: 0.004,
            totalCost: 2.00,
            status: 'CONSUMED',
            notes: undefined,
            consumedAt: '2025-09-18T10:15:00Z',
          },
        ],
      },
      summary: {
        totalMaterialsUsed: 1,
        totalMaterialCost: 5.50,
        totalProductionCost: 6.60,
        costPerUnit: 3.30,
      }
    };

    test('successfully fetches material breakdown data', async () => {
      const productId = 'product-456';
      const mockResponse = {
        success: true,
        data: mockMaterialBreakdown
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await finishedProductsApi.getMaterialBreakdown(productId);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/production/finished-products/${productId}/materials`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual(mockResponse);
      expect(result.data?.finishedProduct.name).toBe('Chocolate Croissant (BATCH-001)');
      expect(result.data?.summary.totalProductionCost).toBe(6.60);
      expect(result.data?.materials).toHaveLength(1);
    });

    test('handles API error response', async () => {
      const productId = 'product-456';
      const errorMessage = 'Product not found';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: errorMessage
        }),
      } as Response);

      // The apiCall function should handle the error and not throw
      await expect(finishedProductsApi.getMaterialBreakdown(productId)).rejects.toThrow('Product not found');
    });

    test('handles network error', async () => {
      const productId = 'product-456';
      const networkError = new Error('Network error');

      mockFetch.mockRejectedValueOnce(networkError);

      await expect(finishedProductsApi.getMaterialBreakdown(productId)).rejects.toThrow('Network error');
    });

    test('handles empty material breakdown data', async () => {
      const productId = 'product-456';
      const emptyBreakdown = {
        ...mockMaterialBreakdown,
        materials: [],
        summary: {
          totalMaterialsUsed: 0,
          totalMaterialCost: 0,
          totalProductionCost: 0,
          costPerUnit: 0,
        }
      };

      const mockResponse = {
        success: true,
        data: emptyBreakdown
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await finishedProductsApi.getMaterialBreakdown(productId);

      expect(result.success).toBe(true);
      expect(result.data?.materials).toHaveLength(0);
      expect(result.data?.summary.totalMaterialCost).toBe(0);
    });

    test('sends correct headers and method', async () => {
      const productId = 'product-456';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMaterialBreakdown }),
      } as Response);

      await finishedProductsApi.getMaterialBreakdown(productId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/finished-products/${productId}/materials`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('constructs correct URL with product ID', async () => {
      const productIds = ['prod-1', 'prod-2', 'special-id-123'];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockMaterialBreakdown }),
      } as Response);

      for (const productId of productIds) {
        await finishedProductsApi.getMaterialBreakdown(productId);
        
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/production/finished-products/${productId}/materials`,
          expect.any(Object)
        );
      }
    });
  });

  test('API integration with existing finished products API', () => {
    // Verify that the new method is added to the existing API object
    expect(finishedProductsApi.getMaterialBreakdown).toBeDefined();
    expect(typeof finishedProductsApi.getMaterialBreakdown).toBe('function');
    
    // Verify other existing methods still exist
    expect(finishedProductsApi.getAll).toBeDefined();
    expect(finishedProductsApi.getById).toBeDefined();
    expect(finishedProductsApi.create).toBeDefined();
    expect(finishedProductsApi.update).toBeDefined();
    expect(finishedProductsApi.delete).toBeDefined();
  });
});