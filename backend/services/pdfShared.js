const PDFDocument = require('pdfkit');

/**
 * Aplica el branding y encabezado común de Hardware Haven a un documento PDF.
 */
function applyHardwareHavenBranding(doc, title = '') {
  // --- BRANDING & HEADER ---
  doc.rect(0, 0, 595, 100).fill('#0f172a'); // Header background (Slate 900)
  
  doc.fillColor('#38bdf8').fontSize(28).font('Helvetica-Bold')
     .text('HARDWARE', 40, 30, { continued: true })
     .fillColor('#ffffff').text(' HAVEN.');
  
  doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
     .text('Zeballos 1315, Rosario, Santa Fe', 40, 65)
     .text('CUIT: 30-12345678-9 | IVA Responsable Inscripto', 40, 80);

  if (title) {
    doc.fillColor('#000000').fontSize(18).font('Helvetica-Bold')
       .text(title.toUpperCase(), 40, 130);
    doc.moveDown(1.5);
  }
}

/**
 * Aplica el pie de página común.
 */
function applyCommonFooter(doc) {
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
  doc.text('Generado automáticamente por el Sistema de Gestión Hardware Haven.', 40, 740, { align: 'center' });
  doc.text(`Fecha de emisión: ${new Date().toLocaleString('es-AR')}`, 40, 755, { align: 'center' });
}

module.exports = { applyHardwareHavenBranding, applyCommonFooter };
