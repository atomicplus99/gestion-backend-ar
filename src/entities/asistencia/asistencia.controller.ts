import { Controller, Post, Body, Get, Put, Param, ValidationPipe, NotFoundException, HttpException, HttpStatus, Patch, BadRequestException } from '@nestjs/common';
import { RegistrarAsistenciaDesdeQRUseCase } from './cases/registrar-asistencia.usecase';
import { GetAsistenciasUseCase } from './cases/GetAsistencia.usecase';
import { UpdateAsistenciaUseCase } from './cases/UpdateAsistencia.usecase';
import { CrearAsistenciaManualUseCase } from './cases/CreateAsistenciaManual.usecase';
import { UpdateAsistenciaDto } from './infraestructure/dto/UpdateAsistencia.dto';
import { CreateAsistenciaManualDto } from './infraestructure/dto/CreateAsistencia.dto';
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

@Controller('asistencia')
export class AsistenciaController {
  constructor(
    private readonly registrarAsistencia: RegistrarAsistenciaDesdeQRUseCase,
    private readonly listAsistencia: GetAsistenciasUseCase,
    private readonly auxiliarRepository: AuxiliarRepository,
    private readonly crearAsistenciaManual: CrearAsistenciaManualUseCase,
    private readonly alumnoRepository: AlumnoTypeOrmRepository,
    private readonly actualizacionesAsistenciaRepository: ActualizacionesAsistenciaRepository,
    private readonly asistenciaRepository: AsistenciaTypeOrmRepository,
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
  async crearAsistenciaManualEndpoint(@Body() body: CreateAsistenciaManualDto) {
    const asistencia = await this.crearAsistenciaManual.execute(body);

    return {
      message: 'Asistencia manual registrada correctamente ✅',
      asistencia,
    };
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

}