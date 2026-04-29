const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generar un PDF de la factura
 */
async function generateInvoicePDF(order, items) {
  return new Promise((resolve, reject) => {
    try {
      const invoicesDir = path.join(__dirname, '../facturas');
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir);
      }

      const filePath = path.join(invoicesDir, `factura_${order.id}.pdf`);
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- BRANDING & HEADER ---
      doc.rect(0, 0, 595, 100).fill('#0f172a'); // Header background (Slate 900)
      
      doc.fillColor('#38bdf8').fontSize(28).font('Helvetica-Bold')
         .text('HARDWARE', 40, 30, { continued: true })
         .fillColor('#ffffff').text(' HAVEN.');
      
      doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
         .text('Zeballos 1315, Rosario, Santa Fe', 40, 65)
         .text('CUIT: 30-12345678-9 | IVA Responsable Inscripto', 40, 80);

      // --- INVOICE DETAILS BOX ---
      doc.rect(380, 20, 175, 60).fill('#1e293b').stroke();
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
         .text('COMPROBANTE', 390, 30, { align: 'right', width: 155 });
      doc.fillColor('#e2e8f0').fontSize(14)
         .text(`N° 0001-${String(order.id).padStart(8, '0')}`, 390, 45, { align: 'right', width: 155 });
      doc.fillColor('#94a3b8').fontSize(9)
         .text(`Emisión: ${new Date(order.fecha_compra).toLocaleDateString('es-AR')}`, 390, 65, { align: 'right', width: 155 });

      // --- CLIENT & SHIPPING INFO ---
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold')
         .text('DATOS DE FACTURACIÓN', 40, 130);
      doc.rect(40, 150, 515, 65).stroke('#cbd5e1');
      
      doc.fontSize(10).font('Helvetica-Bold').text('Cliente:', 50, 160)
         .font('Helvetica').text(order.User?.name || 'Consumidor Final', 100, 160);
      
      doc.font('Helvetica-Bold').text('Email:', 50, 175)
         .font('Helvetica').text(order.User?.email || '-', 100, 175);
         
      doc.font('Helvetica-Bold').text('Entrega:', 50, 190)
         .font('Helvetica').text(`${order.shipping_method?.toUpperCase()} - ${order.shipping_method === 'tienda' ? 'Retiro en sucursal (Zeballos 1315, Rosario)' : (order.shipping_address + ' ' + (order.localidad || '') + ' ' + (order.codigo_postal || ''))}`, 100, 190);

      // --- ITEMS TABLE HEADER ---
      const tableTop = 240;
      doc.rect(40, tableTop, 515, 25).fill('#f1f5f9').stroke('#cbd5e1');
      doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold');
      doc.text('CÓDIGO', 50, tableTop + 8);
      doc.text('DESCRIPCIÓN', 110, tableTop + 8);
      doc.text('CANT.', 380, tableTop + 8, { align: 'center', width: 40 });
      doc.text('P. UNIT', 430, tableTop + 8, { align: 'right', width: 55 });
      doc.text('SUBTOTAL', 495, tableTop + 8, { align: 'right', width: 55 });

      // --- ITEMS ROW ---
      let y = tableTop + 25;
      doc.font('Helvetica').fillColor('#000000').fontSize(9);
      
      items.forEach((item, index) => {
        // Alternating row background
        if (index % 2 !== 0) doc.rect(40, y, 515, 25).fill('#f8fafc');
        
        doc.fillColor('#000000');
        doc.text(`HW-${String(item.productId || index).padStart(4, '0')}`, 50, y + 8);
        doc.text(item.name.substring(0, 50), 110, y + 8);
        doc.text(String(item.quantity || 1), 380, y + 8, { align: 'center', width: 40 });
        doc.text(`$${Number(item.priceAtPurchase).toLocaleString('es-AR')}`, 430, y + 8, { align: 'right', width: 55 });
        doc.text(`$${(Number(item.priceAtPurchase) * (item.quantity || 1)).toLocaleString('es-AR')}`, 495, y + 8, { align: 'right', width: 55 });
        
        // Draw vertical lines
        doc.moveTo(105, y).lineTo(105, y + 25).stroke('#cbd5e1');
        doc.moveTo(375, y).lineTo(375, y + 25).stroke('#cbd5e1');
        doc.moveTo(425, y).lineTo(425, y + 25).stroke('#cbd5e1');
        doc.moveTo(490, y).lineTo(490, y + 25).stroke('#cbd5e1');
        
        y += 25;
      });
      
      // Bottom table border
      doc.moveTo(40, y).lineTo(555, y).stroke('#cbd5e1');
      // Side borders
      doc.moveTo(40, tableTop + 25).lineTo(40, y).stroke('#cbd5e1');
      doc.moveTo(555, tableTop + 25).lineTo(555, y).stroke('#cbd5e1');

      // --- TOTALS ---
      y += 20;
      doc.rect(375, y, 180, 75).stroke('#cbd5e1');
      
      const subtotal = Number(order.total) - Number(order.shipping_cost);
      
      doc.fontSize(10).font('Helvetica').fillColor('#475569');
      doc.text('Subtotal:', 385, y + 15);
      doc.text(`$${subtotal.toLocaleString('es-AR')}`, 450, y + 15, { align: 'right', width: 95 });
      
      doc.text('Costo de Envío:', 385, y + 35);
      doc.text(`$${Number(order.shipping_cost).toLocaleString('es-AR')}`, 450, y + 35, { align: 'right', width: 95 });

      doc.moveTo(375, y + 55).lineTo(555, y + 55).stroke('#cbd5e1');

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a');
      doc.text('TOTAL:', 385, y + 62);
      doc.text(`$${Number(order.total).toLocaleString('es-AR')}`, 450, y + 62, { align: 'right', width: 95 });

      // --- FOOTER & TECH DECORATION ---
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
      doc.text('Este documento es un comprobante no válido como factura legal salvo indicación contraria.', 40, 740, { align: 'center' });
      doc.text('Hardware Haven garantiza los componentes por 12 meses desde la fecha de emisión.', 40, 755, { align: 'center' });
      
      // Simulated Barcode
      doc.font('Helvetica-Bold').fontSize(24).fillColor('#cbd5e1')
         .text(`| || | |||| || || | || | |||`, 40, 700, { align: 'center', characterSpacing: 2 });
      doc.fontSize(6).text(`ORD-${order.id}-AUTH`, 40, 725, { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateInvoicePDF };
