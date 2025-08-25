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
  } catch (error) {
    console.error('Error creating unit:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(400).json({ success: false, error: 'Unit name or symbol already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create unit' });
    }
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
  } catch (error) {
    console.error('Error updating unit:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      res.status(404).json({ success: false, error: 'Unit not found' });
    } else if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(400).json({ success: false, error: 'Unit name or symbol already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update unit' });
    }
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
  } catch (error) {
    console.error('Error deleting unit:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      res.status(404).json({ success: false, error: 'Unit not found' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to delete unit' });
    }
  }
};
