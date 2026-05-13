require('dotenv').config();
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const { generateInvoicePDF } = require('./invoiceService');

// 1. Create a robust Transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: true, // true for port 465, false for port 587
    auth: {
      user: process.env.EMAIL_USER?.trim() || 'hardawarehaven.rosario@gmail.com', // .trim() prevents invisible spaces
      pass: process.env.EMAIL_PASS?.trim() || 'your_app_password' // .trim() prevents invisible spaces
    },
    tls: {
      // Prevents local development certificate errors
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
};

// 2. Modern Fallback Strategy using Resend (https://resend.com)
const sendViaResendFallback = async (mailOptions) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    throw new Error('Resend API key missing. Cannot use fallback.');
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

    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Hardware Haven <onboarding@resend.dev>', // You must verify your domain in production
        to: [mailOptions.to],
        subject: mailOptions.subject,
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
    
    console.log('[EmailService] Fallback SUCCESS. Sent via Resend API. ID:', response.data.id);
    return true;
  } catch (error) {
    console.error('[EmailService] Fallback FAILED:', error.response?.data || error.message);
    throw error;
  }
};

// 3. Wrapper Function (Tries SMTP, then Fallback)
const sendEmailWithFallback = async (mailOptions) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] SUCCESS via SMTP. MessageId:', info.messageId);
    return true;
  } catch (smtpError) {
    console.warn(`[EmailService] SMTP FAILED (${smtpError.code || smtpError.message}). Attempting Resend Fallback...`);
    
    try {
      return await sendViaResendFallback(mailOptions);
    } catch (fallbackError) {
      console.error('[EmailService] FATAL: Both SMTP and Fallback failed.');
      return false; // Return false gracefully so the user still sees an error in the UI
    }
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
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.priceAtPurchase).toLocaleString()}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Hardware Haven" <hardawarehaven.rosario@gmail.com>',
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

    return await sendEmailWithFallback(mailOptions);
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
      from: process.env.EMAIL_FROM || '"Hardware Haven" <hardawarehaven.rosario@gmail.com>',
      to: userEmail,
      subject: 'Restablecer contraseña - Hardware Haven',
      html: htmlTemplate,
    };

    return await sendEmailWithFallback(mailOptions);
  } catch (error) {
    console.error('[EmailService] Error in sendPasswordResetEmail logic:', error);
    return false;
  }
}

module.exports = { sendOrderConfirmation, sendPasswordResetEmail };
