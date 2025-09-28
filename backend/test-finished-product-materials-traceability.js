/**
 * Regression test: Ensure finished product material breakdown works with mixed (raw + finished) ingredients.
 */
const axios = require('axios');

const API = axios.create({ baseURL: 'http://localhost:8000/api', timeout: 10000 });
let baselineFinishedProductIds = new Set();

async function ensureCategory(type) {
  const res = await API.get('/categories');
  const cat = res.data.data.find(c => c.type === type) || res.data.data[0];
  if (!cat) throw new Error('No category found for type ' + type);
  return cat.id;
}

async function ensureStorageLocation() {
  const res = await API.get('/storage-locations');
  const loc = res.data.data[0];
  if (!loc) throw new Error('No storage location available');
  return loc.id;
}

async function createRawMaterial(name, unit = 'kg') {
  const categoryId = await ensureCategory('RAW_MATERIAL');
  const storageLocationId = await ensureStorageLocation();
  // Ensure we have at least one supplier (create a disposable one)
  const supplierRes = await API.post('/suppliers', {
    name: 'Supplier ' + Math.random().toString(36).substring(2,6),
    contactInfo: 'test@example.com'
  });
  const supplierId = supplierRes.data.data.id;
  const payload = {
    name: name + ' ' + Date.now(),
    categoryId,
    quantity: 100,
    unit,
    costPerUnit: 2.5,
    reorderLevel: 10,
    batchNumber: 'BATCH-' + Math.random().toString(36).substring(2,6).toUpperCase(),
    storageLocationId,
    supplierId
    ,purchaseDate: new Date().toISOString(),
    expirationDate: new Date(Date.now()+14*24*60*60*1000).toISOString()
  };
  const res = await API.post('/raw-materials', payload);
  return res.data.data;
}

async function createBaseFinishedProduct() {
  // We'll create a simple base finished product via direct endpoint so it can be used as ingredient
  const categoryId = await ensureCategory('FINISHED_PRODUCT');
  const storageLocationId = await ensureStorageLocation();
  const res = await API.post('/finished-products', {
    name: 'Base FP ' + Date.now(),
    sku: 'BFP-' + Math.random().toString(36).substring(2,8).toUpperCase(),
    categoryId,
    batchNumber: 'BFP-BATCH-' + Math.random().toString(36).substring(2,6).toUpperCase(),
    productionDate: new Date().toISOString(),
    expirationDate: new Date(Date.now()+7*24*60*60*1000).toISOString(),
    shelfLife: 7,
    quantity: 50,
    unit: 'pcs',
    salePrice: 5.0,
    storageLocationId,
    // valid statuses (per controller list may differ, Prisma uses ProductionStatus enum)
    status: 'COMPLETED'
  });
  return res.data.data;
}

async function createMixedRecipe(rawMat, finishedProd) {
  const categoryId = await ensureCategory('RECIPE');
  const recipeRes = await API.post('/recipes', {
    name: 'Mixed Recipe ' + Date.now(),
    description: 'Recipe mixing raw + finished product',
    categoryId, // optional but include if exists
    yieldQuantity: 10,
    yieldUnit: 'pcs',
    prepTime: 30,
    cookTime: 15,
    instructions: ['Mix', 'Bake'],
    ingredients: [
      { rawMaterialId: rawMat.id, quantity: 2, unit: rawMat.unit },
      { finishedProductId: finishedProd.id, quantity: 5, unit: finishedProd.unit }
    ]
  });
  return recipeRes.data.data;
}

async function createProductionRun(recipe) {
  const res = await API.post('/production/runs', {
    name: 'Run ' + Date.now(),
    recipeId: recipe.id,
    targetQuantity: 10,
    targetUnit: 'pcs'
  });
  return res.data.data;
}

async function allocateMaterials(run) {
  const res = await API.post(`/production/runs/${run.id}/materials/allocate`, {});
  return res.data.data;
}

async function consumeAll(run) {
  // Fetch allocations to get IDs
  const matsRes = await API.get(`/production/runs/${run.id}/materials`);
  const allocations = matsRes.data.data.materials || matsRes.data.data || [];
  if (allocations.length === 0) throw new Error('No allocations found to consume');

  const consumptions = allocations.map(a => ({ allocationId: a.id, quantityConsumed: a.quantityAllocated }));
  await API.post(`/production/runs/${run.id}/materials/consume`, { consumptions });
}

