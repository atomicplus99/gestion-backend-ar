import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TelegramUser } from './telegram-user.entity';
import { TelegramChat } from './telegram-chat.entity';
import { TelegramNotificationService } from './services/telegram-notification.service';
import { TelegramApoderadoService } from './services/telegram-apoderado.service';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { Apoderado } from '../apoderado/infraestructure/orm/entities/apoderado.entity';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelegramUser, TelegramChat, Alumno, Apoderado]),
    ConfigModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramNotificationService, TelegramApoderadoService],
  exports: [TelegramNotificationService, TelegramApoderadoService],
})
export class TelegramModule {}
