import { Controller, Put, Param, Body, NotFoundException, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';

import { UpdateEstadoAlumnoUseCase } from './cases/UpdateEstadoAlumno.usecases';
import { UpdateEstadoAlumno } from './dto/UpdateEstadoAlumno.dto';
import { AlumnoEstadoResponseDto } from './dto/AlumnoEstadoResponse.dto';
import { GetAlumnosEstadoUseCase } from './cases/GetAlumnosEstado.usecases';

@ApiTags('Estado de Alumnos')
@Controller('alumnos/estado')
export class EstadoAlumnoController {
  private readonly logger = new Logger(EstadoAlumnoController.name);

  constructor(
    private readonly changeStatusCase: UpdateEstadoAlumnoUseCase,
    private readonly getAlumnosEstadoCase: GetAlumnosEstadoUseCase
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener lista completa de alumnos con su estado actual',
    description: 'Retorna todos los alumnos registrados con información detallada incluyendo su estado actual, turno y usuario asociado. Este endpoint es utilizado por el componente "Lista de Alumnos" del frontend.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de alumnos con estado obtenida exitosamente',
    type: [AlumnoEstadoResponseDto]
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor'
  })
  async listarTodos(): Promise<AlumnoEstadoResponseDto[]> {
    this.logger.log(`🔍 [Controller] Obteniendo lista completa de alumnos con estado`);
    try {
      const resultado = await this.getAlumnosEstadoCase.execute();
      this.logger.log(`✅ [Controller] Lista obtenida exitosamente: ${resultado.length} alumnos`);
      return resultado;
    } catch (error) {
      this.logger.error(`❌ [Controller] Error al obtener lista de alumnos: ${error.message}`);
      throw error;
    }
  }

  @Put(':codigo')
  @ApiOperation({ 
    summary: 'Actualizar estado de un alumno',
    description: 'Actualiza el estado de un alumno específico por su código de estudiante'
  })
  @ApiParam({ 
    name: 'codigo', 
    type: 'string', 
    description: 'Código de 14 dígitos del estudiante',
    example: '12076598200730'
  })
  @ApiBody({ 
    type: UpdateEstadoAlumno, 
    description: 'Datos del estado a actualizar' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado actualizado correctamente'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alumno no encontrado'
  })
  async cambiarEstado(
    @Param('codigo') codigo: string,
    @Body() data: UpdateEstadoAlumno
  ) {
    this.logger.log(`🔄 [Controller] Actualizando estado del alumno con código: ${codigo}`);
    try {
      const result = await this.changeStatusCase.execute(codigo, data);

      if (!result) {
        throw new NotFoundException('Alumno no encontrado');
      }

      this.logger.log(`✅ [Controller] Estado actualizado exitosamente para alumno: ${codigo}`);
      return {
        success: true,
        message: 'Estado actualizado correctamente',
        estado: result.estado,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ [Controller] Error al actualizar estado: ${error.message}`);
      throw error;
    }
  }
}