async function completeProduction(run) {
  // Get steps then start + complete them; on final step send yieldQuantity
  const stepsRes = await API.get(`/production/runs/${run.id}/steps`);
  const steps = stepsRes.data.data || [];
  for (let i=0;i<steps.length;i++) {
    const step = steps[i];
    if (step.status === 'PENDING') {
      await API.post(`/production/steps/${step.id}/start`, { notes: 'Auto start' });
    }
    await API.post(`/production/steps/${step.id}/complete`, {
      notes: 'Auto complete',
      qualityCheckPassed: true,
      actualMinutes: step.estimatedMinutes || 10,
      yieldQuantity: i === steps.length - 1 ? 10 : undefined
    });
  }
}

async function fetchFinishedProductFromRun(run) {
  // After completion, list finished products and pick new one matching run target
  const res = await API.get('/finished-products');
  const list = res.data.data;
  // find by productionRunId link
  return list.find(fp => fp.productionRunId === run.id);
}

async function test() {
  console.log('🧪 Starting finished product materials traceability (mixed) test');
  let cleanup = { rawIds: [], recipeId: null, finishedIds: [] };
  try {
    console.log('→ Creating raw material');
    const raw = await createRawMaterial('Flour');
    cleanup.rawIds.push(raw.id);
    console.log('→ Creating base finished product');
    const baseFP = await createBaseFinishedProduct();
    cleanup.finishedIds.push(baseFP.id);
  // Capture baseline finished product IDs before production
  const initialListRes = await API.get('/finished-products');
  baselineFinishedProductIds = new Set(initialListRes.data.data.map(p => p.id));

    console.log('→ Creating mixed recipe');
    const recipe = await createMixedRecipe(raw, baseFP);
    cleanup.recipeId = recipe.id;
    console.log('✅ Created mixed recipe with raw + finished ingredients');

    console.log('→ Creating production run');
    const run = await createProductionRun(recipe);
    console.log('✅ Created production run');

    console.log('→ Allocating materials');
    await allocateMaterials(run);
    console.log('✅ Allocated materials');

    console.log('→ Consuming materials');
    await consumeAll(run);
    console.log('✅ Recorded material consumption');

    console.log('→ Completing production run');
    await completeProduction(run);
    console.log('✅ Completed production run');

    console.log('→ Manually finalizing production run to create finished product');
    try {
      await API.put(`/production/runs/${run.id}`, { status: 'COMPLETED', targetQuantity: 10 });
      console.log('✅ Production run marked COMPLETED');
    } catch (e) {
      console.error('⚠️ Failed to mark production run COMPLETED', e.response?.data || e.message);
    }

    // Debug: fetch production run details
    try {
      const runDetails = await API.get(`/production/runs/${run.id}`);
      console.log('🔍 Production run status after completion:', runDetails.data.data?.status || runDetails.data.status);
    } catch (e) {
      console.log('⚠️ Could not fetch production run details');
    }

    try {
      const fpList = await API.get('/finished-products');
      console.log('🔍 Finished products count:', fpList.data.data.length);
      const maybe = fpList.data.data.filter(p => p.productionRunId === run.id);
      console.log('🔍 Finished products linked to run:', maybe.length);
    } catch (e) {
      console.log('⚠️ Could not list finished products');
    }

    const produced = await fetchFinishedProductFromRun(run);
    if (!produced) throw new Error('Produced finished product not found');
    console.log('✅ Located produced finished product', produced.id);

    const traceRes = await API.get(`/finished-products/${produced.id}/materials`);
    const data = traceRes.data.data;
    if (!data || !data.materials) throw new Error('No materials data returned');

    const hasRaw = data.materials.some(m => m.materialType === 'RAW_MATERIAL');
    const hasFinished = data.materials.some(m => m.materialType === 'FINISHED_PRODUCT');

    if (!hasRaw || !hasFinished) {
      console.error('Materials returned:', data.materials.map(m => m.materialType));
      throw new Error('Material breakdown missing raw or finished product entries');
    }

    if (data.summary.totalMaterialsUsed < 2) throw new Error('Summary totalMaterialsUsed seems incorrect');
    if (data.summary.totalMaterialCost <= 0) throw new Error('Total material cost should be > 0');

    console.log('🎉 Mixed material traceability test passed');
    return true;
  } catch (err) {
    if (err.response) {
      console.error('❌ Test failed with response status', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('❌ Test failed:', err.message);
    }
    return false;
  }
}

if (require.main === module) {
  test().then(ok => process.exit(ok ? 0 : 1));
}

module.exports = test;
