import { Controller, Put, Param, Body, NotFoundException, Get } from '@nestjs/common';

import { UpdateEstadoAlumnoUseCase } from './cases/UpdateEstadoAlumno.usecases';
import { UpdateEstadoAlumno } from './dto/UpdateEstadoAlumno.dto';
import { AlumnoEstadoResponseDto } from './dto/AlumnoEstadoResponse.dto';
import { GetAlumnosEstadoUseCase } from './cases/GetAlumnosEstado.usecases';

@Controller('alumnos/estado')
export class EstadoAlumnoController {
  constructor(private readonly changeStatusCase: UpdateEstadoAlumnoUseCase,
    private readonly getAlumnosEstadoCase: GetAlumnosEstadoUseCase
  ) {
  }

  @Put(':codigo')
  async cambiarEstado(
    @Param('codigo') codigo: string,
    @Body() data: UpdateEstadoAlumno
  ) {
    const result = await this.changeStatusCase.execute(codigo, data);

    if (!result) {
      throw new NotFoundException('Alumno no encontrado');
    }

    return {
      message: 'Estado actualizado correctamente',
      estado: result.estado,
    };
  }

  @Get()
  async listarTodos(): Promise<AlumnoEstadoResponseDto[]> {
    return this.getAlumnosEstadoCase.execute();
  }
}
