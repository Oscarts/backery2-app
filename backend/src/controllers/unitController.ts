import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all units
export const getAllUnits = async (req: Request, res: Response) => {
  try {
    const units = await prisma.unit.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: units });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch units' });
  }
};

// Get unit by ID
export const getUnitById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const unit = await prisma.unit.findUnique({
      where: { id }
    });

    if (!unit) {
      return res.status(404).json({ success: false, error: 'Unit not found' });
    }

    res.json({ success: true, data: unit });
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch unit' });
  }
};

// Create new unit
export const createUnit = async (req: Request, res: Response) => {
  try {
    const { name, symbol, category, description } = req.body;

    const unit = await prisma.unit.create({
      data: {
        name,
        symbol,
        category,
        description
      }
    });

    res.status(201).json({ success: true, data: unit });
  } catch (error: any) {
    console.error('Error creating unit:', error);
    
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      const message = field === 'name' 
        ? 'Unit name already exists' 
        : field === 'symbol' 
        ? 'Unit symbol already exists' 
        : 'Unit name or symbol already exists';
      return res.status(400).json({ success: false, error: message });
    }
    
    res.status(500).json({ success: false, error: 'Failed to create unit' });
  }
};

// Update unit
export const updateUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, symbol, category, description, isActive } = req.body;

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        name,
        symbol,
        category,
        description,
        isActive
      }
    });

    res.json({ success: true, data: unit });
  } catch (error: any) {
    console.error('Error updating unit:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Unit not found' });
    }
    
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      const message = field === 'name' 
        ? 'Unit name already exists' 
        : field === 'symbol' 
        ? 'Unit symbol already exists' 
        : 'Unit name or symbol already exists';
      return res.status(400).json({ success: false, error: message });
    }
    
    res.status(500).json({ success: false, error: 'Failed to update unit' });
  }
};

// Delete unit (soft delete by setting isActive to false)
export const deleteUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const unit = await prisma.unit.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ success: true, data: unit });
  } catch (error: any) {
    console.error('Error deleting unit:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Unit not found' });
    }
    
    res.status(500).json({ success: false, error: 'Failed to delete unit' });
  }
};
