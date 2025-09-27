import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get basic counts
    const [rawMaterialsCount, finishedProductsCount, recipesCount] = await Promise.all([
      prisma.rawMaterial.count(),
      prisma.finishedProduct.count(),
      prisma.recipe.count({ where: { isActive: true } }),
    ]);

    const summary = {
      inventoryCounts: {
        rawMaterials: rawMaterialsCount,
        finishedProducts: finishedProductsCount,
        recipes: recipesCount,
        total: rawMaterialsCount + finishedProductsCount,
      },
      message: 'Dashboard simplified - intermediate products removed'
    };

    res.json({
      success: true,
      data: summary,
    });

  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard summary',
    });
  }
};

export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts: any[] = [];
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Error getting dashboard alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard alerts',
    });
  }
};

// Stub out other functions to prevent errors
export const getInsights = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ success: true, data: { message: 'Insights temporarily disabled' } });
};

export const getCategoryBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ success: true, data: { message: 'Category breakdown temporarily disabled' } });
};

export const getTrends = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ success: true, data: { message: 'Trends temporarily disabled' } });
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ success: true, data: { message: 'Categories temporarily disabled' } });
};

export const getValue = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ success: true, data: { message: 'Value analysis temporarily disabled' } });
};