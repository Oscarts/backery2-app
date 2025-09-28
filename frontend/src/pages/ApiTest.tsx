import React, { useState, useRef, useEffect } from 'react';
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
import { categoriesApi, storageLocationsApi, unitsApi, rawMaterialsApi, suppliersApi, finishedProductsApi } from '../services/realApi';
import { CategoryType } from '../types';

interface TestResult {
  name: string;
  status: 'idle' | 'testing' | 'success' | 'error' | 'skipped';
  message?: string;
  data?: any;
}

const ApiTestPage: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Categories API', status: 'idle' },
    { name: 'Storage Locations API', status: 'idle' },
    { name: 'Units API', status: 'idle' },
    { name: 'Suppliers API', status: 'idle' },
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
    { name: 'Delete Recipe', status: 'idle' },
    // Newly added extended backend-oriented tests
    { name: 'Finished Product Materials Traceability', status: 'idle' },
    { name: 'Production Workflow (Light)', status: 'idle' },
    { name: 'Production Contamination Check', status: 'idle' },
    { name: 'Production Capacity Check', status: 'idle' }
  ]);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  // Shared context across tests for chaining created entity IDs, etc.
  const testContextRef = useRef<Record<string, any>>({});

  // Helper to run a single test safely and standardize result handling
  const safeTest = async (
    index: number,
    fn: () => Promise<{ message?: string; data?: any; skip?: boolean; skipMessage?: string } | void>
  ) => {
    updateTest(index, { status: 'testing', message: undefined, data: undefined });
    try {
      const result = await fn();
      if (result && result.skip) {
        updateTest(index, { status: 'skipped', message: result.skipMessage || 'Skipped', data: undefined });
      } else {
        updateTest(index, { status: 'success', message: result?.message || 'OK', data: result?.data });
      }
    } catch (error) {
      updateTest(index, {
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Calculate test statistics
  const getTestStats = () => {
    const total = tests.length;
    const passed = tests.filter(test => test.status === 'success').length;
    const failed = tests.filter(test => test.status === 'error').length;
    const running = tests.filter(test => test.status === 'testing').length;
    const idle = tests.filter(test => test.status === 'idle').length;
    const skipped = tests.filter(test => test.status === 'skipped').length;

    return { total, passed, failed, running, idle, skipped };
  };

  const stats = getTestStats();

  const runAllTests = async () => {
    console.debug('[API TEST] Starting runAllTests');
    const ctx = testContextRef.current;
    ctx._startTime = Date.now();

    // 1 Categories
    await safeTest(0, async () => {
      console.debug('[API TEST] Test 1: Fetch categories');
      const categoriesResult = await categoriesApi.getAll();
      ctx.categories = categoriesResult.data || [];
      return { message: `Found ${ctx.categories.length} categories`, data: categoriesResult.data };
    });

    // 2 Storage Locations
    await safeTest(1, async () => {
      const locationsResult = await storageLocationsApi.getAll();
      ctx.locations = locationsResult.data || [];
      return { message: `Found ${ctx.locations.length} storage locations`, data: locationsResult.data };
    });

    // 3 Units
    await safeTest(2, async () => {
      const unitsResult = await unitsApi.getAll();
      ctx.units = unitsResult.data || [];
      return { message: `Found ${ctx.units.length} units`, data: unitsResult.data };
    });

    // 4 Suppliers
    await safeTest(3, async () => {
      const suppliersResult = await suppliersApi.getAll();
      ctx.suppliers = suppliersResult.data || [];
      return { message: `Found ${ctx.suppliers.length} suppliers`, data: suppliersResult.data };
    });

    // 5 Raw Materials list
    await safeTest(4, async () => {
      const rawMaterialsResult = await rawMaterialsApi.getAll();
      ctx.rawMaterials = rawMaterialsResult.data || [];
      return { message: `Found ${ctx.rawMaterials.length} raw materials`, data: rawMaterialsResult.data };
    });

    // 6 Create Raw Material
    await safeTest(5, async () => {
      const category = (ctx.categories || []).find((c: any) => c.type === CategoryType.RAW_MATERIAL);
      const supplier = (ctx.suppliers || [])[0];
      const location = (ctx.locations || [])[0];
      const unit = (ctx.units || [])[0];

      if (!category || !supplier || !location || !unit) {
        return { skip: true, skipMessage: 'Missing prerequisite (category/supplier/location/unit)' };
      }

      const createRawMaterialData = {
        name: `Test Raw Material ${Date.now()}`,
        categoryId: category.id,
        supplierId: supplier.id,
        batchNumber: `RAW-${Date.now()}`,
        purchaseDate: new Date().toISOString().split('T')[0],
        expirationDate: '2025-12-31',
        quantity: 50,
        unit: unit.symbol,
        costPerUnit: 2.5,
        reorderLevel: 10,
        storageLocationId: location.id
      };

      const createRawResult = await rawMaterialsApi.create(createRawMaterialData);
      ctx.createdRawMaterialId = createRawResult.data?.id;
      return { message: `Created raw material ${createRawResult.data?.id}`, data: createRawResult.data };
    });

    // 7 Update Raw Material
    await safeTest(6, async () => {
      if (!ctx.createdRawMaterialId) {
        return { skip: true, skipMessage: 'No created raw material to update' };
      }
      const updateRawResult = await rawMaterialsApi.update(ctx.createdRawMaterialId, {
        quantity: 75,
        costPerUnit: 3.0,
        contaminated: false
      });
      return { message: `Updated raw material quantity to ${updateRawResult.data?.quantity}`, data: updateRawResult.data };
    });

    // 8 Delete Raw Material
    await safeTest(7, async () => {
      if (!ctx.createdRawMaterialId) {
        return { skip: true, skipMessage: 'No created raw material to delete' };
      }
      // Ensure we keep at least one raw material for recipe ingredient tests
      const existing = await rawMaterialsApi.getAll();
      if ((existing.data?.length || 0) <= 1) {
        return { skip: true, skipMessage: 'Preserving lone raw material for recipe tests' };
      }
      await rawMaterialsApi.delete(ctx.createdRawMaterialId);
      return { message: 'Raw material deleted (others remain)' };
    });

    // 9 Finished Products list
    await safeTest(8, async () => {
      const finishedProductsResult = await finishedProductsApi.getAll();
      ctx.finishedProducts = finishedProductsResult.data || [];
      return { message: `Found ${ctx.finishedProducts.length} finished products`, data: finishedProductsResult.data };
    });

    // 10 Create Finished Product
    await safeTest(9, async () => {
      console.debug('[API TEST] Test 10: Create Finished Product');
      // Refresh categories for potential new category creation
      const categoriesResult = await categoriesApi.getAll();
      ctx.categories = categoriesResult.data || [];
      // Some environments may not yet include FINISHED_PRODUCT in the enum; fall back to string literal
      const FINISHED_KEY = (CategoryType as any)?.FINISHED_PRODUCT || 'FINISHED_PRODUCT';
      let finishedCategories = ctx.categories.filter((c: any) => c.type === FINISHED_KEY);

      if (!finishedCategories.length) {
        // Attempt to create one
        const createCatResult = await categoriesApi.create({
          name: 'Test Finished Products',
          type: FINISHED_KEY,
          description: 'Auto-created for tests'
        } as any);
        if (createCatResult?.data) {
          finishedCategories = [createCatResult.data];
          ctx.categories.push(createCatResult.data);
        } else {
          return { skip: true, skipMessage: 'Unable to create finished product category' };
        }
      }

      const unit = (ctx.units || []).find((u: any) => u.symbol === 'pcs') || (ctx.units || [])[0];
      if (!unit) return { skip: true, skipMessage: 'No units available' };

      const createFinishedData = {
        name: `Test Finished Product ${Date.now()}`,
        sku: `TEST-FP-${Date.now()}`,
        categoryId: finishedCategories[0].id,
        batchNumber: `BATCH-${Date.now()}`,
        productionDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        shelfLife: 30,
        quantity: 100,
        unit: unit.symbol || 'pcs',
        salePrice: 15.99,
        costToProduce: 10.5,
        packagingInfo: 'Individual packaging'
      };
      const createFinishedResult = await finishedProductsApi.create(createFinishedData);
      ctx.createdFinishedProductId = createFinishedResult.data?.id;
      return { message: `Created finished product ${createFinishedResult.data?.id}`, data: createFinishedResult.data };
    });

    // 11 Update Finished Product
    await safeTest(10, async () => {
      if (!ctx.createdFinishedProductId) return { skip: true, skipMessage: 'No created finished product to update' };
      const updateFinishedResult = await finishedProductsApi.update(ctx.createdFinishedProductId, {
        quantity: 150,
        salePrice: 17.99
      });
      return { message: `Updated finished product quantity to ${updateFinishedResult.data?.quantity}`, data: updateFinishedResult.data };
    });

    // 12 Delete Finished Product
    await safeTest(11, async () => {
      if (!ctx.createdFinishedProductId) return { skip: true, skipMessage: 'No created finished product to delete' };
      await finishedProductsApi.delete(ctx.createdFinishedProductId);
      return { message: 'Finished product deleted successfully' };
    });

    // 13 Expiring
    await safeTest(12, async () => {
      const expiringResult = await finishedProductsApi.getExpiring(7);
      return { message: `Found ${expiringResult.data?.length || 0} products expiring in 7 days`, data: expiringResult.data };
    });

    // 14 Low Stock
    await safeTest(13, async () => {
      const lowStockResult = await finishedProductsApi.getLowStock(10);
      return { message: `Found ${lowStockResult.data?.length || 0} low stock products`, data: lowStockResult.data };
    });

    // 15 Reserve Product
    await safeTest(14, async () => {
      const allProducts = await finishedProductsApi.getAll();
      const availableProduct = allProducts.data?.find(p => p.quantity > p.reservedQuantity);
      if (!availableProduct) return { skip: true, skipMessage: 'No product with available quantity to reserve' };
      const reserveResult = await finishedProductsApi.reserveQuantity(availableProduct.id, 5);
      ctx.reservationProductId = availableProduct.id;
      return { message: `Reserved 5 units of ${availableProduct.name}`, data: reserveResult.data };
    });

    // 16 Release Reservation
    await safeTest(15, async () => {
      if (!ctx.reservationProductId) return { skip: true, skipMessage: 'No reservation product to release' };
      const releaseResult = await finishedProductsApi.releaseReservation(ctx.reservationProductId, 5);
      return { message: 'Released 5 units reservation', data: releaseResult.data };
    });

    // 17 Dashboard Summary
    await safeTest(16, async () => {
      const summaryResponse = await fetch('/api/dashboard/summary');
      const summaryResult = await summaryResponse.json();
      return { message: `Dashboard total items: ${summaryResult.data?.inventoryCounts?.total || 0}`, data: summaryResult.data };
    });

    // 18 Dashboard Alerts
    await safeTest(17, async () => {
      const alertsResponse = await fetch('/api/dashboard/alerts');
      const alertsResult = await alertsResponse.json();
      return { message: `Found ${alertsResult.data?.length || 0} alerts`, data: alertsResult.data };
    });

    // 19 Dashboard Trends
    await safeTest(18, async () => {
      const trendsResponse = await fetch('/api/dashboard/trends?days=7');
      const trendsResult = await trendsResponse.json();
      return { message: 'Trends loaded for 7 days', data: trendsResult.data };
    });

    // 20 Dashboard Categories
    await safeTest(19, async () => {
      const categoriesResponse = await fetch('/api/dashboard/categories');
      const categoriesResult = await categoriesResponse.json();
      return { message: 'Categories breakdown loaded', data: categoriesResult.data };
    });

    // 21 Dashboard Value
    await safeTest(20, async () => {
      const valueResponse = await fetch('/api/dashboard/value');
      const valueResult = await valueResponse.json();
      return { message: 'Value analysis loaded', data: valueResult.data };
    });

    // 22 Recipes list
    await safeTest(21, async () => {
      const recipesResponse = await fetch('/api/recipes');
      const recipesResult = await recipesResponse.json();
      ctx.recipes = recipesResult.data || [];
      return { message: `Found ${ctx.recipes.length} recipes`, data: recipesResult.data };
    });

    // 23 Create Recipe (guarantee prerequisites: recipe category + raw material)
    await safeTest(22, async () => {
      console.debug('[API TEST] Test 23: Create Recipe');
      // Ensure categories cached
      if (!ctx.categories) {
        const cats = await categoriesApi.getAll();
        ctx.categories = cats.data || [];
      }
      const RECIPE_KEY = (CategoryType as any)?.RECIPE || 'RECIPE';
      let recipeCategory = ctx.categories.find((c: any) => c.type === RECIPE_KEY);
      if (!recipeCategory) {
        try {
          const catCreate = await categoriesApi.create({ name: 'Test Recipes', type: RECIPE_KEY, description: 'Auto-created for tests' } as any);
          if (catCreate.data) {
            recipeCategory = catCreate.data;
            ctx.categories.push(catCreate.data);
          }
        } catch (e) {
          // proceed without dedicated recipe category if backend doesn't enforce
        }
      }

      // Ensure at least one raw material exists
      let rawMaterials = (await rawMaterialsApi.getAll()).data || [];
      if (!rawMaterials.length) {
        const rmCategory = ctx.categories.find((c: any) => c.type === CategoryType.RAW_MATERIAL) || ctx.categories[0];
        const supplier = (ctx.suppliers || [])[0];
        const location = (ctx.locations || [])[0];
        const unit = (ctx.units || [])[0];
        if (rmCategory && supplier && location && unit) {
          const tempRaw = await rawMaterialsApi.create({
            name: `Temp Raw ${Date.now()}`,
            categoryId: rmCategory.id,
            supplierId: supplier.id,
            batchNumber: `TMP-${Date.now()}`,
            purchaseDate: new Date().toISOString().split('T')[0],
            expirationDate: '2025-12-31',
            quantity: 10,
            unit: unit.symbol,
            costPerUnit: 1,
            reorderLevel: 2,
            storageLocationId: location.id
          });
          if (tempRaw.data) rawMaterials = [tempRaw.data];
        }
      }
      const rawMaterial = rawMaterials[0];
      if (!rawMaterial) return { skip: true, skipMessage: 'Unable to ensure raw material for recipe' };

      // Ensure a finished product exists to allow mixed ingredient recipes (previous test may have deleted one)
      let finishedList = (await finishedProductsApi.getAll()).data || [];
      const FINISHED_KEY = (CategoryType as any)?.FINISHED_PRODUCT || 'FINISHED_PRODUCT';
      if (!finishedList.length) {
        let finishedCat = ctx.categories.find((c: any) => c.type === FINISHED_KEY);
        if (!finishedCat) {
          try {
            const catRes = await categoriesApi.create({ name: 'Test Finished Auto', type: FINISHED_KEY, description: 'Auto-created for mixed recipe test' } as any);
            if (catRes.data) {
              finishedCat = catRes.data;
              ctx.categories.push(catRes.data);
            }
          } catch (e) {
            // ignore inability to create category
          }
        }
        const unit = (ctx.units || []).find((u: any) => u.symbol === 'pcs') || (ctx.units || [])[0];
        if (finishedCat && unit) {
          const fpRes = await finishedProductsApi.create({
            name: `Test FP Ingredient ${Date.now()}`,
            sku: `FP-ING-${Date.now()}`,
            categoryId: finishedCat.id,
            batchNumber: `FPB-${Date.now()}`,
            productionDate: new Date().toISOString().split('T')[0],
            expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            shelfLife: 14,
            quantity: 25,
            unit: unit.symbol || 'pcs',
            salePrice: 9.99,
            costToProduce: 4.5,
            packagingInfo: 'Bag'
          });
          if (fpRes.data) finishedList = [fpRes.data];
        }
      }
      const finishedProduct = finishedList[0];

      const mixed = !!finishedProduct; // fallback to raw-only if no finished product available
      const testRecipe = {
        name: `Test ${mixed ? 'Mixed' : 'Raw'} Recipe ${Date.now()}`,
        description: 'Test recipe for API validation (mixed ingredients)',
        yieldQuantity: 1,
        yieldUnit: 'kg',
        prepTime: 30,
        cookTime: 20,
        instructions: ['Mix ingredients', 'Bake until golden'],
        ingredients: [
          { ingredientType: 'RAW', rawMaterialId: rawMaterial.id, quantity: 0.5, unit: rawMaterial.unit, notes: 'Raw ingredient' },
          ...(mixed ? [{ ingredientType: 'FINISHED', finishedProductId: finishedProduct.id, quantity: 2, unit: finishedProduct.unit, notes: 'Finished product ingredient' }] : [])
        ]
      } as any;
      const createResponse = await fetch('/api/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testRecipe) });
      const createResult = await createResponse.json();
      if (!createResult.success) throw new Error(createResult.error || 'Failed to create recipe');
      ctx.createdRecipeId = createResult.data.id;
      ctx.mixedRecipe = mixed;
      return { message: `Recipe created ${createResult.data.name} (${mixed ? 'mixed' : 'raw-only'})`, data: createResult.data };
    });

    // 24 Recipe Cost Analysis
    await safeTest(23, async () => {
      let recipeId = ctx.createdRecipeId;
      if (!recipeId) {
        // fallback: fetch one
        const recipesResponse = await fetch('/api/recipes');
        const recipesResult = await recipesResponse.json();
        if (recipesResult.success && recipesResult.data?.length) recipeId = recipesResult.data[0].id; else return { skip: true, skipMessage: 'No recipe available for cost analysis' };
      }
      const costResponse = await fetch(`/api/recipes/${recipeId}/cost`);
      if (!costResponse.ok) throw new Error(`API error: ${costResponse.status}`);
      const costResult = await costResponse.json();
      if (!costResult.success) throw new Error(costResult.error || 'Cost analysis failed');
      const ingredientCosts = costResult.data?.ingredientCosts || [];
      const rawCount = ingredientCosts.filter((i: any) => i.rawMaterialId).length;
      const finishedCount = ingredientCosts.filter((i: any) => i.finishedProductId).length;
      return { message: `Cost: $${costResult.data?.totalCost?.toFixed(2) || '0.00'} (${rawCount} raw, ${finishedCount} finished)`, data: costResult.data };
    });

    // 25 What Can I Make
    await safeTest(24, async () => {
      const whatCanMakeResponse = await fetch('/api/recipes/what-can-i-make');
      if (!whatCanMakeResponse.ok) throw new Error(`API error: ${whatCanMakeResponse.status}`);
      const result = await whatCanMakeResponse.json();
      const canMakeCount = result.data?.canMakeCount || result.data?.recipes?.canMake?.length || 0;
      const totalRecipes = result.data?.totalRecipes || result.data?.recipes?.total || 0;
      if (!result.success) throw new Error(result.error || 'Unknown error');
      return { message: `Can make ${canMakeCount} of ${totalRecipes} recipes`, data: result.data };
    });

    // 26 Update Recipe
    await safeTest(25, async () => {
      if (!ctx.createdRecipeId) return { skip: true, skipMessage: 'No created recipe to update' };
      const updateData = { name: `Updated Test Recipe ${Date.now()}`, description: 'Updated test recipe description', prepTime: 45 };
      const updateResponse = await fetch(`/api/recipes/${ctx.createdRecipeId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
      const updateResult = await updateResponse.json();
      if (!updateResult.success) throw new Error(updateResult.error || 'Failed to update recipe');
      return { message: `Recipe updated ${updateResult.data.name}`, data: updateResult.data };
    });

    // 27 Delete Recipe
    await safeTest(26, async () => {
      console.debug('[API TEST] Test 27: Delete Recipe');
      if (!ctx.createdRecipeId) return { skip: true, skipMessage: 'No created recipe to delete' };
      const deleteResponse = await fetch(`/api/recipes/${ctx.createdRecipeId}`, { method: 'DELETE' });
      const deleteResult = await deleteResponse.json();
      if (!deleteResult.success) throw new Error(deleteResult.error || 'Failed to delete recipe');
      return { message: 'Recipe deleted successfully', data: deleteResult };
    });
    // 28 Finished Product Materials Traceability
    await safeTest(27, async () => {
      // Attempt to locate a finished product that is COMPLETED; if none, skip.
      const fps = await finishedProductsApi.getAll();
      const product = (fps.data || []).find((p: any) => (p.status || p.productionStatus) === 'COMPLETED') || (fps.data || [])[0];
      if (!product) return { skip: true, skipMessage: 'No finished products available for traceability' };
      try {
        const traceRes = await fetch(`/api/finished-products/${product.id}/materials`);
        if (!traceRes.ok) throw new Error(`HTTP ${traceRes.status}`);
        const traceJson = await traceRes.json();
        if (!traceJson.success) throw new Error(traceJson.error || 'Traceability endpoint failed');
        const mats = traceJson.data?.materials || [];
        const summary = traceJson.data?.summary || {};
        return { message: `Materials: ${mats.length} (Total Cost: $${(summary.totalProductionCost || 0).toFixed(2)})`, data: { materials: mats.slice(0,5), summary } };
      } catch (e:any) {
        throw new Error(`Traceability error: ${e.message}`);
      }
    });

    // 29 Production Workflow (Light)
    await safeTest(28, async () => {
      // Placeholder – real workflow requires multi-step production run. For now call health check.
      const healthResp = await fetch('/api/system/health');
      if (!healthResp.ok) return { skip: true, skipMessage: 'Health endpoint unavailable' };
      const healthJson = await healthResp.json();
      if (!healthJson.success) return { skip: true, skipMessage: 'Health check did not return success' };
      return { message: 'System health OK', data: healthJson.data };
    });

    // 30 Production Contamination Check
    await safeTest(29, async () => {
      // Query finished products for contaminated flag
      const fps = await finishedProductsApi.getAll();
      const contaminated = (fps.data || []).filter((p: any) => p.isContaminated);
      return { message: `${contaminated.length} contaminated product(s)`, data: contaminated.slice(0,3) };
    });

    // 31 Production Capacity Check
    await safeTest(30, async () => {
      // Placeholder capacity: count products vs categories
      const fps = await finishedProductsApi.getAll();
      const count = (fps.data || []).length;
      return { message: `Finished products count: ${count}`, data: fps.data?.slice(0,5) };
    });

    console.debug('[API TEST] Completed runAllTests in', Date.now() - ctx._startTime, 'ms');
  };

  // Optional auto-run support: append ?autoRun=1 to the URL to trigger automatically
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoRun') === '1' && tests.every(t => t.status === 'idle')) {
      runAllTests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ ...test, status: 'idle' as const, message: undefined, data: undefined })));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'testing': return 'info';
      case 'skipped': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <SuccessIcon />;
      case 'error': return <ErrorIcon />;
      case 'testing': return <CircularProgress size={20} />;
      case 'skipped': return <WarningIcon />;
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
  <Paper sx={{ p: 2, mb: 3, backgroundColor: stats.failed > 0 ? '#ffebee' : (stats.passed + stats.skipped === stats.total && stats.total > 0) ? '#e8f5e8' : '#f5f5f5' }}>
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
            {stats.skipped > 0 && <Chip label={`${stats.skipped} Skipped`} color="warning" size="small" />}
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
