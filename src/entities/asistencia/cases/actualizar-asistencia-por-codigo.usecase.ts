import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { Administrador } from 'src/entities/administrador/administrador.entity';
import { Director } from 'src/entities/director/director.entity';
import { ActualizacionesAsistencia } from 'src/entities/actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';
import { UpdateAsistenciaRequestDto } from '../infraestructure/dto/UpdateAsistenciaRequest.dto';
import { UpdateAsistenciaResponseDto } from '../infraestructure/dto/UpdateAsistenciaResponse.dto';
import { TelegramNotificationService } from 'src/entities/telegram/services/telegram-notification.service';

@Injectable()
export class ActualizarAsistenciaPorCodigoUseCase {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,

    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,

    @InjectRepository(Auxiliar)
    private readonly auxiliarRepository: Repository<Auxiliar>,
    @InjectRepository(Administrador)
    private readonly adminRepository: Repository<Administrador>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,

    @InjectRepository(ActualizacionesAsistencia)
    private readonly actualizacionesRepository: Repository<ActualizacionesAsistencia>,
    
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  async execute(codigo: string, updateDto: UpdateAsistenciaRequestDto): Promise<UpdateAsistenciaResponseDto> {
    // 1. Buscar al alumno por código
    const alumno = await this.alumnoRepository.findOne({
      where: { codigo: codigo },
      relations: ['turno']
    });

    if (!alumno) {
      throw new NotFoundException(`No se encontró ningún alumno con el código: ${codigo}`);
    }

    // 2. Determinar la fecha objetivo (YYYY-MM-DD) Perú: si viene en el DTO, usarla; si no, hoy Perú
    let fechaFormato: string;
    if (updateDto.fecha) {
      // Validar y normalizar a YYYY-MM-DD
      const d = new Date(updateDto.fecha);
      if (isNaN(d.getTime())) {
        throw new BadRequestException('La fecha no es válida. Use formato YYYY-MM-DD');
      }
      fechaFormato = updateDto.fecha;
    } else {
      // Obtener fecha actual en zona horaria de Perú (UTC-5)
      const ahora = new Date();
      
      // Convertir a hora de Perú usando toLocaleString
      const fechaPeru = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Lima"}));
      
      // Usar la fecha completa de Perú (no solo 00:00:00)
      fechaFormato = fechaPeru.toISOString().split('T')[0];
    }

    const asistencia = await this.asistenciaRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.alumno', 'alumno')
      .where('alumno.codigo = :codigo', { codigo: codigo })
      .andWhere('DATE(asistencia.fecha) = :fecha', { fecha: fechaFormato })
      .orderBy('asistencia.fecha', 'DESC')
      .getOne();

    if (!asistencia) {
      throw new NotFoundException(`No se encontró asistencia registrada para el alumno ${codigo} en la fecha ${fechaFormato}`);
    }

    // 3. Identificar actor: auxiliar o, si no, administrador/director por id_usuario
    let actorAuxiliar: Auxiliar | null = null;
    let actorAdmin: Administrador | null = null;
    let actorDirector: Director | null = null;

    if (updateDto.id_auxiliar) {
      actorAuxiliar = await this.auxiliarRepository.findOne({ where: { id_auxiliar: updateDto.id_auxiliar } });
      if (!actorAuxiliar) {
        throw new NotFoundException(`No se encontró ningún auxiliar con el ID: ${updateDto.id_auxiliar}`);
      }
    } else if (updateDto.id_usuario) {
      actorAdmin = await this.adminRepository.findOne({ where: { id_administrador: updateDto.id_usuario as any } });
      if (!actorAdmin) {
        actorDirector = await this.directorRepository.findOne({ where: { id_director: updateDto.id_usuario as any } });
        if (!actorDirector) {
          throw new NotFoundException('No se encontró administrador o director con ese ID');
        }
      }
    } else {
      throw new BadRequestException('Debe enviar id_auxiliar o id_usuario');
    }

    // 4. Validar la actualización de hora_salida
    if (updateDto.hora_salida && asistencia.hora_salida === null) {
      throw new BadRequestException(
        'No se puede actualizar la hora de salida cuando no hay un registro previo. Utilice el endpoint de registro de salida.'
      );
    }

    // 5. Crear objeto con los datos a actualizar
    const dataToUpdate: Partial<Asistencia> = {};

    if (updateDto.hora_de_llegada) {
      dataToUpdate.hora_de_llegada = updateDto.hora_de_llegada;
    }

    if (updateDto.estado_asistencia) {
      dataToUpdate.estado_asistencia = updateDto.estado_asistencia;
    }

    // Solo actualizar hora_salida si ya existe un valor previo
    if (asistencia.hora_salida !== null && updateDto.hora_salida) {
      dataToUpdate.hora_salida = updateDto.hora_salida;
    }

    // 6. Actualizar la asistencia
    await this.asistenciaRepository.update(asistencia.id_asistencia, dataToUpdate);

    // 7. Obtener la asistencia actualizada
    const asistenciaActualizada = await this.asistenciaRepository.findOne({
      where: { id_asistencia: asistencia.id_asistencia },
      relations: ['alumno']
    });

    if (!asistenciaActualizada) {
      throw new NotFoundException('Error al obtener la asistencia actualizada');
    }

    // 8. Crear registro en la tabla actualizaciones_asistencia
    const actualizacion = new ActualizacionesAsistencia();
    actualizacion.asistencia = asistenciaActualizada;
    actualizacion.alumno = alumno;
    if (actorAuxiliar) actualizacion.auxiliar = actorAuxiliar as any;
    if (actorAdmin) (actualizacion as any).administrador = actorAdmin as any;
    if (actorDirector) (actualizacion as any).director = actorDirector as any;
    actualizacion.motivo = updateDto.motivo;

    await this.actualizacionesRepository.save(actualizacion);

          // 9. Enviar notificación de Telegram al apoderado
      try {
        await this.telegramNotificationService.notificarAsistenciaApoderado(
          asistenciaActualizada, 
          `ACTUALIZACIÓN: ${updateDto.motivo}`, 
          'ACTUALIZACION'
        );
      } catch (telegramError) {
        // No lanzamos error para no afectar la actualización de asistencia
      }

    // 10. Construir la respuesta
    const response: UpdateAsistenciaResponseDto = {
      success: true,
      mensaje: `Asistencia del alumno ${alumno.nombre} ${alumno.apellido} actualizada exitosamente`,
      asistencia_actualizada: {
        id_asistencia: asistenciaActualizada.id_asistencia,
        hora_de_llegada: asistenciaActualizada.hora_de_llegada,
        hora_salida: asistenciaActualizada.hora_salida,
        estado_asistencia: asistenciaActualizada.estado_asistencia,
        fecha: asistenciaActualizada.fecha,
      },
      alumno: {
        id_alumno: alumno.id_alumno,
        codigo: alumno.codigo,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
      },
    };

    return response;
  }
}
