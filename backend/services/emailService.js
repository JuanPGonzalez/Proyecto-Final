require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const { generateInvoicePDF } = require('./invoiceService');

// Modern Email Strategy using Resend (https://resend.com)
const sendEmail = async (mailOptions) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('[EmailService] Resend API key missing. Cannot send emails.');
    return false;
  }

  try {
    // Process attachments for Resend if they exist
    let attachments = [];
    if (mailOptions.attachments && mailOptions.attachments.length > 0) {
      attachments = mailOptions.attachments.map(att => {
        const fileContent = fs.readFileSync(att.path);
        return {
          filename: att.filename,
          content: fileContent.toString('base64') // Resend requires base64 strings
        };
      });
    }

    // Bypass para el Sandbox de Resend:
    // Resend en su plan gratuito solo permite enviar correos a la cuenta con la que te registraste.
    const recipientEmail = 'hardawarehaven.rosario@gmail.com'; 

    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Hardware Haven <onboarding@resend.dev>', // Verificated domain
        to: [recipientEmail],
        subject: `[Dev Mode -> ${mailOptions.to}] ` + mailOptions.subject,
        html: mailOptions.html,
        attachments: attachments.length > 0 ? attachments : undefined
      },
      {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('[EmailService] SUCCESS. Sent via Resend API. ID:', response.data.id);
    return true;
  } catch (error) {
    console.error('[EmailService] Resend FAILED:', error.response?.data || error.message);
    return false;
  }
};

// ==========================================
// BUSINESS LOGIC
// ==========================================

/**
 * Enviar comprobante de compra por email con PDF adjunto
 */
async function sendOrderConfirmation(userEmail, order, items) {
  try {
    const pdfPath = await generateInvoicePDF(order, items);

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name || 'Producto'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.priceAtPurchase).toLocaleString('es-AR')}</td>
      </tr>
    `).join('');

    const path = require('path');
    const logoPath = path.join(__dirname, '../public/logo.png');
    let logoHtml = '';
    if (fs.existsSync(logoPath)) {
      const b64 = fs.readFileSync(logoPath).toString('base64');
      logoHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="data:image/png;base64,${b64}" alt="Hardware Haven Logo" style="max-width: 120px;" /></div>`;
    }

    const mailOptions = {
      to: userEmail,
      subject: `Comprobante de Compra #${order.id} - Hardware Haven`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
          ${logoHtml}
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
                <td style="padding: 10px; text-align: right; font-weight: bold;">$${Number(order.shipping_cost).toLocaleString('es-AR')}</td>
              </tr>
              <tr style="font-size: 1.2rem; background-color: #f8fafc;">
                <td style="padding: 10px; font-weight: bold;">TOTAL</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #3b82f6;">$${Number(order.total).toLocaleString('es-AR')}</td>
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

    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('[EmailService] Error in sendOrderConfirmation logic:', error);
    return false;
  }
}

/**
 * Enviar email de recuperación de contraseña
 */
async function sendPasswordResetEmail(userEmail, resetLink) {
  try {
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <div style="background-color: #2563eb; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Hardware Haven</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #333333; margin-top: 0;">Recuperación de Contraseña</h2>
          <p style="color: #555555; line-height: 1.6;">
            Hola,
          </p>
          <p style="color: #555555; line-height: 1.6;">
            Recibimos una solicitud para restablecer tu contraseña en Hardware Haven. Haz clic en el botón de abajo para continuar. Este enlace expirará en 15 minutos.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #555555; line-height: 1.6; font-size: 14px;">
            Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:
            <br />
            <a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
          <p style="color: #888888; font-size: 12px; margin: 0;">
            Si no solicitaste este cambio, puedes ignorar este correo con seguridad. Tu contraseña no cambiará hasta que accedas al enlace y crees una nueva.
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="color: #888888; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Hardware Haven. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      to: userEmail,
      subject: 'Restablecer contraseña - Hardware Haven',
      html: htmlTemplate,
    };

    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('[EmailService] Error in sendPasswordResetEmail logic:', error);
    return false;
  }
}

module.exports = { sendOrderConfirmation, sendPasswordResetEmail };
