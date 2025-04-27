import { Module } from '@nestjs/common';
import { ActualizacionesAsistenciaController } from './actualizaciones-asistencia.controller';

@Module({
  controllers: [ActualizacionesAsistenciaController]
})
export class ActualizacionesAsistenciaModule {}
