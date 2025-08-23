import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ValidarAlumnoUseCase } from 'src/entities/alumno/domain/ports/inbound/cases/validate-alumno-qr.usecases';
import { Asistencia } from '../asistencia.entity';
import { AsistenciaTypeOrmRepository } from '../domain/repository/asistencia.repository';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';
import { TelegramNotificationService } from '../../telegram/services/telegram-notification.service';

@Injectable()
export class RegistrarAsistenciaDesdeQRUseCase {
  constructor(
    private readonly validarAlumno: ValidarAlumnoUseCase,
    private readonly asistenciaRepo: AsistenciaTypeOrmRepository,
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  async execute(codigo_qr: string): Promise<Asistencia> {
    const alumno = await this.validarAlumno.execute(codigo_qr);
    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }

    // 🔒 VALIDACIÓN CRÍTICA: Verificar que el alumno tenga turno asignado
    if (!alumno.turno) {
      throw new BadRequestException('El alumno no tiene un turno asignado. No se puede registrar asistencia.');
    }

    
    const ahora = new Date();
    ahora.setHours(13, 5, 0); 

    const fechaActual = new Date(ahora.toDateString()); 
    const horaActual = ahora.toTimeString().split(' ')[0]; 

    // 🔒 VALIDACIÓN CRÍTICA: Verificar que la hora actual esté dentro del rango del turno
    const turno = alumno.turno;
    if (turno.hora_inicio && turno.hora_fin) {
      if (horaActual < turno.hora_inicio || horaActual > turno.hora_fin) {
        throw new BadRequestException(
          `No se puede registrar asistencia fuera del horario del turno. ` +
          `Turno: ${turno.turno} (${turno.hora_inicio} - ${turno.hora_fin}). ` +
          `Hora actual: ${horaActual}`
        );
      }
    }

    const asistencia = await this.asistenciaRepo.findByAlumnoAndDate(alumno.id_alumno, fechaActual);

    
    if (!asistencia) {
      const horaLimite = alumno.turno?.hora_limite;
      const estado =
        horaLimite && horaActual > horaLimite
          ? EstadoAsistencia.TARDANZA
          : EstadoAsistencia.PUNTUAL;

      const nuevaAsistencia = this.asistenciaRepo.create({
        alumno,
        hora_de_llegada: horaActual,
        hora_salida: null,
        estado_asistencia: estado,
        fecha: fechaActual,
      });

                   const asistenciaGuardada = await this.asistenciaRepo.save(nuevaAsistencia);
             
             // Enviar notificación de Telegram al apoderado
             await this.telegramNotificationService.notificarAsistenciaApoderado(asistenciaGuardada);
             
             return asistenciaGuardada;
           }

    // 🔒 VALIDACIÓN CRÍTICA: Verificar que no tenga estados conflictivos
    if (asistencia.estado_asistencia === EstadoAsistencia.AUSENTE) {
      throw new BadRequestException(
        `No se puede registrar asistencia. El alumno ya tiene estado AUSENTE para el día de hoy.`
      );
    }

    if (asistencia.estado_asistencia === EstadoAsistencia.JUSTIFICADO) {
      throw new BadRequestException(
        `No se puede registrar asistencia. El alumno ya tiene estado JUSTIFICADO para el día de hoy.`
      );
    }

    if (asistencia.estado_asistencia === EstadoAsistencia.ANULADO) {
      throw new BadRequestException(
        `No se puede registrar asistencia. El alumno ya tiene estado ANULADO para el día de hoy.`
      );
    }

    // 2️⃣ Ya tiene entrada pero no salida → validar si puede registrar salida
    if (!asistencia.hora_salida) {
      const horaFin = alumno.turno?.hora_fin;
      if (!horaFin) throw new BadRequestException('El turno no tiene hora de fin definida');

      if (horaActual < horaFin) {
        throw new BadRequestException(`La salida solo puede registrarse después de las ${horaFin}`);
      }

      asistencia.hora_salida = horaActual;
      return this.asistenciaRepo.save(asistencia);
    }

    // 3️⃣ Ya tiene entrada y salida → rechazar
    throw new BadRequestException('Ya se registró la entrada y salida de hoy');
  }
}
