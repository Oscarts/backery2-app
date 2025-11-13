import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';

/**
 * Permission types
 */
export type ResourceType =
  | 'dashboard'
  | 'raw-materials'
  | 'finished-products'
  | 'recipes'
  | 'production'
  | 'customers'
  | 'customer-orders'
  | 'settings'
  | 'users'
  | 'roles'
  | 'clients'
  | 'permissions'
  | 'reports'
  | 'api-test';

export type ActionType = 'view' | 'create' | 'edit' | 'delete';

/**
 * Cache for user permissions to avoid repeated database queries
 */
const permissionCache = new Map<string, Set<string>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  permissions: Set<string>;
  timestamp: number;
}

const permissionCacheWithTTL = new Map<string, CacheEntry>();

/**
 * Get user permissions from database or cache
 */
const getUserPermissions = async (
  userId: string,
  roleId: string | null
): Promise<Set<string>> => {
  const cacheKey = `${userId}:${roleId}`;
  
  // Check cache
  const cached = permissionCacheWithTTL.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }

  // If no roleId, user has no permissions
  if (!roleId) {
    const emptySet = new Set<string>();
    permissionCacheWithTTL.set(cacheKey, {
      permissions: emptySet,
      timestamp: Date.now(),
    });
    return emptySet;
  }

  // Fetch permissions from database
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: {
      permission: true,
    },
  });

  const permissions = new Set<string>(
    rolePermissions.map(
      (rp: any) => `${rp.permission.resource}:${rp.permission.action}`
    )
  );

  // Cache the result
  permissionCacheWithTTL.set(cacheKey, {
    permissions,
    timestamp: Date.now(),
  });

  return permissions;
};

/**
 * Clear permission cache for a user
 * Call this when user's role or permissions change
 */
export const clearPermissionCache = (userId: string): void => {
  // Remove all cache entries for this user
  for (const key of permissionCacheWithTTL.keys()) {
    if (key.startsWith(`${userId}:`)) {
      permissionCacheWithTTL.delete(key);
    }
  }
};

/**
 * Middleware to check if user has required permission
 * 
 * @param resource - The resource being accessed (e.g., 'raw-materials')
 * @param action - The action being performed (e.g., 'view', 'create')
 * @param options - Optional configuration
 */
export const requirePermission = (
  resource: ResourceType,
  action: ActionType
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Get user permissions
      const permissions = await getUserPermissions(
        req.user.id,
        req.user.roleId
      );

      // Check if user has the required permission
      const requiredPermission = `${resource}:${action}`;
      if (!permissions.has(requiredPermission)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          details: `Required permission: ${requiredPermission}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed',
      });
    }
  };
};

/**
 * Middleware to check if user has ANY of the required permissions
 */
export const requireAnyPermission = (
  permissions: Array<{ resource: ResourceType; action: ActionType }>
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Get user permissions
      const userPermissions = await getUserPermissions(
        req.user.id,
        req.user.roleId
      );

      // Check if user has any of the required permissions
      const hasPermission = permissions.some((perm) =>
        userPermissions.has(`${perm.resource}:${perm.action}`)
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          details: `Required one of: ${permissions
            .map((p) => `${p.resource}:${p.action}`)
            .join(', ')}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed',
      });
    }
  };
};

/**
 * Helper to check permissions programmatically
 */
export const hasPermission = async (
  userId: string,
  roleId: string | null,
  resource: ResourceType,
  action: ActionType
): Promise<boolean> => {
  const permissions = await getUserPermissions(userId, roleId);
  return permissions.has(`${resource}:${action}`);
};

/**
 * Middleware to attach user permissions to request
 * Useful for conditional UI rendering
 */
export const attachPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user && req.user.roleId) {
      const permissions = await getUserPermissions(
        req.user.id,
        req.user.roleId
      );
      (req as any).permissions = Array.from(permissions);
    } else {
      (req as any).permissions = [];
    }
    next();
  } catch (error) {
    console.error('Error attaching permissions:', error);
    next(); // Continue even if there's an error
  }
};
