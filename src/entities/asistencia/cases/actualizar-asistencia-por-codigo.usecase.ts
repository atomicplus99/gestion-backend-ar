import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
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

    // 2. Buscar la asistencia más reciente del alumno (hoy o la última)
    // Obtener fecha actual en zona horaria de Perú (UTC-5)
    const ahora = new Date();
    const offsetPeru = -5 * 60; // UTC-5 en minutos
    const fechaPeru = new Date(ahora.getTime() + (offsetPeru * 60 * 1000));
    
    // Construir fecha a las 00:00:00 en hora local de Perú
    const fechaHoy = new Date(fechaPeru.getFullYear(), fechaPeru.getMonth(), fechaPeru.getDate(), 0, 0, 0, 0);
    const fechaFormato = fechaHoy.toISOString().split('T')[0];

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

    // 3. Buscar el auxiliar por ID
    const auxiliar = await this.auxiliarRepository.findOne({
      where: { id_auxiliar: updateDto.id_auxiliar }
    });

    if (!auxiliar) {
      throw new NotFoundException(`No se encontró ningún auxiliar con el ID: ${updateDto.id_auxiliar}`);
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
    actualizacion.auxiliar = auxiliar;
    actualizacion.motivo = updateDto.motivo;

    await this.actualizacionesRepository.save(actualizacion);

          // 9. Enviar notificación de Telegram al apoderado
      try {
        console.log('🔔🔔🔔 INTENTANDO ENVIAR NOTIFICACIÓN TELEGRAM 🔔🔔🔔');
        await this.telegramNotificationService.notificarAsistenciaApoderado(
          asistenciaActualizada, 
          `ACTUALIZACIÓN: ${updateDto.motivo}`, 
          'ACTUALIZACION'
        );
        console.log('✅✅✅ NOTIFICACIÓN TELEGRAM ENVIADA EXITOSAMENTE ✅✅✅');
      } catch (telegramError) {
        console.error('[ActualizarAsistenciaPorCodigoUseCase] Error enviando notificación Telegram:', telegramError);
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
