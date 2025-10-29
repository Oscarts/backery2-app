import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';

interface DashboardSummary {
  totalInventoryValue: {
    costValue: number;
    saleValue: number;
    profitMargin: number;
    costBreakdown: {
      rawMaterials: number;
      finishedProducts: number;
    };
    saleBreakdown: {
      rawMaterials: number;
      finishedProducts: number;
    };
  };
  inventoryCounts: {
    rawMaterials: number;
    finishedProducts: number;
    recipes: number;
    total: number;
  };
  stockStatus: {
    expiring: number;
    lowStock: number;
    reserved: number;
    contaminated: number;
  };
  alertBreakdown: {
    rawMaterials: {
      expiring: number;
      lowStock: number;
      contaminated: number;
      total: number;
    };
    finishedProducts: {
      expiring: number;
      lowStock: number;
      reserved: number;
      total: number;
    };
    totalAlerts: number;
  };
  recentActivity: {
    itemsCreatedToday: number;
    itemsUpdatedToday: number;
    lastUpdateTime: string;
  };
}

interface AlertItem {
  id: string;
  name: string;
  type: 'raw_material' | 'intermediate_product' | 'finished_product';
  alertType: 'expired' | 'expiring_soon' | 'low_stock' | 'out_of_stock' | 'contaminated';
  severity: 'critical' | 'warning' | 'info';
  quantity?: number;
  unit?: string;
  expirationDate?: string;
  daysUntilExpiration?: number;
  category?: string;
  location?: string;
}

