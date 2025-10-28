import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';
import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface OrderExportFilters {
  status?: OrderStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Generate PDF for a single order
 */
export const generateOrderPDF = async (orderId: string): Promise<Buffer> => {
  // Fetch order with all related data
  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(20).text('Customer Order', { align: 'center' });
      doc.moveDown();

      // Order Information
      doc.fontSize(12).text(`Order Number: ${order.orderNumber}`);
      doc.fontSize(10);
      doc.text(`Status: ${order.status}`);
      doc.text(`Expected Delivery: ${order.expectedDeliveryDate.toLocaleDateString()}`);
      doc.text(`Created: ${order.createdAt.toLocaleDateString()}`);
      doc.moveDown();

      // Customer Information
      doc.fontSize(12).text('Customer Information', { underline: true });
      doc.fontSize(10);
      doc.text(`Name: ${order.customer.name}`);
      if (order.customer.email) doc.text(`Email: ${order.customer.email}`);
      if (order.customer.phone) doc.text(`Phone: ${order.customer.phone}`);
      if (order.customer.address) doc.text(`Address: ${order.customer.address}`);
      doc.moveDown();

      // Order Items
      doc.fontSize(12).text('Order Items', { underline: true });
      doc.fontSize(9);

      // Table Header
      const tableTop = doc.y;
      const itemX = 50;
      const skuX = 200;
      const qtyX = 280;
      const unitPriceX = 340;
      const totalX = 450;

      doc.text('Product', itemX, tableTop);
      doc.text('SKU', skuX, tableTop);
      doc.text('Qty', qtyX, tableTop);
      doc.text('Unit Price', unitPriceX, tableTop);
      doc.text('Total', totalX, tableTop);

      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown(0.5);

      // Table Rows
      order.items.forEach((item) => {
        const y = doc.y;
        doc.text(item.productName, itemX, y, { width: 140 });
        doc.text(item.productSku || '-', skuX, y);
        doc.text(item.quantity.toString(), qtyX, y);
        doc.text(`$${item.unitPrice.toFixed(2)}`, unitPriceX, y);
        doc.text(`$${item.linePrice.toFixed(2)}`, totalX, y);
        doc.moveDown(0.8);
      });

      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      // Totals
      doc.fontSize(10);
      doc.text(`Total Production Cost: $${order.totalProductionCost.toFixed(2)}`, totalX - 100, doc.y, { align: 'right' });
      doc.text(`Markup: ${order.priceMarkupPercentage.toFixed(1)}%`, totalX - 100, doc.y, { align: 'right' });
      doc.fontSize(12).text(`Total Price: $${order.totalPrice.toFixed(2)}`, totalX - 100, doc.y, { align: 'right' });

      // Notes
      if (order.notes) {
        doc.moveDown(2);
        doc.fontSize(12).text('Notes:', { underline: true });
        doc.fontSize(10).text(order.notes);
      }

      // Footer
      doc.fontSize(8).text(
        `Generated on ${new Date().toLocaleString()}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Excel for a single order with multiple sheets
 */
export const generateOrderExcel = async (orderId: string): Promise<Buffer> => {
  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Order Summary
  const summarySheet = workbook.addWorksheet('Order Summary');
  summarySheet.columns = [
    { header: 'Field', key: 'field', width: 25 },
    { header: 'Value', key: 'value', width: 40 },
  ];

  summarySheet.addRows([
    { field: 'Order Number', value: order.orderNumber },
    { field: 'Status', value: order.status },
    { field: 'Expected Delivery', value: order.expectedDeliveryDate.toLocaleDateString() },
    { field: 'Created Date', value: order.createdAt.toLocaleDateString() },
    { field: '', value: '' },
    { field: 'Customer Name', value: order.customer.name },
    { field: 'Customer Email', value: order.customer.email || '-' },
    { field: 'Customer Phone', value: order.customer.phone || '-' },
    { field: 'Customer Address', value: order.customer.address || '-' },
    { field: '', value: '' },
    { field: 'Total Production Cost', value: `$${order.totalProductionCost.toFixed(2)}` },
    { field: 'Markup Percentage', value: `${order.priceMarkupPercentage.toFixed(1)}%` },
    { field: 'Total Price', value: `$${order.totalPrice.toFixed(2)}` },
  ]);

  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getCell('A11').font = { bold: true };
  summarySheet.getCell('A13').font = { bold: true };

  // Sheet 2: Order Items
  const itemsSheet = workbook.addWorksheet('Order Items');
  itemsSheet.columns = [
    { header: 'Product Name', key: 'productName', width: 30 },
    { header: 'SKU', key: 'productSku', width: 15 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Unit Cost', key: 'unitProductionCost', width: 12 },
    { header: 'Line Cost', key: 'lineProductionCost', width: 12 },
    { header: 'Unit Price', key: 'unitPrice', width: 12 },
    { header: 'Line Price', key: 'linePrice', width: 12 },
  ];

  order.items.forEach((item) => {
    itemsSheet.addRow({
      productName: item.productName,
      productSku: item.productSku || '-',
      quantity: item.quantity,
      unitProductionCost: `$${item.unitProductionCost.toFixed(2)}`,
      lineProductionCost: `$${item.lineProductionCost.toFixed(2)}`,
      unitPrice: `$${item.unitPrice.toFixed(2)}`,
      linePrice: `$${item.linePrice.toFixed(2)}`,
    });
  });

  itemsSheet.getRow(1).font = { bold: true };
  itemsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

/**
 * Generate bulk Excel export with filters
 */
export const generateBulkExcel = async (filters: OrderExportFilters): Promise<Buffer> => {
  // Build query
  const where: any = {};
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.customerId) {
    where.customerId = filters.customerId;
  }
  
  if (filters.startDate || filters.endDate) {
    where.expectedDeliveryDate = {};
    if (filters.startDate) {
      where.expectedDeliveryDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.expectedDeliveryDate.lte = new Date(filters.endDate);
    }
  }

  // Fetch orders
  const orders = await prisma.customerOrder.findMany({
    where,
    include: {
      customer: true,
      items: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Orders Summary
  const ordersSheet = workbook.addWorksheet('Orders');
  ordersSheet.columns = [
    { header: 'Order Number', key: 'orderNumber', width: 18 },
    { header: 'Customer', key: 'customer', width: 25 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Delivery Date', key: 'deliveryDate', width: 15 },
    { header: 'Items Count', key: 'itemsCount', width: 12 },
    { header: 'Total Cost', key: 'totalCost', width: 12 },
    { header: 'Total Price', key: 'totalPrice', width: 12 },
    { header: 'Markup %', key: 'markup', width: 10 },
  ];

  orders.forEach((order) => {
    ordersSheet.addRow({
      orderNumber: order.orderNumber,
      customer: order.customer.name,
      status: order.status,
      deliveryDate: order.expectedDeliveryDate.toLocaleDateString(),
      itemsCount: order.items.length,
      totalCost: `$${order.totalProductionCost.toFixed(2)}`,
      totalPrice: `$${order.totalPrice.toFixed(2)}`,
      markup: `${order.priceMarkupPercentage.toFixed(1)}%`,
    });
  });

  ordersSheet.getRow(1).font = { bold: true };
  ordersSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Sheet 2: All Items
  const allItemsSheet = workbook.addWorksheet('All Items');
  allItemsSheet.columns = [
    { header: 'Order Number', key: 'orderNumber', width: 18 },
    { header: 'Customer', key: 'customer', width: 25 },
    { header: 'Product Name', key: 'productName', width: 30 },
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Unit Price', key: 'unitPrice', width: 12 },
    { header: 'Line Price', key: 'linePrice', width: 12 },
  ];

  orders.forEach((order) => {
    order.items.forEach((item) => {
      allItemsSheet.addRow({
        orderNumber: order.orderNumber,
        customer: order.customer.name,
        productName: item.productName,
        sku: item.productSku || '-',
        quantity: item.quantity,
        unitPrice: `$${item.unitPrice.toFixed(2)}`,
        linePrice: `$${item.linePrice.toFixed(2)}`,
      });
    });
  });

  allItemsSheet.getRow(1).font = { bold: true };
  allItemsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

/**
 * Generate professional Word document (DOCX) for a single order
 * French-style proforma/devis format with TVA calculation
 * Excludes production costs - only shows sale prices
 */
export const generateOrderWord = async (orderId: string): Promise<Buffer> => {
  // Fetch order with all related data
  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Calculate totals
  const subtotalHT = order.totalPrice / (1 + order.tvaRate / 100); // Price before tax
  const tvaAmount = order.totalPrice - subtotalHT; // Tax amount
  const totalTTC = order.totalPrice; // Total including tax

  // Create professional document sections
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Document Title - DEVIS/PROFORMA
          new Paragraph({
            text: order.status === OrderStatus.DRAFT ? 'DEVIS' : 'PROFORMA',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400,
            },
          }),

          // Order Information Line
          new Paragraph({
            children: [
              new TextRun({
                text: `N° ${order.orderNumber}`,
                bold: true,
                size: 24,
              }),
              new TextRun({
                text: `          Date: ${order.createdAt.toLocaleDateString('fr-FR')}`,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Date de livraison prévue: ${order.expectedDeliveryDate.toLocaleDateString('fr-FR')}`,
                size: 22,
              }),
            ],
            spacing: { after: 400 },
          }),

          // Customer Information Section
          new Paragraph({
            text: 'CLIENT',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: order.customer.name,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),

          ...(order.customer.address
            ? [
                new Paragraph({
                  text: order.customer.address,
                  spacing: { after: 100 },
                }),
              ]
            : []),

          ...(order.customer.email
            ? [
                new Paragraph({
                  text: `Email: ${order.customer.email}`,
                  spacing: { after: 100 },
                }),
              ]
            : []),

          ...(order.customer.phone
            ? [
                new Paragraph({
                  text: `Téléphone: ${order.customer.phone}`,
                  spacing: { after: 400 },
                }),
              ]
            : []),

          // Items Table Header
          new Paragraph({
            text: 'DÉTAIL DE LA COMMANDE',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          // Items Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
              // Table Header
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: 'Désignation', alignment: AlignmentType.LEFT })],
                    shading: { fill: 'E0E0E0' },
                    width: { size: 40, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Référence', alignment: AlignmentType.CENTER })],
                    shading: { fill: 'E0E0E0' },
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Quantité', alignment: AlignmentType.CENTER })],
                    shading: { fill: 'E0E0E0' },
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Prix Unit. HT', alignment: AlignmentType.RIGHT })],
                    shading: { fill: 'E0E0E0' },
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Total HT', alignment: AlignmentType.RIGHT })],
                    shading: { fill: 'E0E0E0' },
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),

              // Table Rows - Items
              ...order.items.map(
                (item) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: item.productName })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: item.productSku || '-', alignment: AlignmentType.CENTER })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: item.quantity.toString(), alignment: AlignmentType.CENTER })],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            text: `${(item.unitPrice / (1 + order.tvaRate / 100)).toFixed(2)} €`,
                            alignment: AlignmentType.RIGHT,
                          }),
                        ],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            text: `${(item.linePrice / (1 + order.tvaRate / 100)).toFixed(2)} €`,
                            alignment: AlignmentType.RIGHT,
                          }),
                        ],
                      }),
                    ],
                  })
              ),
            ],
          }),

          // Totals Section
          new Paragraph({
            text: '',
            spacing: { before: 400 },
          }),

          // Subtotal HT
          new Paragraph({
            children: [
              new TextRun({
                text: 'Total HT (Hors Taxes):',
                size: 24,
              }),
              new TextRun({
                text: `${' '.repeat(50)}${subtotalHT.toFixed(2)} €`,
                size: 24,
                bold: false,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 100 },
          }),

          // TVA Amount
          new Paragraph({
            children: [
              new TextRun({
                text: `TVA (${order.tvaRate.toFixed(1)}%):`,
                size: 24,
              }),
              new TextRun({
                text: `${' '.repeat(50)}${tvaAmount.toFixed(2)} €`,
                size: 24,
                bold: false,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 100 },
          }),

          // Total TTC
          new Paragraph({
            children: [
              new TextRun({
                text: 'Total TTC (Toutes Taxes Comprises):',
                size: 26,
                bold: true,
              }),
              new TextRun({
                text: `${' '.repeat(30)}${totalTTC.toFixed(2)} €`,
                size: 26,
                bold: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
          }),

          // Notes Section (if any)
          ...(order.notes
            ? [
                new Paragraph({
                  text: 'NOTES',
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 400, after: 200 },
                }),
                new Paragraph({
                  text: order.notes,
                  spacing: { after: 400 },
                }),
              ]
            : []),

          // Payment Terms and Conditions
          new Paragraph({
            text: 'CONDITIONS DE PAIEMENT',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            text: 'Paiement à réception de facture.',
            spacing: { after: 100 },
          }),

          new Paragraph({
            text: 'Modalités de livraison: Selon accord avec le client.',
            spacing: { after: 100 },
          }),

          new Paragraph({
            text: 'Validité du devis: 30 jours.',
            spacing: { after: 400 },
          }),

          // Footer
          new Paragraph({
            text: '_'.repeat(80),
            spacing: { before: 600, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
                size: 18,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
};
