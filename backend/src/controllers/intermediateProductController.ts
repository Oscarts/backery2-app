// Deprecated: intermediate products feature removed. This stub remains to avoid import errors
// and to document intentional deprecation.
export const intermediateProductController = {
  getAll: (_req: any, res: any) => res.status(410).json({ success: false, error: 'Intermediate products deprecated' }),
  getById: (_req: any, res: any) => res.status(410).json({ success: false, error: 'Intermediate products deprecated' }),
  create: (_req: any, res: any) => res.status(410).json({ success: false, error: 'Intermediate products deprecated' }),
  update: (_req: any, res: any) => res.status(410).json({ success: false, error: 'Intermediate products deprecated' }),
  delete: (_req: any, res: any) => res.status(410).json({ success: false, error: 'Intermediate products deprecated' })
};