export const dashboardController = {
  // GET /api/dashboard/summary - Overall inventory metrics
  getSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Get counts for all inventory types
      const [rawMaterialsCount, finishedProductsCount, recipesCount] = await Promise.all([
        prisma.rawMaterial.count(),
        prisma.finishedProduct.count(),
        prisma.recipe.count({ where: { isActive: true } }),
      ]);

      // Calculate total inventory values
      const [rawMaterials, finishedProducts] = await Promise.all([
        prisma.rawMaterial.findMany({
          select: { quantity: true, unitPrice: true, isContaminated: true }
        }),
        prisma.finishedProduct.findMany({
          select: { quantity: true, salePrice: true, costToProduce: true, reservedQuantity: true }
        }),
      ]);

      // Calculate cost and sale values by product type
      const rawMaterialValue = rawMaterials
        .filter((rm: any) => !rm.isContaminated)
        .reduce((sum: number, rm: any) => sum + (rm.quantity * rm.unitPrice), 0);

      const finishedProductCostValue = finishedProducts
        .reduce((sum: number, fp: any) => sum + (fp.quantity * (fp.costToProduce || 0)), 0);

      const finishedProductSaleValue = finishedProducts
        .reduce((sum: number, fp: any) => sum + (fp.quantity * fp.salePrice), 0);

      // Calculate totals (without intermediate products)
      const totalCostValue = rawMaterialValue + finishedProductCostValue;
      const totalSaleValue = rawMaterialValue + finishedProductSaleValue;
      const profitMargin = totalSaleValue > 0 ? ((totalSaleValue - totalCostValue) / totalSaleValue) * 100 : 0;

      // Count items by status
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const [expiringRawMaterials, expiringFinishedProducts] = await Promise.all([
        prisma.rawMaterial.count({
          where: {
            expirationDate: { lte: sevenDaysFromNow, gte: today },
            isContaminated: false,
          }
        }),
        prisma.finishedProduct.count({
          where: {
            expirationDate: { lte: sevenDaysFromNow, gte: today },
          }
        }),
      ]);

      const [lowStockRawMaterials, lowStockFinishedProducts] = await Promise.all([
        prisma.rawMaterial.count({
          where: { quantity: { lte: 10 }, isContaminated: false }
        }),
        prisma.finishedProduct.count({
          where: { quantity: { lte: 10 } }
        }),
      ]);

      const contaminatedRawMaterials = await prisma.rawMaterial.count({ 
        where: { isContaminated: true } 
      });

      const reservedProducts = await prisma.finishedProduct.count({
        where: { reservedQuantity: { gt: 0 } }
      });

      // Get recent activity
      const [itemsCreatedToday, itemsUpdatedToday] = await Promise.all([
        Promise.all([
          prisma.rawMaterial.count({ where: { createdAt: { gte: startOfDay } } }),
          prisma.finishedProduct.count({ where: { createdAt: { gte: startOfDay } } }),
          prisma.recipe.count({ where: { createdAt: { gte: startOfDay } } }),
        ]).then(counts => counts.reduce((sum: number, count: number) => sum + count, 0)),
        Promise.all([
          prisma.rawMaterial.count({ where: { updatedAt: { gte: startOfDay } } }),
          prisma.finishedProduct.count({ where: { updatedAt: { gte: startOfDay } } }),
          prisma.recipe.count({ where: { updatedAt: { gte: startOfDay } } }),
        ]).then(counts => counts.reduce((sum: number, count: number) => sum + count, 0)),
      ]);

      const summary: DashboardSummary = {
        totalInventoryValue: {
          costValue: Math.round(totalCostValue * 100) / 100,
          saleValue: Math.round(totalSaleValue * 100) / 100,
          profitMargin: Math.round(profitMargin * 100) / 100,
          costBreakdown: {
            rawMaterials: Math.round(rawMaterialValue * 100) / 100,
            finishedProducts: Math.round(finishedProductCostValue * 100) / 100,
          },
          saleBreakdown: {
            rawMaterials: Math.round(rawMaterialValue * 100) / 100,
            finishedProducts: Math.round(finishedProductSaleValue * 100) / 100,
          },
        },
        inventoryCounts: {
          rawMaterials: rawMaterialsCount,
          finishedProducts: finishedProductsCount,
          recipes: recipesCount,
          total: rawMaterialsCount + finishedProductsCount,
        },
        stockStatus: {
          expiring: expiringRawMaterials + expiringFinishedProducts,
          lowStock: lowStockRawMaterials + lowStockFinishedProducts,
          reserved: reservedProducts,
          contaminated: contaminatedRawMaterials,
        },
        alertBreakdown: {
          rawMaterials: {
            expiring: expiringRawMaterials,
            lowStock: lowStockRawMaterials,
            contaminated: contaminatedRawMaterials,
            total: expiringRawMaterials + lowStockRawMaterials + contaminatedRawMaterials,
          },
          finishedProducts: {
            expiring: expiringFinishedProducts,
            lowStock: lowStockFinishedProducts,
            reserved: reservedProducts,
            total: expiringFinishedProducts + lowStockFinishedProducts + reservedProducts,
          },
          totalAlerts: expiringRawMaterials + expiringFinishedProducts +
            lowStockRawMaterials + lowStockFinishedProducts +
            contaminatedRawMaterials + reservedProducts,
        },
        recentActivity: {
          itemsCreatedToday,
          itemsUpdatedToday,
          lastUpdateTime: new Date().toISOString(),
        },
      };

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/dashboard/alerts - Expiration & low stock alerts
  getAlerts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alerts: AlertItem[] = [];
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Get expired and expiring raw materials
      const rawMaterials = await prisma.rawMaterial.findMany({
        where: {
          OR: [
            { expirationDate: { lt: today } },
            { expirationDate: { lte: sevenDaysFromNow, gte: today } },
            { quantity: { lte: 10 } },
            { isContaminated: true },
          ],
        },
        include: {
          category: { select: { name: true } },
          storageLocation: { select: { name: true } },
        },
      });

      rawMaterials.forEach(rm => {
        const daysUntilExpiration = Math.ceil((new Date(rm.expirationDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (rm.isContaminated) {
          alerts.push({
            id: rm.id,
            name: rm.name,
            type: 'raw_material',
            alertType: 'contaminated',
            severity: 'critical',
            quantity: rm.quantity,
            unit: rm.unit,
            category: rm.category?.name || 'Unknown',
            location: rm.storageLocation?.name,
          });
        } else if (daysUntilExpiration < 0) {
          alerts.push({
            id: rm.id,
            name: rm.name,
            type: 'raw_material',
            alertType: 'expired',
            severity: 'critical',
            quantity: rm.quantity,
            unit: rm.unit,
            expirationDate: rm.expirationDate.toISOString(),
            daysUntilExpiration,
            category: rm.category?.name || 'Unknown',
            location: rm.storageLocation?.name,
          });
        } else if (daysUntilExpiration <= 7) {
          alerts.push({
            id: rm.id,
            name: rm.name,
            type: 'raw_material',
            alertType: 'expiring_soon',
            severity: daysUntilExpiration <= 2 ? 'critical' : 'warning',
            quantity: rm.quantity,
            unit: rm.unit,
            expirationDate: rm.expirationDate.toISOString(),
            daysUntilExpiration,
            category: rm.category?.name || 'Unknown',
            location: rm.storageLocation?.name,
          });
        }

        if (rm.quantity <= rm.reorderLevel) {
          alerts.push({
            id: rm.id,
            name: rm.name,
            type: 'raw_material',
            alertType: rm.quantity === 0 ? 'out_of_stock' : 'low_stock',
            severity: rm.quantity === 0 ? 'critical' : 'warning',
            quantity: rm.quantity,
            unit: rm.unit,
            category: rm.category?.name || 'Unknown',
            location: rm.storageLocation?.name,
          });
        }
      });

      // Intermediate products removed; no alerts for that legacy type

      // Get finished products alerts
      const finishedProducts = await prisma.finishedProduct.findMany({
        where: {
          OR: [
            { expirationDate: { lt: today } },
            { expirationDate: { lte: sevenDaysFromNow, gte: today } },
            { quantity: { lte: 10 } },
          ],
        },
        include: {
          category: { select: { name: true } },
          storageLocation: { select: { name: true } },
        },
      });

      finishedProducts.forEach(fp => {
        const daysUntilExpiration = Math.ceil((new Date(fp.expirationDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiration < 0) {
          alerts.push({
            id: fp.id,
            name: fp.name,
            type: 'finished_product',
            alertType: 'expired',
            severity: 'critical',
            quantity: fp.quantity,
            unit: fp.unit,
            expirationDate: fp.expirationDate.toISOString(),
            daysUntilExpiration,
            category: fp.category?.name || 'Unknown',
            location: fp.storageLocation?.name,
          });
        } else if (daysUntilExpiration <= 7) {
          alerts.push({
            id: fp.id,
            name: fp.name,
            type: 'finished_product',
            alertType: 'expiring_soon',
            severity: daysUntilExpiration <= 2 ? 'critical' : 'warning',
            quantity: fp.quantity,
            unit: fp.unit,
            expirationDate: fp.expirationDate.toISOString(),
            daysUntilExpiration,
            category: fp.category?.name || 'Unknown',
            location: fp.storageLocation?.name,
          });
        }

        if (fp.quantity <= 10) {
          alerts.push({
            id: fp.id,
            name: fp.name,
            type: 'finished_product',
            alertType: fp.quantity === 0 ? 'out_of_stock' : 'low_stock',
            severity: fp.quantity === 0 ? 'critical' : 'warning',
            quantity: fp.quantity,
            unit: fp.unit,
            category: fp.category?.name || 'Unknown',
            location: fp.storageLocation?.name,
          });
        }
      });

      // Sort alerts by severity and then by days until expiration
      alerts.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (a.severity !== b.severity) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        if (a.daysUntilExpiration !== undefined && b.daysUntilExpiration !== undefined) {
          return a.daysUntilExpiration - b.daysUntilExpiration;
        }
        return 0;
      });

      res.json({
        success: true,
        data: alerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter(a => a.severity === 'critical').length,
          warning: alerts.filter(a => a.severity === 'warning').length,
          info: alerts.filter(a => a.severity === 'info').length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/dashboard/trends - Inventory trends over time
  getTrends: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily creation trends
      const dailyCreations = await Promise.all([
        prisma.rawMaterial.groupBy({
          by: ['createdAt'],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }),
        prisma.finishedProduct.groupBy({
          by: ['createdAt'],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }),
      ]);

      // Process daily trends
      const trendData = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        trendData.unshift({
          date: dateStr,
          rawMaterials: 0,
          intermediateProducts: 0, // legacy removed
          finishedProducts: 0,
          total: 0,
        });
      }

      // Aggregate daily creation data (simplified for demo)
      const recent = {
        last7Days: {
          rawMaterials: dailyCreations[0].length,
          intermediateProducts: 0,
          finishedProducts: dailyCreations[1].length,
          total: dailyCreations[0].length + dailyCreations[1].length,
        },
        last30Days: {
          rawMaterials: dailyCreations[0].length,
          intermediateProducts: 0,
          finishedProducts: dailyCreations[1].length,
          total: dailyCreations[0].length + dailyCreations[1].length,
        },
      };

      res.json({
        success: true,
        data: {
          daily: trendData,
          summary: recent,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/dashboard/categories - Category breakdown
  getCategories: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await prisma.category.findMany({
        include: {
          rawMaterials: { select: { quantity: true, unitPrice: true, isContaminated: true } },
          // intermediateProducts removed
          finishedProducts: { select: { quantity: true, salePrice: true, costToProduce: true } },
        },
      });

      const categoryBreakdown = categories.map(category => {
        const rawMaterialsValue = category.rawMaterials
          .filter(rm => !rm.isContaminated)
          .reduce((sum, rm) => sum + (rm.quantity * rm.unitPrice), 0);

        const finishedProductsSaleValue = category.finishedProducts
          .reduce((sum, fp) => sum + (fp.quantity * fp.salePrice), 0);

        const finishedProductsCostValue = category.finishedProducts
          .reduce((sum, fp) => sum + (fp.quantity * (fp.costToProduce || 0)), 0);

        return {
          id: category.id,
          name: category.name,
          type: category.type,
          counts: {
            rawMaterials: category.rawMaterials.length,
            intermediateProducts: 0,
            finishedProducts: category.finishedProducts.length,
            total: category.rawMaterials.length + category.finishedProducts.length,
          },
          values: {
            rawMaterialsValue: Math.round(rawMaterialsValue * 100) / 100,
            finishedProductsSaleValue: Math.round(finishedProductsSaleValue * 100) / 100,
            finishedProductsCostValue: Math.round(finishedProductsCostValue * 100) / 100,
            totalValue: Math.round((rawMaterialsValue + finishedProductsSaleValue) * 100) / 100,
          },
        };
      });

      res.json({
        success: true,
        data: categoryBreakdown,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/dashboard/value - Inventory value calculations
  getValue: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get detailed value breakdown
      const [rawMaterials, finishedProducts] = await Promise.all([
        prisma.rawMaterial.findMany({
          select: {
            id: true,
            name: true,
            quantity: true,
            unitPrice: true,
            unit: true,
            isContaminated: true,
            reorderLevel: true,
            category: { select: { name: true } },
            storageLocation: { select: { name: true } },
          },
        }),
        prisma.finishedProduct.findMany({
          select: {
            id: true,
            name: true,
            quantity: true,
            salePrice: true,
            costToProduce: true,
            unit: true,
            reservedQuantity: true,
            category: { select: { name: true } },
            storageLocation: { select: { name: true } },
          },
        }),
      ]);

      const rawMaterialsBreakdown = rawMaterials
        .filter(rm => !rm.isContaminated)
        .map(rm => ({
          id: rm.id,
          name: rm.name,
          category: rm.category?.name || 'Unknown',
          quantity: rm.quantity,
          unit: rm.unit,
          unitPrice: rm.unitPrice,
          totalValue: rm.quantity * rm.unitPrice,
        }))
        .sort((a, b) => b.totalValue - a.totalValue);

      const finishedProductsBreakdown = finishedProducts.map(fp => ({
        id: fp.id,
        name: fp.name,
        category: fp.category?.name || 'Unknown',
        quantity: fp.quantity,
        availableQuantity: fp.quantity - fp.reservedQuantity,
        reservedQuantity: fp.reservedQuantity,
        unit: fp.unit,
        salePrice: fp.salePrice,
        costToProduce: fp.costToProduce || 0,
        totalSaleValue: fp.quantity * fp.salePrice,
        totalCostValue: fp.quantity * (fp.costToProduce || 0),
        profitMargin: fp.salePrice > 0 ? (((fp.salePrice - (fp.costToProduce || 0)) / fp.salePrice) * 100) : 0,
      })).sort((a, b) => b.totalSaleValue - a.totalSaleValue);

      const totals = {
        rawMaterials: {
          totalValue: rawMaterialsBreakdown.reduce((sum, rm) => sum + rm.totalValue, 0),
          itemCount: rawMaterialsBreakdown.length,
        },
        finishedProducts: {
          totalSaleValue: finishedProductsBreakdown.reduce((sum, fp) => sum + fp.totalSaleValue, 0),
          totalCostValue: finishedProductsBreakdown.reduce((sum, fp) => sum + fp.totalCostValue, 0),
          itemCount: finishedProductsBreakdown.length,
          profitMargin: 0,
        },
      };

      totals.finishedProducts.profitMargin = totals.finishedProducts.totalSaleValue > 0
        ? ((totals.finishedProducts.totalSaleValue - totals.finishedProducts.totalCostValue) / totals.finishedProducts.totalSaleValue) * 100
        : 0;

      res.json({
        success: true,
        data: {
          rawMaterials: rawMaterialsBreakdown,
          finishedProducts: finishedProductsBreakdown,
          totals,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
