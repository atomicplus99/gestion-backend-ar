import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacion } from './notificacion.entity';
import { NotificacionService } from './services/notificacion.service';
import { NotificacionController } from './controllers/notificacion.controller';
import { NotificacionGateway } from './gateways/notificacion.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notificacion])
  ],
  controllers: [NotificacionController],
  providers: [NotificacionService, NotificacionGateway],
  exports: [NotificacionService, NotificacionGateway]
})
export class NotificacionModule {}
