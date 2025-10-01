import { Request, Response } from 'express';
import * as orderExportService from '../services/orderExportService';

/**
 * Export single order as PDF
 */
export const exportOrderPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const pdfBuffer = await orderExportService.generateOrderPDF(id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting order to PDF:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export order to PDF',
    });
  }
};

/**
 * Export single order as Excel
 */
export const exportOrderExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const excelBuffer = await orderExportService.generateOrderExcel(id);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=order-${id}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting order to Excel:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export order to Excel',
    });
  }
};

/**
 * Export multiple orders as Excel with filters
 */
export const exportBulkExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = req.body;
    
    const excelBuffer = await orderExportService.generateBulkExcel(filters);
    
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders-export-${timestamp}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting bulk Excel:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export orders to Excel',
    });
  }
};
