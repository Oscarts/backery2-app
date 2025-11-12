import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const categoryController = {
  // Get all categories
  getAll: async (req: Request, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
      res.json({ success: true, data: categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
  },

  // Get a single category by ID
  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const category = await prisma.category.findUnique({
        where: { id }
      });
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch category' });
    }
  },

  // Create a new category
  create: async (req: Request, res: Response) => {
    try {
      const { name, type, description } = req.body;

      if (!name || !type) {
        return res.status(400).json({
          success: false,
          error: 'Name and type are required'
        });
      }

      // Note: clientId is automatically added by tenant isolation Prisma middleware
      const category = await prisma.category.create({
        data: { name, type, description }
      });

      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      console.error('Error creating category:', error);
      if (error.code === 'P2002') {
        // Unique constraint violation
        res.status(400).json({ 
          success: false, 
          error: 'A category with this name already exists' 
        });
      } else {
        res.status(500).json({ success: false, error: 'Failed to create category' });
      }
    }
  },

  // Update a category
  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const { name, type, description } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (type !== undefined) updateData.type = type;
      if (description !== undefined) updateData.description = description;

      const category = await prisma.category.update({
        where: { id },
        data: updateData
      });

      res.json({ success: true, data: category });
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.code === 'P2025') {
        res.status(404).json({ success: false, error: 'Category not found' });
      } else if (error.code === 'P2002') {
        // Unique constraint violation
        res.status(400).json({ 
          success: false, 
          error: 'A category with this name already exists' 
        });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update category' });
      }
    }
  },

  // Delete a category
  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.category.delete({
        where: { id }
      });
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      if (error.code === 'P2025') {
        res.status(404).json({ success: false, error: 'Category not found' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to delete category' });
      }
    }
  }
};
