import { Controller, Post, Body, Get, Put, Param, ValidationPipe, NotFoundException, HttpException, HttpStatus, Patch, BadRequestException, Query, HttpCode, Logger, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegistrarAsistenciaDesdeQRUseCase } from './cases/registrar-asistencia.usecase';
import { GetAsistenciasUseCase } from './cases/GetAsistencia.usecase';
import { UpdateAsistenciaUseCase } from './cases/UpdateAsistencia.usecase';
import { CrearAsistenciaManualUseCase } from './cases/CreateAsistenciaManual.usecase';
import { VerificarAsistenciaUseCase } from './cases/verificar-asistencia.usecase';
import { CrearAusenciaAlumnoUseCase } from './cases/crear-ausencia-alumno.usecase';
import { ActualizarAsistenciaPorCodigoUseCase } from './cases/actualizar-asistencia-por-codigo.usecase';
import { AnularAsistenciaUseCase } from './cases/anular-asistencia.usecase';
import { UpdateAsistenciaDto } from './infraestructure/dto/UpdateAsistencia.dto';
import { CreateAsistenciaManualDto } from './infraestructure/dto/CreateAsistencia.dto';
import { CrearAusenciaAlumnoDto } from './infraestructure/dto/CrearAusenciaAlumno.dto';
import { VerificarAsistenciaResponse } from './infraestructure/dto/VerificarAsistenciaResponse.dto';
import { RegistroAsistenciaResponseManual } from './infraestructure/dto/RegistroAsistenciaResponse.dto';
import { ResponseAusenciaAlumno } from './infraestructure/dto/ResponseAusenciaAlumno.dto';
import { UpdateAsistenciaRequestDto } from './infraestructure/dto/UpdateAsistenciaRequest.dto';
import { UpdateAsistenciaResponseDto } from './infraestructure/dto/UpdateAsistenciaResponse.dto';
import { AnularAsistenciaRequestDto } from './infraestructure/dto/AnularAsistenciaRequest.dto';
import { AnularAsistenciaResponseDto } from './infraestructure/dto/AnularAsistenciaResponse.dto';
import { IsDateString, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { Asistencia } from './asistencia.entity';
import { AlumnoTypeOrmRepository } from '../alumno/infraestructure/adapters/outbounds/repository/alumno.repository';
import { AsistenciaTypeOrmRepository } from './domain/repository/asistencia.repository';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { EstadoAsistencia } from './enums/estado-asistencia.enum';
import { ActualizacionesAsistencia } from '../actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { AuxiliarRepository } from '../auxiliar/domain/repository/auxiliar.repository';
import { ActualizacionesAsistenciaRepository } from '../actualizaciones-asistencia/domain/repository/actualizaciones-asistencia.repository';


class GetAsistenciaPorCodigoParams {
  @IsNotEmpty()
  @IsString()
  @Length(1, 20) // Asegúrate de que la longitud coincida con tu entidad Alumno
  codigo: string;
}

interface AsistenciaConAlumno {
  alumno: Alumno;
  asistencias: Asistencia[];
}

export class UpdateAsistenciaAlumnoDto {
  @IsOptional()
  @IsString()
  hora_de_llegada?: string;
  
  @IsOptional()
  @IsString()
  hora_salida?: string;
  
  @IsOptional()
  @IsEnum(EstadoAsistencia)
  estado_asistencia?: EstadoAsistencia;
  
  @IsOptional()
  @IsDateString()
  fecha?: Date;

  @IsNotEmpty()
  @IsString()
  idUser: string;

  @IsNotEmpty()
  @IsString()
  motivo: string;
}

@ApiTags('Asistencia')
@Controller('asistencia')
export class AsistenciaController {
  private readonly logger = new Logger(AsistenciaController.name);
  constructor(
    private readonly registrarAsistencia: RegistrarAsistenciaDesdeQRUseCase,
    private readonly listAsistencia: GetAsistenciasUseCase,
    private readonly auxiliarRepository: AuxiliarRepository,
    private readonly crearAsistenciaManual: CrearAsistenciaManualUseCase,
    private readonly crearAusenciaAlumno: CrearAusenciaAlumnoUseCase,
    private readonly alumnoRepository: AlumnoTypeOrmRepository,
    private readonly actualizacionesAsistenciaRepository: ActualizacionesAsistenciaRepository,
    private readonly asistenciaRepository: AsistenciaTypeOrmRepository,
    private readonly verificarAsistenciaUseCase: VerificarAsistenciaUseCase,
    private readonly actualizarAsistenciaPorCodigo: ActualizarAsistenciaPorCodigoUseCase,
    private readonly anularAsistencia: AnularAsistenciaUseCase,
  ) { }

  @Get('list')
  list() {
    return this.listAsistencia.execute();
  }

  @Get('list/alumno/:codigo')
  async getAsistenciaPorCodigoAlumno(
    @Param(new ValidationPipe()) params: GetAsistenciaPorCodigoParams
  ): Promise<AsistenciaConAlumno> {
    const { codigo } = params;
    const alumno = await this.alumnoRepository.findOne(codigo);
    if (!alumno) {
      throw new NotFoundException(`No se encontró ningún alumno con el código: ${codigo}`);
    }

    const asistencias = await this.asistenciaRepository.findAlumnoById(alumno);
    if (!asistencias || asistencias.length === 0) {
      throw new HttpException(
        `El alumno con código ${codigo} no tiene registros de asistencia.`,
        HttpStatus.NOT_FOUND, // Puedes usar HttpStatus.OK con un array vacío si prefieres
      );
    }

    const data: AsistenciaConAlumno = { alumno: alumno, asistencias: asistencias };
    return data;
  }

  @Post('scan')
  async escanearQr(@Body('codigo_qr') codigo_qr: string) {
    const asistencia = await this.registrarAsistencia.execute(codigo_qr);
    const mensaje = asistencia.hora_salida
      ? 'Salida registrada correctamente ✅'
      : 'Entrada registrada correctamente ✅';

    return {
      mensaje,
      asistencia,
    };
  }

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear asistencia manual',
    description: 'Crea un registro de asistencia manual para un alumno con información detallada'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Asistencia creada exitosamente',
    type: RegistroAsistenciaResponseManual
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error en los datos proporcionados'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alumno o auxiliar no encontrado'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor'
  })
  async crearAsistenciaManualEndpoint(@Body() body: CreateAsistenciaManualDto, @Req() req: Request): Promise<RegistroAsistenciaResponseManual> {
    this.logger.log(`🚀🚀🚀 INICIANDO ENDPOINT /manual 🚀🚀🚀`);
    this.logger.log(`📝 Body recibido: ${JSON.stringify(body)}`);
    
    // Logs para depurar qué envía el frontend
    this.logger.log(
      `🟧 Campos -> id_alumno=${(body as any)?.id_alumno} | id_auxiliar=${(body as any)?.id_auxiliar} | id_usuario=${(body as any)?.id_usuario} | estado_asistencia=${(body as any)?.estado_asistencia} | hora_de_llegada=${(body as any)?.hora_de_llegada} | hora_salida=${(body as any)?.hora_salida} | fecha=${(body as any)?.fecha} | motivo_len=${(body as any)?.motivo ? String((body as any).motivo).length : 0}`
    );

    // Logs de request: método, ruta, IP y headers
    try {
      const forwarded = (req.headers['x-forwarded-for'] as string) || '';
      const ip = forwarded.split(',')[0] || req.ip;
      this.logger.log(`🟦 Headers: ${JSON.stringify({
        authorization: req.headers['authorization'] || null,
        'content-type': req.headers['content-type'] || null,
        'user-agent': req.headers['user-agent'] || null,
        origin: req.headers['origin'] || null,
        referer: req.headers['referer'] || null,
        host: req.headers['host'] || null,
        'x-forwarded-for': req.headers['x-forwarded-for'] || null,
      })}`);
    } catch (e) {
    }

    this.logger.log(`🔄 LLAMANDO A crearAsistenciaManual.execute()...`);
    const asistencia = await this.crearAsistenciaManual.execute(body);
    this.logger.log(`✅ crearAsistenciaManual.execute() COMPLETADO`);

    // Construir respuesta estructurada
    const response: RegistroAsistenciaResponseManual = {
      message: 'Asistencia manual registrada correctamente ✅',
      asistencia: {
        id_asistencia: asistencia.id_asistencia,
        hora_de_llegada: asistencia.hora_de_llegada,
        hora_salida: asistencia.hora_salida || undefined,
        estado_asistencia: asistencia.estado_asistencia,
        fecha: asistencia.fecha,
        alumno: {
          nombre: asistencia.alumno.nombre,
          apellido: asistencia.alumno.apellido,
          codigo: asistencia.alumno.codigo,
        },
      },
    };

    return response;
  }

  @Post('crear-ausencia-alumno')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear ausencia de alumno',
    description: 'Registra la ausencia de un alumno para una fecha específica o la fecha actual'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Ausencia registrada exitosamente',
    type: ResponseAusenciaAlumno
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error en los datos proporcionados'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alumno no encontrado'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Ya existe un registro de asistencia para esa fecha'
  })
  async crearAusenciaAlumnoEndpoint(@Body() body: CrearAusenciaAlumnoDto): Promise<ResponseAusenciaAlumno> {
    return await this.crearAusenciaAlumno.execute(body);
  }

  @Patch('update/:id_asistencia')
