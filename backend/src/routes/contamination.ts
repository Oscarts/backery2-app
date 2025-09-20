import { Router } from 'express';
import { prisma } from '../app';

const router = Router();

// GET /api/contamination/status
// Gets an overview of contaminated items in the system
router.get('/status', async (req, res) => {
  try {
    // Get counts of contaminated items
    const rawMaterials = await prisma.rawMaterial.count({
      where: { isContaminated: true }
    });

    const intermediateProducts = await prisma.intermediateProduct.count({
      where: { contaminated: true }
    });

    // For finishedProducts, we need to query differently since the schema might have conflicts
    const finishedProductsResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM finished_products WHERE "isContaminated" = true
    `;

    // Type-safe access to the query result
    const finishedProducts = Array.isArray(finishedProductsResult) && finishedProductsResult.length > 0
      ? Number(finishedProductsResult[0].count)
      : 0;

    res.json({
      success: true,
      data: {
        rawMaterials,
        intermediateProducts,
        finishedProducts,
        total: rawMaterials + intermediateProducts + finishedProducts
      }
    });
  } catch (error) {
    console.error('Error getting contamination status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contamination status'
    });
  }
});

// POST /api/contamination/report
// Endpoint for reporting contamination
router.post('/report', (req, res) => {
  res.json({
    success: true,
    message: 'Contamination tracking API - to be implemented'
  });
});

export default router;
