import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get SKU mappings enriched with availability data for recipe ingredient selection.
 * Returns unique SKUs with aggregated quantities and pricing from all associated items.
 */
export const getSkuMappingsForRecipes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clientId = req.user!.clientId; // CRITICAL: Tenant isolation

        // Fetch all SKU mappings with related items
        const skuMappings = await prisma.skuMapping.findMany({
            where: { clientId },
            include: {
                category: true,
                rawMaterials: {
                    where: { clientId }, // Double-check tenant isolation
                    select: {
                        id: true,
                        quantity: true,
                        reservedQuantity: true,
                        unitPrice: true,
                        unit: true,
                        expirationDate: true
                    }
                },
                finishedProducts: {
                    where: { clientId }, // Double-check tenant isolation
                    select: {
                        id: true,
                        quantity: true,
                        reservedQuantity: true,
                        costToProduce: true,
                        unit: true,
                        expirationDate: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Enrich each SKU mapping with aggregated data
        const enrichedMappings = skuMappings.map(sku => {
            // Aggregate quantities across all items with this SKU
            const rawMaterialQty = sku.rawMaterials.reduce(
                (sum, rm) => sum + Math.max(0, rm.quantity - rm.reservedQuantity),
                0
            );
            const finishedProductQty = sku.finishedProducts.reduce(
                (sum, fp) => sum + Math.max(0, fp.quantity - fp.reservedQuantity),
                0
            );
            const totalAvailableQty = rawMaterialQty + finishedProductQty;

            // Calculate average/latest price
            const rawPrices = sku.rawMaterials
                .map(rm => rm.unitPrice)
                .filter(p => p > 0);
            const finishedPrices = sku.finishedProducts
                .map(fp => fp.costToProduce)
                .filter(p => p > 0);

            const allPrices = [...rawPrices, ...finishedPrices];
            const avgPrice = allPrices.length > 0
                ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
                : sku.unitPrice || 0;

            // Determine item types available
            const hasRawMaterials = sku.rawMaterials.length > 0;
            const hasFinishedProducts = sku.finishedProducts.length > 0;

            let itemType = 'none';
            if (hasRawMaterials && hasFinishedProducts) {
                itemType = 'both';
            } else if (hasRawMaterials) {
                itemType = 'raw_material';
            } else if (hasFinishedProducts) {
                itemType = 'finished_product';
            }

            // Get earliest expiration date (informational only)
            const allExpirations = [
                ...sku.rawMaterials.map(rm => rm.expirationDate),
                ...sku.finishedProducts.map(fp => fp.expirationDate)
            ].filter(Boolean);

            const earliestExpiration = allExpirations.length > 0
                ? new Date(Math.min(...allExpirations.map(d => d.getTime())))
                : null;

            return {
                id: sku.id,
                name: sku.name,
                sku: sku.sku,
                description: sku.description,
                unit: sku.unit,
                category: sku.category,
                availableQuantity: totalAvailableQty,
                estimatedPrice: avgPrice,
                itemType,
                hasRawMaterials,
                hasFinishedProducts,
                rawMaterialCount: sku.rawMaterials.length,
                finishedProductCount: sku.finishedProducts.length,
                earliestExpiration,
                createdAt: sku.createdAt,
                updatedAt: sku.updatedAt
            };
        });

        // Filter out SKUs with no available items (optional - may want to show all for reference)
        // const availableOnly = enrichedMappings.filter(sku => sku.availableQuantity > 0);

        res.json({
            success: true,
            data: enrichedMappings,
            meta: {
                total: enrichedMappings.length,
                withAvailability: enrichedMappings.filter(s => s.availableQuantity > 0).length
            }
        });
    } catch (error) {
        console.error('Error fetching SKU mappings for recipes:', error);
        next(error);
    }
};

/**
 * Get detailed information about a specific SKU mapping for recipe use.
 * Shows all associated items and their individual quantities.
 */
export const getSkuMappingDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const clientId = req.user!.clientId;

        const skuMapping = await prisma.skuMapping.findFirst({
            where: {
                id,
                clientId // CRITICAL: Tenant isolation
            },
            include: {
                category: true,
                storageLocation: true,
                rawMaterials: {
                    where: { clientId },
                    include: {
                        supplier: true,
                        storageLocation: true,
                        qualityStatus: true
                    }
                },
                finishedProducts: {
                    where: { clientId },
                    include: {
                        storageLocation: true,
                        category: true
                    }
                }
            }
        });

        if (!skuMapping) {
            return res.status(404).json({
                success: false,
                error: 'SKU mapping not found'
            });
        }

        res.json({
            success: true,
            data: skuMapping
        });
    } catch (error) {
        console.error('Error fetching SKU mapping details:', error);
        next(error);
    }
};

export default {
    getSkuMappingsForRecipes,
    getSkuMappingDetails
};
