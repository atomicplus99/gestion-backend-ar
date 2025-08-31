import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);

  async sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<boolean> {
    try {
      this.logger.log(`📧 Intentando enviar email a: ${email}`);
      
      const apiKey = process.env.BREVO_API_KEY;
      const fromEmail = process.env.BREVO_FROM_EMAIL;
      const fromName = process.env.BREVO_FROM_NAME;
      
      if (!apiKey) {
        this.logger.error('❌ BREVO_API_KEY no configurado');
        return false;
      }
      
      if (!fromEmail) {
        this.logger.error('❌ BREVO_FROM_EMAIL no configurado');
        return false;
      }
      
      if (!fromName) {
        this.logger.error('❌ BREVO_FROM_NAME no configurado');
        return false;
      }

      const frontendUrl = process.env.FRONTEND_URL;
      
      if (!frontendUrl) {
        this.logger.error('❌ FRONTEND_URL no configurado');
        return false;
      }
      
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      const emailData = {
        sender: {
          name: process.env.BREVO_FROM_NAME,
          email: process.env.BREVO_FROM_EMAIL
        },
        to: [
          {
            email: email,
            name: username
          }
        ],
        subject: `🔐 Restablecimiento de Contraseña - ${process.env.BREVO_FROM_NAME}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🔐 Restablecimiento de Contraseña</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${process.env.BREVO_FROM_NAME}</p>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <h2 style="color: #333; margin-top: 0;">Hola ${username},</h2>

              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta del sistema de control de asistencia.
              </p>

              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Si solicitaste este cambio, haz clic en el botón de abajo para restablecer tu contraseña:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 15px 30px;
                          text-decoration: none;
                          border-radius: 25px;
                          font-weight: bold;
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                  🔑 Restablecer Contraseña
                </a>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                O copia y pega este enlace en tu navegador:
              </p>
              <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px; color: #495057;">
                ${resetUrl}
              </p>

              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por seguridad. Si no solicitaste este cambio, ignora este email.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Este email fue enviado automáticamente por ${process.env.BREVO_FROM_NAME}.<br>
                No respondas a este email.
              </p>
            </div>
          </div>
        `
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        const result = await response.json();
        this.logger.log(`✅ Email de restablecimiento enviado a: ${email} usando Brevo (ID: ${result.messageId})`);
        return true;
      } else {
        const error = await response.text();
        this.logger.error(`❌ Error enviando email con Brevo a ${email}: ${error}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`❌ Error enviando email con Brevo a ${email}: ${error.message}`);
      this.logger.error(`❌ Error completo:`, error);
      return false;
    }
  }
}