import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private resend: Resend;

  constructor() {
    this.initializeResend();
  }

  private initializeResend() {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return;
      }
      this.resend = new Resend(apiKey);
    } catch (error) {
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<boolean> {
    try {
      
      if (!this.resend) {
        return false;
      }

      const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

      const { data, error } = await this.resend.emails.send({
        from: 'Sistema Escolar <onboarding@resend.dev>',
        to: [email],
        subject: '🔐 Restablecimiento de Contraseña - Sistema de control de asistencia I.E.P Andres de los Reyes',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🔐 Restablecimiento de Contraseña</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Sistema de control de asistencia I.E.P Andres de los Reyes</p>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <h2 style="color: #333; margin-top: 0;">Hola ${username},</h2>

              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Sistema de control de asistencia I.E.P Andres de los Reyes.
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
                Este email fue enviado automáticamente por el Sistema de control de asistencia I.E.P Andres de los Reyes.<br>
                No respondas a este email.
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
