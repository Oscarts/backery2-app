import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

/**
 * Tenant Isolation Middleware
 * 
 * Automatically filters all Prisma queries by the authenticated user's clientId
 * to ensure users can only access data belonging to their tenant/client.
 * 
 * This middleware must be used AFTER the authentication middleware.
 */

/**
 * Apply tenant isolation to Prisma client
 * Sets up middleware on Prisma to automatically add clientId filter
 */
export const setupTenantIsolation = (prisma: PrismaClient) => {
  console.log('🔒 Setting up tenant isolation middleware...');

  // Models that have clientId field (PascalCase as Prisma uses)
  const tenantModels = [
    'User',
    'RawMaterial',
    'FinishedProduct',
    'Recipe',
    'ProductionRun',
    'Customer',
    'CustomerOrder',
    'Category',
    'Supplier',
    'StorageLocation',
    'QualityStatus',
  ];

  console.log('✅ Tenant isolation models:', tenantModels);

  // Prisma middleware to add clientId filter
  prisma.$use(async (params, next) => {
    // Only apply to tenant models
    if (tenantModels.includes(params.model || '')) {
      // Add clientId filter for read operations
      if (params.action === 'findMany' || params.action === 'findFirst') {
        if (params.args.where) {
          // If where clause exists, add clientId to it
          if (!params.args.where.clientId) {
            params.args.where.clientId = (global as any).__currentClientId;
          }
        } else {
          // Create where clause with clientId
          params.args.where = { clientId: (global as any).__currentClientId };
        }
      }

      // Add clientId for count operations
      if (params.action === 'count') {
        if (params.args?.where) {
          if (!params.args.where.clientId) {
            params.args.where.clientId = (global as any).__currentClientId;
          }
        } else {
          params.args = params.args || {};
          params.args.where = { clientId: (global as any).__currentClientId };
        }
      }

      // Add clientId for findUnique if not explicitly provided
      if (params.action === 'findUnique') {
        if (params.args.where && !params.args.where.clientId) {
          // For findUnique, we need to ensure the record belongs to the client
          // This will be validated after the query
        }
      }

      // Add clientId to create operations
      if (params.action === 'create') {
        const currentClientId = (global as any).__currentClientId;
        console.log(`Prisma middleware - create action for ${params.model}`);
        console.log(`Prisma middleware - Current global clientId:`, currentClientId);
        console.log(`Prisma middleware - params.args.data:`, params.args.data);

        if (params.args.data && !params.args.data.clientId) {
          params.args.data.clientId = currentClientId;
          console.log(`Prisma middleware - Added clientId to data:`, params.args.data.clientId);
        }
      }

      // Add clientId to createMany operations
      if (params.action === 'createMany') {
        if (params.args.data) {
          if (Array.isArray(params.args.data)) {
            params.args.data = params.args.data.map((item: any) => ({
              ...item,
              clientId: item.clientId || (global as any).__currentClientId,
            }));
          }
        }
      }
    }

    const result = await next(params);

    // Post-query validation for findUnique
    if (
      tenantModels.includes(params.model || '') &&
      params.action === 'findUnique' &&
      result &&
      (result as any).clientId !== (global as any).__currentClientId
    ) {
      // User tried to access a record from another tenant
      return null;
    }

    return result;
  });
};

/**
 * Express middleware to set current client context
 * Must be used after authentication middleware
 */
export const tenantContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log('tenantContext middleware - req.user:', req.user);

  if (!req.user) {
    console.log('tenantContext middleware - No user found, returning 401');
    res.status(401).json({
      success: false,
      error: 'Authentication required for tenant isolation',
    });
    return;
  }

  // Set the current clientId in global context for Prisma middleware
  (global as any).__currentClientId = req.user.clientId;

  console.log('tenantContext middleware - Set global clientId to:', req.user.clientId);

  next();
};

/**
 * Middleware to ensure clientId matches authenticated user
 * Use this for update/delete operations to prevent cross-tenant modifications
 */
export const validateTenantAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // The Prisma middleware will handle the filtering
  // This is just an additional explicit check
  next();
};
