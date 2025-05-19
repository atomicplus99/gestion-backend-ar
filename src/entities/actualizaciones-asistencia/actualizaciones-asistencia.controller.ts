import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { CreateActualizacionAsistenciaCase } from './infraestructure/cases/CreateActualizacionAsistencia.usecase';
import { CreateActualizacionAsistenciaDto } from './domain/dto/ActualizacionAsistencia.dto';

@Controller('actualizaciones-asistencia')
// @UseGuards(AuthGuard('jwt'), RolesGuard)
export class ActualizacionAsistenciaController {
  constructor(private readonly createCase: CreateActualizacionAsistenciaCase) {}

  @Post("create")
//   @Roles('ADMIN') 
  async create(@Body() dto: CreateActualizacionAsistenciaDto) {
    const nuevaActualizacion = await this.createCase.execute(dto);
    return {
      message: 'Actualización de asistencia registrada exitosamente',
      data: nuevaActualizacion,
    };
  }
}
