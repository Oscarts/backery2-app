/**
 * Test to verify finished product production status behavior
 */
const axios = require('axios');

const API = axios.create({ baseURL: 'http://localhost:8000/api', timeout: 5000 });

async function run() {
  console.log('🧪 Testing finished product status...');
  let createdId = null;
  try {
    // Ensure we have a category and storage location
    const [cats, locs] = await Promise.all([
      API.get('/categories'),
      API.get('/storage-locations'),
    ]);
    const category = cats.data.data.find(c => c.type === 'FINISHED_PRODUCT') || cats.data.data[0];
    const storageLocation = locs.data.data[0];
    if (!category) throw new Error('No category available');

    // Create with IN_PRODUCTION
    const createRes = await API.post('/finished-products', {
      name: `Status Test Product ${Date.now()}`,
      sku: `FP-STATUS-${Date.now()}`,
      categoryId: category.id,
      batchNumber: `BATCH-${Date.now()}`,
      productionDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 3*24*60*60*1000).toISOString(),
      shelfLife: 3,
      quantity: 5,
      unit: 'pcs',
      salePrice: 9.99,
      storageLocationId: storageLocation?.id,
      status: 'IN_PRODUCTION',
    });
    createdId = createRes.data.data.id;
    console.log('✅ Created product with status IN_PRODUCTION');

    // Filter by status should include the new product
    const listRes = await API.get('/finished-products', { params: { status: 'IN_PRODUCTION', limit: 100 } });
    const found = listRes.data.data.find(p => p.id === createdId);
    console.assert(found, '❌ Created product not found in status filter IN_PRODUCTION');
    if (found) console.log('✅ Found product in IN_PRODUCTION filter');

    // Update to DISCARDED
    const updRes = await API.put(`/finished-products/${createdId}`, { status: 'DISCARDED' });
    console.assert(updRes.data.data.status === 'DISCARDED', '❌ Status did not update to DISCARDED');
    console.log('✅ Updated status to DISCARDED');

    // Ensure not found in IN_PRODUCTION filter now
    const listAfter = await API.get('/finished-products', { params: { status: 'IN_PRODUCTION', limit: 100 } });
    const stillThere = listAfter.data.data.find(p => p.id === createdId);
    console.assert(!stillThere, '❌ Product still present in IN_PRODUCTION after update');
    console.log('✅ Product removed from IN_PRODUCTION filter after update');

    // Cleanup
    await API.delete(`/finished-products/${createdId}`);
    console.log('🧹 Cleaned up product');
    console.log('🎉 Finished product status tests passed');
    return true;
  } catch (err) {
    console.error('❌ Error in finished product status tests:', err.message);
    if (createdId) {
      try { await API.delete(`/finished-products/${createdId}`); } catch {}
    }
    return false;
  }
}

run().then(ok => process.exit(ok ? 0 : 1));
