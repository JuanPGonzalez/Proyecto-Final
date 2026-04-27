const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'hardawarehaven.rosario@gmail.com',
    pass: process.env.EMAIL_PASS || 'your_app_password'
  }
});

const { generateInvoicePDF } = require('./invoiceService');

/**
 * Enviar comprobante de compra por email con PDF adjunto
 */
async function sendOrderConfirmation(userEmail, order, items) {
  try {
    const pdfPath = await generateInvoicePDF(order, items);

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name || 'Producto'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.priceAtPurchase).toLocaleString()}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: '"Hardware Haven" <hardawarehaven.rosario@gmail.com>',
      to: userEmail,
      subject: `Comprobante de Compra #${order.id} - Hardware Haven`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #3b82f6;">¡Gracias por tu compra!</h2>
          <p>Hola, hemos recibido tu pedido correctamente. Adjunto encontrarás tu factura en formato PDF.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px; text-align: left;">Producto</th>
                <th style="padding: 10px; text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 10px; font-weight: bold;">Costo de Envío</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">$${Number(order.shipping_cost).toLocaleString()}</td>
              </tr>
              <tr style="font-size: 1.2rem; background-color: #f8fafc;">
                <td style="padding: 10px; font-weight: bold;">TOTAL</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #3b82f6;">$${Number(order.total).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9rem; color: #666;">
            <p><strong>Dirección de Envío:</strong> ${order.shipping_address || 'Retiro en Tienda'}</p>
            <p><strong>Método:</strong> ${order.shipping_method || 'Estándar'}</p>
            <p>Hardware Haven - Zeballos 1315, Rosario.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `factura_${order.id}.pdf`,
          path: pdfPath
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Email sent with attachment: ' + info.messageId);
    return true;
  } catch (error) {
    console.error('[EmailService] Error sending email:', error);
    return false;
  }
}

module.exports = { sendOrderConfirmation };
