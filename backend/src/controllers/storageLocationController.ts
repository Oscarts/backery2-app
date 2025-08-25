import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const storageLocationController = {
  // Get all storage locations
  getAll: async (req: Request, res: Response) => {
    try {
      const locations = await prisma.storageLocation.findMany({
        orderBy: { name: 'asc' }
      });
      res.json({ success: true, data: locations });
    } catch (error) {
      console.error('Error fetching storage locations:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch storage locations' });
    }
  },

  // Get a single storage location by ID
  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const location = await prisma.storageLocation.findUnique({
        where: { id }
      });
      if (!location) {
        return res.status(404).json({ success: false, error: 'Storage location not found' });
      }
      res.json({ success: true, data: location });
    } catch (error) {
      console.error('Error fetching storage location:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch storage location' });
    }
  },

  // Create a new storage location
  create: async (req: Request, res: Response) => {
    try {
      const { name, type, description, capacity } = req.body;

      if (!name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name is required' 
        });
      }

      const location = await prisma.storageLocation.create({
        data: { name, type, description, capacity }
      });

      res.status(201).json({ success: true, data: location });
    } catch (error) {
      console.error('Error creating storage location:', error);
      res.status(500).json({ success: false, error: 'Failed to create storage location' });
    }
  },

  // Update a storage location
  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const { name, type, description, capacity } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (type !== undefined) updateData.type = type;
      if (description !== undefined) updateData.description = description;
      if (capacity !== undefined) updateData.capacity = capacity;

      const location = await prisma.storageLocation.update({
        where: { id },
        data: updateData
      });

      res.json({ success: true, data: location });
    } catch (error: any) {
      console.error('Error updating storage location:', error);
      if (error.code === 'P2025') {
        res.status(404).json({ success: false, error: 'Storage location not found' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update storage location' });
      }
    }
  },

  // Delete a storage location
  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.storageLocation.delete({
        where: { id }
      });
      res.json({ success: true, message: 'Storage location deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting storage location:', error);
      if (error.code === 'P2025') {
        res.status(404).json({ success: false, error: 'Storage location not found' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to delete storage location' });
      }
    }
  }
};
