import { Controller, Get, Post, Body } from '@nestjs/common';
import { TelegramNotificationService } from './services/telegram-notification.service';
import { TelegramAccountService } from './services/telegram-account.service';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramNotificationService,
    private readonly telegramAccountService: TelegramAccountService,
  ) {}

  @Get('test')
  async testBot() {
    const result = await this.telegramService.testBot();
    return {
      ...result,
      timestamp: new Date().toISOString(),
      endpoint: '/telegram/test'
    };
  }

  @Post('send-test-message')
  async sendTestMessage(@Body() body: { chatId: number; message: string }) {
    
    try {
      // Aquí podrías enviar un mensaje de prueba
      return {
        success: true,
        message: 'Mensaje de prueba enviado',
        chatId: body.chatId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('status')
  async getBotStatus() {
    return {
      status: 'Bot de Telegram activo',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /telegram/test - Probar conexión',
        'POST /telegram/send-test-message - Enviar mensaje de prueba',
        'GET /telegram/status - Estado del bot',
        'GET /telegram/test-file - Probar escritura de archivo'
      ]
    };
  }

  @Get('test-file')
  async testFileWriting() {
    try {
      await this.telegramAccountService.probarEscrituraArchivo();
      return {
        success: true,
        message: 'Prueba de escritura de archivo exitosa',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('test-credentials')
  async testCredentials(@Body() body: { username: string; password: string }) {
    try {
      const result = await this.telegramAccountService.verificarCredenciales(body.username, body.password);
      return {
        ...result,
        timestamp: new Date().toISOString(),
        endpoint: '/telegram/test-credentials'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
