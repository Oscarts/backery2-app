import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { intermediateProductsApi, categoriesApi, storageLocationsApi, unitsApi, rawMaterialsApi, suppliersApi, finishedProductsApi } from '../services/realApi';
import { IntermediateProductStatus, CategoryType } from '../types';

interface TestResult {
  name: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
  data?: any;
}

const ApiTestPage: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Categories API', status: 'idle' },
    { name: 'Storage Locations API', status: 'idle' },
    { name: 'Units API', status: 'idle' },
    { name: 'Suppliers API', status: 'idle' },
    { name: 'Intermediate Products API', status: 'idle' },
    { name: 'Create Intermediate Product', status: 'idle' },
    { name: 'Update Intermediate Product', status: 'idle' },
    { name: 'Delete Intermediate Product', status: 'idle' },
    { name: 'Raw Materials API', status: 'idle' },
    { name: 'Create Raw Material', status: 'idle' },
    { name: 'Update Raw Material', status: 'idle' },
    { name: 'Delete Raw Material', status: 'idle' },
    { name: 'Finished Products API', status: 'idle' },
    { name: 'Create Finished Product', status: 'idle' },
    { name: 'Update Finished Product', status: 'idle' },
    { name: 'Delete Finished Product', status: 'idle' },
    { name: 'Get Expiring Products', status: 'idle' },
    { name: 'Get Low Stock Products', status: 'idle' },
    { name: 'Reserve Product Quantity', status: 'idle' },
    { name: 'Release Product Reservation', status: 'idle' },
    { name: 'Dashboard Summary', status: 'idle' },
    { name: 'Dashboard Alerts', status: 'idle' },
    { name: 'Dashboard Trends', status: 'idle' },
    { name: 'Dashboard Categories', status: 'idle' },
    { name: 'Dashboard Value Analysis', status: 'idle' },
    { name: 'Recipes API', status: 'idle' },
    { name: 'Create Recipe', status: 'idle' },
    { name: 'Recipe Cost Analysis', status: 'idle' },
    { name: 'What Can I Make Analysis', status: 'idle' },
    { name: 'Update Recipe', status: 'idle' },
    { name: 'Delete Recipe', status: 'idle' }
  ]);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  // Calculate test statistics
  const getTestStats = () => {
    const total = tests.length;
    const passed = tests.filter(test => test.status === 'success').length;
    const failed = tests.filter(test => test.status === 'error').length;
    const running = tests.filter(test => test.status === 'testing').length;
    const idle = tests.filter(test => test.status === 'idle').length;

    return { total, passed, failed, running, idle };
  };

  const stats = getTestStats();

  const runAllTests = async () => {
    // Test 1: Categories API
    updateTest(0, { status: 'testing' });
    try {
      const categoriesResult = await categoriesApi.getAll();
      updateTest(0, {
        status: 'success',
        message: `Found ${categoriesResult.data?.length || 0} categories`,
        data: categoriesResult.data
      });
    } catch (error) {
      updateTest(0, {
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 2: Storage Locations API
    updateTest(1, { status: 'testing' });
    try {
      const locationsResult = await storageLocationsApi.getAll();
      updateTest(1, {
        status: 'success',
        message: `Found ${locationsResult.data?.length || 0} storage locations`,
        data: locationsResult.data
      });
    } catch (error) {
      updateTest(1, {
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 3: Units API
    updateTest(2, { status: 'testing' });
    try {
      const unitsResult = await unitsApi.getAll();
      updateTest(2, {
        status: 'success',
        message: `Found ${unitsResult.data?.length || 0} units`,
        data: unitsResult.data
      });
    } catch (error) {
      updateTest(2, {
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 4: Suppliers API
    updateTest(3, { status: 'testing' });
    try {
      const suppliersResult = await suppliersApi.getAll();
      updateTest(3, {
        status: 'success',
        message: `Found ${suppliersResult.data?.length || 0} suppliers`,
        data: suppliersResult.data
      });
    } catch (error) {
      updateTest(3, {
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 5: Intermediate Products API
    updateTest(4, { status: 'testing' });
    try {
      const productsResult = await intermediateProductsApi.getAll();
      updateTest(4, {
        status: 'success',
        message: `Found ${productsResult.data?.length || 0} intermediate products`,
        data: productsResult.data
      });
    } catch (error) {
      updateTest(4, {
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 6: Create Intermediate Product
    updateTest(5, { status: 'testing' });
    try {
      // Ensure we have fresh data for the create test
      const [categoriesResult, locationsResult, unitsResult] = await Promise.all([
        categoriesApi.getAll(),
        storageLocationsApi.getAll(),
        unitsApi.getAll()
      ]);

      if (!categoriesResult.data?.[0]?.id) {
        throw new Error('No categories available for testing');
      }
      if (!locationsResult.data?.[0]?.id) {
        throw new Error('No storage locations available for testing');
      }
      if (!unitsResult.data?.[0]?.symbol) {
        throw new Error('No units available for testing');
      }

      const createData = {
        name: 'Test Intermediate Product',
        description: 'A test intermediate product for API testing',
        categoryId: categoriesResult.data[0].id,
        storageLocationId: locationsResult.data[0].id,
        batchNumber: `BATCH${Date.now()}`,
        productionDate: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
        expirationDate: '2025-12-31T00:00:00.000Z',
        quantity: 100,
        unit: unitsResult.data[0].symbol,
        status: IntermediateProductStatus.IN_PRODUCTION,
        contaminated: false
      };

      const createResult = await intermediateProductsApi.create(createData);
      updateTest(5, {
        status: 'success',
        message: `Created product with ID: ${createResult.data?.id}`,
        data: createResult.data
      });

      // Test 7: Update the created product
      if (createResult.data?.id) {
        updateTest(6, { status: 'testing' });
        try {
          const updateResult = await intermediateProductsApi.update(createResult.data.id, {
            quantity: 15,
            status: IntermediateProductStatus.COMPLETED
          });
          updateTest(6, {
            status: 'success',
            message: `Updated product quantity to ${updateResult.data?.quantity}`,
            data: updateResult.data
          });

          // Test 8: Delete the created product
          updateTest(7, { status: 'testing' });
          try {
            await intermediateProductsApi.delete(createResult.data.id);
            updateTest(7, {
              status: 'success',
              message: 'Product deleted successfully'
            });
          } catch (error) {
            updateTest(7, {
              status: 'error',
              message: `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
        } catch (error) {
          updateTest(6, {
            status: 'error',
            message: `Update error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    } catch (error) {
      updateTest(5, {
        status: 'error',
        message: `Create error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 9: Raw Materials API
    updateTest(8, { status: 'testing' });
    try {
      const rawMaterialsResult = await rawMaterialsApi.getAll();
      updateTest(8, {
        status: 'success',
        message: `Found ${rawMaterialsResult.data?.length || 0} raw materials`,
        data: rawMaterialsResult.data
      });
    } catch (error) {
      updateTest(8, {
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 10: Create Raw Material
    updateTest(9, { status: 'testing' });
    try {
      // Ensure we have fresh data for the raw material create test
      const [categoriesResult, locationsResult, unitsResult, suppliersResult] = await Promise.all([
        categoriesApi.getAll(),
        storageLocationsApi.getAll(),
        unitsApi.getAll(),
        suppliersApi.getAll()
      ]);

      // Find a raw material category
      const rawMaterialCategory = categoriesResult.data?.find(c => c.type === CategoryType.RAW_MATERIAL);
      if (!rawMaterialCategory?.id) {
        throw new Error('No raw material categories available for testing');
      }
      if (!locationsResult.data?.[0]?.id) {
        throw new Error('No storage locations available for testing');
      }
      if (!unitsResult.data?.[0]?.symbol) {
        throw new Error('No units available for testing');
      }
      if (!suppliersResult.data?.[0]?.id) {
        throw new Error('No suppliers available for testing');
      }

      const createRawMaterialData = {
        name: 'Test Raw Material',
        categoryId: rawMaterialCategory.id,
        supplierId: suppliersResult.data[0].id,
        batchNumber: `RAW-BATCH-${Date.now()}`,
        purchaseDate: new Date().toISOString().split('T')[0],
        expirationDate: '2025-12-31',
        quantity: 50,
        unit: unitsResult.data[0].symbol,
        costPerUnit: 2.50,
        reorderLevel: 10,
        storageLocationId: locationsResult.data[0].id
      };

      const createRawResult = await rawMaterialsApi.create(createRawMaterialData);
      updateTest(9, {
        status: 'success',
        message: `Created raw material with ID: ${createRawResult.data?.id}`,
        data: createRawResult.data
      });

      // Test 11: Update the created raw material
      if (createRawResult.data?.id) {
        updateTest(10, { status: 'testing' });
        try {
          const updateRawResult = await rawMaterialsApi.update(createRawResult.data.id, {
            quantity: 75,
            costPerUnit: 3.00,
            contaminated: false
          });
          updateTest(10, {
            status: 'success',
            message: `Updated raw material quantity to ${updateRawResult.data?.quantity}`,
            data: updateRawResult.data
          });

          // Test 12: Delete the created raw material
          updateTest(11, { status: 'testing' });
          try {
            await rawMaterialsApi.delete(createRawResult.data.id);
            updateTest(11, {
              status: 'success',
              message: 'Raw material deleted successfully'
            });
          } catch (error) {
            updateTest(11, {
              status: 'error',
              message: `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
        } catch (error) {
          updateTest(10, {
            status: 'error',
            message: `Update error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    } catch (error) {
      updateTest(9, {
        status: 'error',
        message: `Create error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 13: Finished Products API
    updateTest(12, { status: 'testing' });
    try {
      const finishedProductsResult = await finishedProductsApi.getAll();
      updateTest(12, {
        status: 'success',
        message: `Found ${finishedProductsResult.data?.length || 0} finished products`,
        data: finishedProductsResult.data
      });
    } catch (error) {
      updateTest(12, {
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 14: Create Finished Product
    updateTest(13, { status: 'testing' });
    try {
      const categoriesResult = await categoriesApi.getAll();
      const finishedProductCategories = categoriesResult.data?.filter(c => c.type === 'FINISHED_PRODUCT');

      if (!finishedProductCategories || finishedProductCategories.length === 0) {
        updateTest(13, {
          status: 'error',
          message: 'No finished product categories found for testing'
        });
        return;
      }

      const createFinishedData = {
        name: 'Test Finished Product',
        sku: `TEST-FP-${Date.now()}`,
        categoryId: finishedProductCategories[0].id,
        batchNumber: `BATCH-${Date.now()}`,
        productionDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        shelfLife: 30,
        quantity: 100,
        unit: 'pcs',
        salePrice: 15.99,
        costToProduce: 10.50,
        packagingInfo: 'Individual packaging'
      };

      const createFinishedResult = await finishedProductsApi.create(createFinishedData);
      updateTest(13, {
        status: 'success',
        message: `Created finished product: ${createFinishedResult.data?.name}`,
        data: createFinishedResult.data
      });

      if (createFinishedResult.data) {
        // Test 15: Update the created finished product
        updateTest(14, { status: 'testing' });
        try {
          const updateFinishedData = {
            quantity: 150,
            salePrice: 17.99
          };

          const updateFinishedResult = await finishedProductsApi.update(createFinishedResult.data.id, updateFinishedData);
          updateTest(14, {
            status: 'success',
            message: `Updated finished product quantity to ${updateFinishedResult.data?.quantity}`,
            data: updateFinishedResult.data
          });

          // Test 16: Delete the created finished product
          updateTest(15, { status: 'testing' });
          try {
            await finishedProductsApi.delete(createFinishedResult.data.id);
            updateTest(15, {
              status: 'success',
              message: 'Finished product deleted successfully'
            });
          } catch (error) {
            updateTest(15, {
              status: 'error',
              message: `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
        } catch (error) {
          updateTest(14, {
            status: 'error',
            message: `Update error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    } catch (error) {
      updateTest(13, {
        status: 'error',
        message: `Create error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 17: Get Expiring Products
    updateTest(16, { status: 'testing' });
    try {
      const expiringResult = await finishedProductsApi.getExpiring(7);
      updateTest(16, {
        status: 'success',
        message: `Found ${expiringResult.data?.length || 0} products expiring in 7 days`,
        data: expiringResult.data
      });
    } catch (error) {
      updateTest(16, {
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 18: Get Low Stock Products
    updateTest(17, { status: 'testing' });
    try {
      const lowStockResult = await finishedProductsApi.getLowStock(10);
      updateTest(17, {
        status: 'success',
        message: `Found ${lowStockResult.data?.length || 0} low stock products`,
        data: lowStockResult.data
      });
    } catch (error) {
      updateTest(17, {
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 19: Reserve Product Quantity
    updateTest(18, { status: 'testing' });
    try {
      const allProducts = await finishedProductsApi.getAll();
      const availableProduct = allProducts.data?.find(p => p.quantity > p.reservedQuantity);

      if (availableProduct) {
        const reserveResult = await finishedProductsApi.reserveQuantity(availableProduct.id, 5);
        updateTest(18, {
          status: 'success',
          message: `Reserved 5 units of ${availableProduct.name}`,
          data: reserveResult.data
        });

        // Test 20: Release Product Reservation
        updateTest(19, { status: 'testing' });
        try {
          const releaseResult = await finishedProductsApi.releaseReservation(availableProduct.id, 5);
          updateTest(19, {
            status: 'success',
            message: `Released 5 units reservation for ${availableProduct.name}`,
            data: releaseResult.data
          });
        } catch (error) {
          updateTest(19, {
            status: 'error',
            message: `Release error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      } else {
        updateTest(18, {
          status: 'error',
          message: 'No available products found for reservation testing'
        });
        updateTest(19, { status: 'idle' });
      }
    } catch (error) {
      updateTest(18, {
        status: 'error',
        message: `Reserve error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      updateTest(19, { status: 'idle' });
    }

    // Test 21: Dashboard Summary
    updateTest(20, { status: 'testing' });
    try {
      const summaryResponse = await fetch('/api/dashboard/summary');
      const summaryResult = await summaryResponse.json();
      updateTest(20, {
        status: 'success',
        message: `Dashboard summary loaded - Total items: ${summaryResult.data?.inventoryCounts?.total || 0}`,
        data: summaryResult.data
      });
    } catch (error) {
      updateTest(20, {
        status: 'error',
        message: `Summary error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 22: Dashboard Alerts
    updateTest(21, { status: 'testing' });
    try {
      const alertsResponse = await fetch('/api/dashboard/alerts');
      const alertsResult = await alertsResponse.json();
      updateTest(21, {
        status: 'success',
        message: `Found ${alertsResult.data?.length || 0} alerts`,
        data: alertsResult.data
      });
    } catch (error) {
      updateTest(21, {
        status: 'error',
        message: `Alerts error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 23: Dashboard Trends
    updateTest(22, { status: 'testing' });
    try {
      const trendsResponse = await fetch('/api/dashboard/trends?days=7');
      const trendsResult = await trendsResponse.json();
      updateTest(22, {
        status: 'success',
        message: `Trends loaded for 7 days`,
        data: trendsResult.data
      });
    } catch (error) {
      updateTest(22, {
        status: 'error',
        message: `Trends error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 24: Dashboard Categories
    updateTest(23, { status: 'testing' });
    try {
      const categoriesResponse = await fetch('/api/dashboard/categories');
      const categoriesResult = await categoriesResponse.json();
      updateTest(23, {
        status: 'success',
        message: `Categories breakdown loaded`,
        data: categoriesResult.data
      });
    } catch (error) {
      updateTest(23, {
        status: 'error',
        message: `Categories error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 25: Dashboard Value Analysis
    updateTest(24, { status: 'testing' });
    try {
      const valueResponse = await fetch('/api/dashboard/value');
      const valueResult = await valueResponse.json();
      updateTest(24, {
        status: 'success',
        message: `Value analysis loaded`,
        data: valueResult.data
      });
    } catch (error) {
      updateTest(24, {
        status: 'error',
        message: `Value error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 26: Recipes API
    updateTest(25, { status: 'testing' });
    try {
      const recipesResponse = await fetch('/api/recipes');
      const recipesResult = await recipesResponse.json();
      updateTest(25, {
        status: 'success',
        message: `Found ${recipesResult.data?.length || 0} recipes`,
        data: recipesResult.data
      });
    } catch (error) {
      updateTest(25, {
        status: 'error',
        message: `Recipes error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 27: Create Recipe
    updateTest(26, { status: 'testing' });
    try {
      // First get categories and raw materials to use valid IDs
      const categoriesResult = await categoriesApi.getAll();
      const rawMaterialsResult = await rawMaterialsApi.getAll();
      
      // Find a category for recipes (or use the first one if no specific type found)
      const recipeCategory = categoriesResult.data?.find(c => c.type === CategoryType.RECIPE) || 
                             categoriesResult.data?.[0];
      
      // Get first raw material
      const rawMaterial = rawMaterialsResult.data?.[0];
      
      if (!recipeCategory || !rawMaterial) {
        throw new Error('Missing required categories or raw materials for test');
      }
      
      const testRecipe = {
        name: `Test Recipe ${Date.now()}`,
        description: 'Test recipe for API validation',
        categoryId: recipeCategory.id,
        yieldQuantity: 1,
        yieldUnit: 'kg',
        prepTime: 30,
        cookTime: 20,
        instructions: ['Mix ingredients', 'Bake until golden'],
        ingredients: [
          {
            rawMaterialId: rawMaterial.id,
            quantity: 0.5,
            unit: rawMaterial.unit, // Use the raw material's unit
            notes: 'Test ingredient'
          }
        ]
      };

      const createResponse = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRecipe)
      });
      const createResult = await createResponse.json();

      if (createResult.success) {
        updateTest(26, {
          status: 'success',
          message: `Recipe created: ${createResult.data.name}`,
          data: createResult.data
        });

        // Store recipe ID for subsequent tests
        (window as any).testRecipeId = createResult.data.id;
      } else {
        throw new Error(createResult.error || 'Failed to create recipe');
      }
    } catch (error) {
      updateTest(26, {
        status: 'error',
        message: `Create recipe error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 28: Recipe Cost Analysis
    updateTest(27, { status: 'testing' });
    try {
      // Get test recipe ID or fetch an existing recipe
      let recipeId = (window as any).testRecipeId;
      
      // If no test recipe was created, get one from the API
      if (!recipeId) {
        const recipesResponse = await fetch('/api/recipes');
        const recipesResult = await recipesResponse.json();
        
        if (recipesResult.success && recipesResult.data && recipesResult.data.length > 0) {
          recipeId = recipesResult.data[0].id;
        } else {
          throw new Error('No recipes available for cost analysis test');
        }
      }
      
      const costResponse = await fetch(`/api/recipes/${recipeId}/cost`);
      if (!costResponse.ok) {
        throw new Error(`API error: ${costResponse.status} ${costResponse.statusText}`);
      }
      
      const costResult = await costResponse.json();
      
      updateTest(27, {
        status: costResult.success ? 'success' : 'error',
        message: costResult.success 
          ? `Cost analysis: $${costResult.data?.totalCost?.toFixed(2) || '0.00'}`
          : `Error: ${costResult.error || 'Unknown error'}`,
        data: costResult.data
      });
    } catch (error) {
      updateTest(27, {
        status: 'error',
        message: `Cost analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 29: What Can I Make Analysis
    updateTest(28, { status: 'testing' });
    try {
      const whatCanMakeResponse = await fetch('/api/recipes/what-can-i-make');
      
      if (!whatCanMakeResponse.ok) {
        throw new Error(`API error: ${whatCanMakeResponse.status} ${whatCanMakeResponse.statusText}`);
      }
      
      const whatCanMakeResult = await whatCanMakeResponse.json();
      
      // Check for different possible response structures
      const canMakeCount = whatCanMakeResult.data?.canMakeCount || 
                          whatCanMakeResult.data?.recipes?.canMake?.length || 0;
      const totalRecipes = whatCanMakeResult.data?.totalRecipes || 
                          whatCanMakeResult.data?.recipes?.total || 0;
      
      updateTest(28, {
        status: whatCanMakeResult.success ? 'success' : 'error',
        message: whatCanMakeResult.success 
          ? `Can make ${canMakeCount} of ${totalRecipes} recipes`
          : `Error: ${whatCanMakeResult.error || 'Unknown error'}`,
        data: whatCanMakeResult.data
      });
    } catch (error) {
      updateTest(28, {
        status: 'error',
        message: `What can I make error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 30: Update Recipe
    updateTest(29, { status: 'testing' });
    try {
      const recipeId = (window as any).testRecipeId;
      if (!recipeId) {
        throw new Error('No test recipe ID available');
      }

      const updateData = {
        name: `Updated Test Recipe ${Date.now()}`,
        description: 'Updated test recipe description',
        prepTime: 45
      };

      const updateResponse = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      const updateResult = await updateResponse.json();

      if (updateResult.success) {
        updateTest(29, {
          status: 'success',
          message: `Recipe updated: ${updateResult.data.name}`,
          data: updateResult.data
        });
      } else {
        throw new Error(updateResult.error || 'Failed to update recipe');
      }
    } catch (error) {
      updateTest(29, {
        status: 'error',
        message: `Update recipe error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 31: Delete Recipe
    updateTest(30, { status: 'testing' });
    try {
      const recipeId = (window as any).testRecipeId;
      if (!recipeId) {
        throw new Error('No test recipe ID available');
      }

      const deleteResponse = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE'
      });
      const deleteResult = await deleteResponse.json();

      if (deleteResult.success) {
        updateTest(30, {
          status: 'success',
          message: `Recipe deleted successfully`,
          data: deleteResult
        });
        delete (window as any).testRecipeId;
      } else {
        throw new Error(deleteResult.error || 'Failed to delete recipe');
      }
    } catch (error) {
      updateTest(30, {
        status: 'error',
        message: `Delete recipe error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ ...test, status: 'idle' as const, message: undefined, data: undefined })));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'testing': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <SuccessIcon />;
      case 'error': return <ErrorIcon />;
      case 'testing': return <CircularProgress size={20} />;
      default: return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        API Testing Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test the database connectivity and CRUD operations for the bakery inventory system.
      </Typography>

      {/* Test Status Indicator */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: stats.failed > 0 ? '#ffebee' : stats.passed === stats.total && stats.total > 0 ? '#e8f5e8' : '#f5f5f5' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {stats.failed > 0 ? (
              <>
                <ErrorIcon color="error" />
                {stats.failed} Test{stats.failed !== 1 ? 's' : ''} Failing
              </>
            ) : stats.passed === stats.total && stats.total > 0 ? (
              <>
                <SuccessIcon color="success" />
                All Tests Passing
              </>
            ) : stats.running > 0 ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Tests Running
              </>
            ) : (
              <>
                <WarningIcon color="warning" />
                Tests Not Run
              </>
            )}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={`${stats.passed}/${stats.total} Passed`} color="success" variant={stats.passed > 0 ? "filled" : "outlined"} size="small" />
            {stats.failed > 0 && <Chip label={`${stats.failed} Failed`} color="error" size="small" />}
            {stats.running > 0 && <Chip label={`${stats.running} Running`} color="info" size="small" />}
            {stats.idle > 0 && <Chip label={`${stats.idle} Pending`} color="default" variant="outlined" size="small" />}
          </Box>
        </Box>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={runAllTests}
          sx={{ mr: 2 }}
          disabled={tests.some(test => test.status === 'testing')}
        >
          Run All Tests
        </Button>
        <Button
          variant="outlined"
          onClick={resetTests}
          startIcon={<RefreshIcon />}
        >
          Reset
        </Button>
      </Box>

      <Grid container spacing={3}>
        {tests.map((test) => (
          <Grid item xs={12} md={6} key={test.name}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {test.name}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(test.status) || undefined}
                    label={test.status.toUpperCase()}
                    color={getStatusColor(test.status) as any}
                    size="small"
                  />
                </Box>

                {test.message && (
                  <Alert
                    severity={test.status === 'error' ? 'error' : 'info'}
                    sx={{ mb: 2 }}
                  >
                    {test.message}
                  </Alert>
                )}

                {test.data && Array.isArray(test.data) && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Data Preview ({test.data.length} items):
                    </Typography>
                    <List dense>
                      {test.data.slice(0, 3).map((item: any, idx: number) => (
                        <ListItem key={idx} divider>
                          <ListItemText
                            primary={item.name || item.id}
                            secondary={item.description || item.type}
                          />
                        </ListItem>
                      ))}
                      {test.data.length > 3 && (
                        <ListItem>
                          <ListItemText secondary={`... and ${test.data.length - 3} more`} />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}

                {test.data && !Array.isArray(test.data) && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Created Item:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                      {JSON.stringify(test.data, null, 2)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Architecture Overview
        </Typography>
        <Typography variant="body2" paragraph>
          This test page verifies the complete data flow:
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Frontend (React)</strong> → <strong>Real API Service</strong> → <strong>Backend Express Server</strong> → <strong>Prisma ORM</strong> → <strong>PostgreSQL Database</strong>
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2">
          All data is now persistent in the PostgreSQL database. Updates will be saved permanently and survive page refreshes.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ApiTestPage;
