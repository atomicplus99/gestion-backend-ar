import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AusenciasMasivasService } from './services/ausencias-masivas.service';
import { EjecutarAusenciasMasivasDto } from './dto/ejecutar-ausencias-masivas.dto';

@ApiTags('Programa de Ausencias Masivas')
@Controller('asistencia/ausencias-masivas')
export class AusenciasMasivasController {
  constructor(
    private readonly ausenciasMasivasService: AusenciasMasivasService,
  ) {}

  @Post('ejecutar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejecutar programa de ausencias masivas por fecha, hora y turno',
    description: 'Ejecuta el programa automático de ausencias para alumnos de turnos específicos en una fecha y hora determinada'
  })
  @ApiBody({
    type: EjecutarAusenciasMasivasDto,
    description: 'Parámetros para la ejecución del programa de ausencias masivas'
  })
  @ApiResponse({
    status: 200,
    description: 'Programa de ausencias ejecutado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Programa de ausencias ejecutado exitosamente' },
        data: {
          type: 'object',
          properties: {
            totalAlumnos: { type: 'number', example: 150 },
            ausenciasCreadas: { type: 'number', example: 45 },
            alumnosConAsistencia: { type: 'number', example: 105 },
            fechaProcesada: { type: 'string', example: 'Fri Aug 22 2025' },
            horaEjecucion: { type: 'string', example: '14:30:00' },
            horaProgramada: { type: 'string', example: '14:30:00' },
            turnosProcesados: { type: 'array', items: { type: 'string' }, example: ['TARDE'] }
          }
        },
        timestamp: { type: 'string', example: '2025-08-22T14:30:00.000Z' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros inválidos'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async ejecutarProgramaAusencias(
    @Body() ejecutarDto: EjecutarAusenciasMasivasDto
  ) {
    let fechaProcesada: Date | undefined;
    
    if (ejecutarDto.fecha) {
      // Convertir string YYYY-MM-DD a Date
      const [anio, mes, dia] = ejecutarDto.fecha.split('-').map(Number);
      fechaProcesada = new Date(anio, mes - 1, dia, 0, 0, 0, 0);
    }

    // Validar y procesar el parámetro de turnos
    const turnosProcesar = this.validarTurnos(ejecutarDto.turnos);
    
    const resultado = await this.ausenciasMasivasService.ejecutarProgramaAusencias(
      fechaProcesada, 
      ejecutarDto.hora, 
      turnosProcesar
    );
    
    return {
      success: true,
      message: `Programa de ausencias ejecutado exitosamente para turno(s): ${turnosProcesar.join(', ')}`,
      data: resultado,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Valida y procesa el parámetro de turnos
   */
  private validarTurnos(turnos?: string): string[] {
    if (!turnos || turnos === 'AMBOS') {
      return ['MAÑANA', 'TARDE'];
    }
    
    if (turnos === 'MAÑANA') {
      return ['MAÑANA'];
    }
    
    if (turnos === 'TARDE') {
      return ['TARDE'];
    }
    
    // Si no es válido, por defecto procesa ambos
    return ['MAÑANA', 'TARDE'];
  }

  @Get('estadisticas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas del programa de ausencias por turno',
    description: 'Obtiene estadísticas detalladas sobre el estado de asistencias y ausencias para turnos específicos en una fecha'
  })
  @ApiQuery({
    name: 'fecha',
    description: 'Fecha para obtener estadísticas (YYYY-MM-DD). Si no se especifica, usa la fecha actual',
    required: false,
    type: String,
    example: '2025-08-22'
  })
  @ApiQuery({
    name: 'turnos',
    description: 'Turnos a procesar: MAÑANA, TARDE, AMBOS. Si no se especifica, procesa ambos turnos',
    required: false,
    type: String,
    enum: ['MAÑANA', 'TARDE', 'AMBOS'],
    example: 'TARDE'
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Estadísticas obtenidas exitosamente' },
        data: {
          type: 'object',
          properties: {
            fecha: { type: 'string', example: 'Fri Aug 22 2025' },
            totalAlumnos: { type: 'number', example: 150 },
            ausenciasRegistradas: { type: 'number', example: 45 },
            asistenciasRegistradas: { type: 'number', example: 105 },
            alumnosSinAsistencia: { type: 'number', example: 0 }
          }
        },
        timestamp: { type: 'string', example: '2025-08-22T14:30:00.000Z' }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async obtenerEstadisticas(
    @Query('fecha') fecha?: string,
    @Query('turnos') turnos?: string
  ) {
    let fechaProcesada: Date | undefined;
    
    if (fecha) {
      // Convertir string YYYY-MM-DD a Date
      const [anio, mes, dia] = fecha.split('-').map(Number);
      fechaProcesada = new Date(anio, mes - 1, dia, 0, 0, 0, 0);
    }

    // Validar y procesar el parámetro de turnos
    const turnosProcesar = this.validarTurnos(turnos);
    
    const estadisticas = await this.ausenciasMasivasService.obtenerEstadisticas(fechaProcesada, turnosProcesar);
    
    return {
      success: true,
      message: `Estadísticas obtenidas exitosamente para turno(s): ${turnosProcesar.join(', ')}`,
      data: estadisticas,
      timestamp: new Date().toISOString()
    };
  }

  @Get('historial')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener historial de ejecuciones del programa de ausencias',
    description: 'Obtiene el historial de todas las ejecuciones previas del programa de ausencias masivas'
  })
  @ApiQuery({
    name: 'limite',
    description: 'Número máximo de registros a devolver (por defecto: 50)',
    required: false,
    type: Number,
    example: 50
  })
  @ApiResponse({
    status: 200,
    description: 'Historial obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Historial obtenido exitosamente' },
        data: {
          type: 'array',
          items: {
            type: 'object',
                         properties: {
               fecha: { type: 'string', example: '2025-08-22' },
               totalAlumnos: { type: 'number', example: 150 },
               ausenciasCreadas: { type: 'number', example: 45 },
               horaEjecucion: { type: 'string', example: '14:30:00' },
               fechaEjecucion: { type: 'string', example: '2025-08-22T14:30:00.000Z' },
               estado: { type: 'string', example: 'COMPLETADO' },
               duracion: { type: 'string', example: '45s' },
               turnosProcesados: { type: 'string', example: 'MAÑANA, TARDE' }
             }
          }
        },
        timestamp: { type: 'string', example: '2025-08-22T14:30:00.000Z' }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async obtenerHistorial(
    @Query('limite') limite?: number
  ) {
    const historial = await this.ausenciasMasivasService.obtenerHistorial(limite || 50);
    
    return {
      success: true,
      message: 'Historial obtenido exitosamente',
      data: historial,
      timestamp: new Date().toISOString()
    };
  }
}
