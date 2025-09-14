import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TelegramUser } from './telegram-user.entity';
import { TelegramChat } from './telegram-chat.entity';
import { TelegramAccount } from './entities/telegram-account.entity';
import { TelegramNotificationService } from './services/telegram-notification.service';
import { TelegramApoderadoService } from './services/telegram-apoderado.service';
import { TelegramAccountService } from './services/telegram-account.service';
import { TelegramAuthService } from './services/telegram-auth.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { Apoderado } from '../apoderado/infraestructure/orm/entities/apoderado.entity';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelegramUser, TelegramChat, TelegramAccount, Alumno, Apoderado]),
    ConfigModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramNotificationService, TelegramApoderadoService, TelegramAccountService, TelegramAuthService, PdfGeneratorService],
  exports: [TelegramNotificationService, TelegramApoderadoService, TelegramAccountService, TelegramAuthService, PdfGeneratorService],
})
export class TelegramModule {}
