import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AusenciasMasivasService } from './services/ausencias-masivas.service';
import { EjecutarAusenciasMasivasDto, TurnosAusenciasMasivas } from './dto/ejecutar-ausencias-masivas.dto';

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
    console.log('🔍 [DEBUG] ==========================================');
    console.log('🔍 [DEBUG] PETICIÓN RECIBIDA EN ejecutarProgramaAusencias');
    console.log('🔍 [DEBUG] ==========================================');
    console.log('🔍 [DEBUG] DTO completo recibido:', JSON.stringify(ejecutarDto, null, 2));
    console.log('🔍 [DEBUG] turnos recibido:', ejecutarDto.turnos);
    console.log('🔍 [DEBUG] tipo de turnos:', typeof ejecutarDto.turnos);
    console.log('🔍 [DEBUG] ==========================================');

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
   * Valida y procesa el parámetro de turnos del DTO (enum)
   */
  private validarTurnos(turnos?: TurnosAusenciasMasivas): string[] {
    console.log('🔍 [VALIDAR_TURNOS] ==========================================');
    console.log('🔍 [VALIDAR_TURNOS] ENTRANDO A validarTurnos (DTO)');
    console.log('🔍 [VALIDAR_TURNOS] ==========================================');
    console.log('🔍 [VALIDAR_TURNOS] turnos recibido en validarTurnos:', turnos);
    console.log('🔍 [VALIDAR_TURNOS] tipo de turnos en validarTurnos:', typeof turnos);
    console.log('🔍 [VALIDAR_TURNOS] turnos === TurnosAusenciasMasivas.MAÑANA:', turnos === TurnosAusenciasMasivas.MAÑANA);
    console.log('🔍 [VALIDAR_TURNOS] turnos === TurnosAusenciasMasivas.TARDE:', turnos === TurnosAusenciasMasivas.TARDE);
    console.log('🔍 [VALIDAR_TURNOS] turnos === TurnosAusenciasMasivas.AMBOS:', turnos === TurnosAusenciasMasivas.AMBOS);
    console.log('🔍 [VALIDAR_TURNOS] turnos === undefined:', turnos === undefined);
    console.log('🔍 [VALIDAR_TURNOS] turnos === null:', turnos === null);
    console.log('🔍 [VALIDAR_TURNOS] TurnosAusenciasMasivas.MAÑANA:', TurnosAusenciasMasivas.MAÑANA);
    console.log('🔍 [VALIDAR_TURNOS] TurnosAusenciasMasivas.TARDE:', TurnosAusenciasMasivas.TARDE);
    console.log('🔍 [VALIDAR_TURNOS] TurnosAusenciasMasivas.AMBOS:', TurnosAusenciasMasivas.AMBOS);
    console.log('🔍 [VALIDAR_TURNOS] ==========================================');

         if (!turnos || turnos === TurnosAusenciasMasivas.AMBOS) {
       console.log('🔍 [DEBUG] Retornando ambos turnos');
       return ['MAÑANA', 'TARDE'];
     }
     
     if (turnos === TurnosAusenciasMasivas.MAÑANA) {
       console.log('🔍 [DEBUG] Retornando solo mañana');
       return ['MAÑANA'];
     }
     
     if (turnos === TurnosAusenciasMasivas.TARDE) {
       console.log('🔍 [DEBUG] Retornando solo tarde');
       return ['TARDE'];
     }
    
    // Si no es válido, por defecto procesa ambos
    console.log('🔍 [DEBUG] Retornando ambos turnos (caso por defecto)');
    return ['mañana', 'tarde'];
  }

  /**
   * Valida y procesa el parámetro de turnos de query parameters (string)
   */
  private validarTurnosQuery(turnos?: string): string[] {
    console.log('🔍 [DEBUG] ==========================================');
    console.log('🔍 [DEBUG] ENTRANDO A validarTurnosQuery (Query)');
    console.log('🔍 [DEBUG] ==========================================');
    console.log('🔍 [DEBUG] turnos recibido en validarTurnosQuery:', turnos);
    console.log('🔍 [DEBUG] tipo de turnos en validarTurnosQuery:', typeof turnos);
    console.log('🔍 [DEBUG] turnos === "MAÑANA":', turnos === 'MAÑANA');
    console.log('🔍 [DEBUG] turnos === "TARDE":', turnos === 'TARDE');
    console.log('🔍 [DEBUG] turnos === "AMBOS":', turnos === 'AMBOS');
    console.log('🔍 [DEBUG] turnos === undefined:', turnos === undefined);
    console.log('🔍 [DEBUG] turnos === null:', turnos === null);
    console.log('🔍 [DEBUG] ==========================================');

    if (!turnos || turnos === 'AMBOS') {
      console.log('🔍 [DEBUG] Retornando ambos turnos');
      return ['MAÑANA', 'TARDE'];
    }
    
    if (turnos === 'MAÑANA') {
      console.log('🔍 [DEBUG] Retornando solo mañana');
      return ['MAÑANA'];
    }
    
    if (turnos === 'TARDE') {
      console.log('🔍 [DEBUG] Retornando solo tarde');
      return ['TARDE'];
    }
    
    // Si no es válido, por defecto procesa ambos
    console.log('🔍 [DEBUG] Retornando ambos turnos (caso por defecto)');
    return ['MAÑANA', 'TARDE'];
  }

  @Post('programar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Programar ausencias masivas para ejecución futura',
    description: 'Programa el programa de ausencias masivas para ejecutarse automáticamente en una fecha y hora específica'
  })
  @ApiBody({
    type: EjecutarAusenciasMasivasDto,
    description: 'Parámetros para programar el programa de ausencias masivas'
  })
  @ApiResponse({
    status: 200,
    description: 'Ausencias programadas exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Ausencias programadas exitosamente' },
        data: {
          type: 'object',
          properties: {
            idProgramacion: { type: 'string', example: 'uuid-123' },
            fecha: { type: 'string', example: 'Sun Aug 25 2025' },
            hora: { type: 'string', example: '14:30:00' },
            turnos: { type: 'array', items: { type: 'string' }, example: ['MAÑANA', 'TARDE'] },
            mensaje: { type: 'string', example: 'Ausencia programada para ejecutarse automáticamente el Sun Aug 25 2025 a las 14:30:00' }
          }
        },
        timestamp: { type: 'string', example: '2025-08-25T03:47:58.146Z' }
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
  async programarAusencias(
    @Body() programarDto: EjecutarAusenciasMasivasDto
  ) {
    console.log('🔍 [CONTROLLER] ==========================================');
    console.log('🔍 [CONTROLLER] PETICIÓN RECIBIDA EN programarAusencias');
    console.log('🔍 [CONTROLLER] ==========================================');
    console.log('🔍 [CONTROLLER] DTO completo recibido:', JSON.stringify(programarDto, null, 2));
    console.log('🔍 [CONTROLLER] turnos recibido:', programarDto.turnos);
    console.log('🔍 [CONTROLLER] tipo de turnos:', typeof programarDto.turnos);
    console.log('🔍 [CONTROLLER] fecha recibida:', programarDto.fecha);
    console.log('🔍 [CONTROLLER] hora recibida:', programarDto.hora);
    console.log('🔍 [CONTROLLER] ¿Es instancia de EjecutarAusenciasMasivasDto?:', programarDto instanceof EjecutarAusenciasMasivasDto);
    console.log('🔍 [CONTROLLER] ¿Tiene método afterLoad?:', typeof programarDto.afterLoad === 'function');
    console.log('🔍 [CONTROLLER] ==========================================');

    if (!programarDto.fecha || !programarDto.hora) {
      throw new BadRequestException('La fecha y hora son obligatorias para programar ausencias');
    }

    // Convertir string YYYY-MM-DD a Date
    const [anio, mes, dia] = programarDto.fecha.split('-').map(Number);
    const fechaProgramada = new Date(anio, mes - 1, dia, 0, 0, 0, 0);

    // Validar y procesar el parámetro de turnos
    const turnosProcesar = this.validarTurnos(programarDto.turnos);
    
    const resultado = await this.ausenciasMasivasService.programarAusencia(
      fechaProgramada, 
      programarDto.hora, 
      turnosProcesar
    );
    
    return {
      success: true,
      message: 'Ausencias programadas exitosamente',
      data: resultado,
      timestamp: new Date().toISOString()
    };
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
    const turnosProcesar = this.validarTurnosQuery(turnos);
    
    const estadisticas = await this.ausenciasMasivasService.obtenerEstadisticas(fechaProcesada, turnosProcesar);
    
    return {
      success: true,
      message: `Estadísticas obtenidas exitosamente para turno(s): ${turnosProcesar.join(', ')}`,
      data: estadisticas,
      timestamp: new Date().toISOString()
    };
  }

  @Get('programadas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener ausencias programadas para ejecución futura',
    description: 'Obtiene la lista de todas las ausencias masivas programadas para ejecutarse en fechas futuras'
  })
  @ApiResponse({
    status: 200,
    description: 'Ausencias programadas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Ausencias programadas obtenidas exitosamente' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-123' },
              fecha: { type: 'string', example: '2025-08-25' },
              hora: { type: 'string', example: '14:30:00' },
              turnos: { type: 'string', example: 'MAÑANA, TARDE' },
              estado: { type: 'string', example: 'PROGRAMADA' },
              fechaProgramacion: { type: 'string', example: '2025-08-22T10:00:00.000Z' }
            }
          }
        },
        timestamp: { type: 'string', example: '2025-08-22T10:00:00.000Z' }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async obtenerAusenciasProgramadas() {
    const programadas = await this.ausenciasMasivasService.obtenerAusenciasProgramadas();
    
    return {
      success: true,
      message: 'Ausencias programadas obtenidas exitosamente',
      data: programadas,
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