async updateAsistencia(
  @Param('id_asistencia') id_asistencia: string,
  @Body() updateAsistenciaDto: UpdateAsistenciaAlumnoDto
): Promise<{ message: string; data: Asistencia }> {
  // Validar que idUser y motivo no estén vacíos
  if (!updateAsistenciaDto.idUser || !updateAsistenciaDto.motivo) {
    throw new BadRequestException('El ID del usuario y el motivo de la actualización son obligatorios');
  }

  // Buscar la asistencia existente
  const asistencia = await this.asistenciaRepository.findOne(id_asistencia);
  if (!asistencia) {
    throw new NotFoundException(`No se encontró ninguna asistencia con el ID: ${id_asistencia}`);
  }

  // Buscar el auxiliar por el idUser
  const auxiliar = await this.auxiliarRepository.findByUsuarioId(updateAsistenciaDto.idUser);
  if (!auxiliar) {
    throw new NotFoundException(`No se encontró ningún auxiliar con el ID de usuario: ${updateAsistenciaDto.idUser}`);
  }

  // Validar la actualización de hora_salida
  if (updateAsistenciaDto.hora_salida && asistencia.hora_salida === null) {
    throw new BadRequestException(
      'No se puede actualizar la hora de salida cuando no hay un registro previo. Utilice el endpoint de registro de salida.'
    );
  }

  // Crear objeto con los datos a actualizar
  const dataToUpdate: Partial<Asistencia> = {
    hora_de_llegada: updateAsistenciaDto.hora_de_llegada || asistencia.hora_de_llegada,
    estado_asistencia: updateAsistenciaDto.estado_asistencia as EstadoAsistencia || asistencia.estado_asistencia,
    fecha: updateAsistenciaDto.fecha || asistencia.fecha,
  };

  // Solo actualizar hora_salida si ya existe un valor previo
  if (asistencia.hora_salida !== null && updateAsistenciaDto.hora_salida) {
    dataToUpdate.hora_salida = updateAsistenciaDto.hora_salida;
  }

  // Actualizar la asistencia
  const updatedAsistencia = await this.asistenciaRepository.update(id_asistencia, dataToUpdate);

  // Crear registro en la tabla actualizaciones_asistencia
  const actualizacion = new ActualizacionesAsistencia();
  actualizacion.asistencia = updatedAsistencia;
  actualizacion.alumno = asistencia.alumno;
  actualizacion.auxiliar = auxiliar;
  actualizacion.motivo = updateAsistenciaDto.motivo;
  // La fecha se asigna automáticamente por ser un CreateDateColumn

  // Guardar la actualización
  await this.actualizacionesAsistenciaRepository.save(actualizacion);

  return {
    message: `La asistencia con ID ${id_asistencia} ha sido actualizada exitosamente`,
    data: updatedAsistencia
  };
}

  @Get('verificar/:codigo')
  @ApiOperation({ 
    summary: 'Verificar asistencia de un alumno',
    description: 'Verifica si un alumno tiene asistencia registrada para una fecha específica o la fecha actual si no se proporciona. Devuelve información del alumno si no tiene asistencia, o detalles de la asistencia existente si ya está registrada.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Verificación completada exitosamente',
    type: VerificarAsistenciaResponse
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error en los parámetros (fecha inválida si se proporciona)'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor'
  })
  async verificarAsistencia(
    @Param('codigo') codigo: string,
    @Query('fecha') fecha?: string,
  ): Promise<VerificarAsistenciaResponse> {
    try {

      // Si no se proporciona fecha, usar fecha actual en zona horaria de Perú (UTC-5)
      let fechaDate: Date;
      if (!fecha) {
        // Crear fecha actual en zona horaria de Perú
        const ahora = new Date();
        const offsetPeru = -5 * 60; // UTC-5 en minutos
        const fechaPeru = new Date(ahora.getTime() + (offsetPeru * 60 * 1000));
        
        // Construir fecha a las 00:00:00 en hora local de Perú
        fechaDate = new Date(fechaPeru.getFullYear(), fechaPeru.getMonth(), fechaPeru.getDate(), 0, 0, 0, 0);
        
      } else {
        fechaDate = new Date(fecha);
        
        if (isNaN(fechaDate.getTime())) {
          throw new BadRequestException('El formato de fecha no es válido. Use YYYY-MM-DD');
        }
      }

      const resultado = await this.verificarAsistenciaUseCase.execute(codigo, fechaDate);

      
      return resultado;

    } catch (error) {
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Error al verificar la asistencia',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('actualizar/:codigo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Actualizar asistencia por código de alumno',
    description: 'Actualiza los datos de asistencia de un alumno específico por su código. Permite modificar hora de llegada, hora de salida, estado de asistencia y registra el motivo del cambio.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Asistencia actualizada exitosamente',
    type: UpdateAsistenciaResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error en los datos proporcionados o validación fallida'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alumno, asistencia o auxiliar no encontrado'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor'
  })
  async actualizarAsistenciaPorCodigoEndpoint(
    @Param('codigo') codigo: string,
    @Body() updateDto: UpdateAsistenciaRequestDto
  ): Promise<UpdateAsistenciaResponseDto> {
    return await this.actualizarAsistenciaPorCodigo.execute(codigo, updateDto);
  }

  @Patch('anular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Anular asistencia de un alumno',
    description: 'Anula la asistencia de un alumno del día actual, cambiando su estado a ANULADO. Solo se pueden anular asistencias PUNTUAL o TARDANZA. Las ausencias no se pueden anular.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Asistencia anulada exitosamente',
    type: AnularAsistenciaResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error en los datos proporcionados o asistencia no se puede anular'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Alumno, asistencia o auxiliar no encontrado'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'La asistencia ya está anulada'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor'
  })
  async anularAsistenciaEndpoint(
    @Body() anularDto: AnularAsistenciaRequestDto
  ): Promise<AnularAsistenciaResponseDto> {
    this.logger.log(`🚀🚀🚀 ANULAR ASISTENCIA ENDPOINT LLAMADO 🚀🚀🚀`);
    this.logger.log(`📝 Body recibido: ${JSON.stringify(anularDto, null, 2)}`);
    
    try {
      const resultado = await this.anularAsistencia.execute(anularDto);
      this.logger.log(`✅ Anulación exitosa: ${JSON.stringify(resultado, null, 2)}`);
      return resultado;
    } catch (error) {
      this.logger.error(`❌ Error en anulación: ${error.message}`);
      this.logger.error(`❌ Stack trace: ${error.stack}`);
      throw error;
    }
  }

}