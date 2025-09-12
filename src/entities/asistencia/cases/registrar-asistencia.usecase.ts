import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ValidarAlumnoUseCase } from 'src/entities/alumno/domain/ports/inbound/cases/validate-alumno-qr.usecases';
import { Asistencia } from '../asistencia.entity';
import { AsistenciaTypeOrmRepository } from '../domain/repository/asistencia.repository';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';
import { TelegramNotificationService } from '../../telegram/services/telegram-notification.service';
import { TurnoExtraService } from '../../turno-extra/turno-extra.service';
import { AsistenciaExtraService } from '../../asistencia-extra/asistencia-extra.service';
import { CreateAsistenciaExtraDto } from '../../asistencia-extra/asistencia-extra.service';
import { UsuarioFotoService } from '../../usuario/services/usuario-foto.service';


@Injectable()
export class RegistrarAsistenciaDesdeQRUseCase {
  constructor(
    private readonly validarAlumno: ValidarAlumnoUseCase,
    private readonly asistenciaRepo: AsistenciaTypeOrmRepository,
    private readonly telegramNotificationService: TelegramNotificationService,
    private readonly turnoExtraService: TurnoExtraService,
    private readonly asistenciaExtraService: AsistenciaExtraService,
    private readonly usuarioFotoService: UsuarioFotoService,
  ) {}

  /**
   * Construye la URL completa de la imagen de perfil del usuario
   */
  private buildProfileImageUrl(profileImage: string): string {
    try {
      return this.usuarioFotoService.getProfilePhotoUrl(profileImage);
    } catch (error) {
      // Si hay error construyendo la URL, retornar la imagen por defecto
      return this.usuarioFotoService.getProfilePhotoUrl('no-image.png');
    }
  }

  async execute(codigo_qr: string): Promise<Asistencia | any> {
    const alumno = await this.validarAlumno.execute(codigo_qr);
    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }

    // 🔒 VALIDACIÓN CRÍTICA: Verificar que el alumno tenga turno asignado
    if (!alumno.turno) {
      throw new BadRequestException('El alumno no tiene un turno asignado. No se puede registrar asistencia.');
    }

    // Obtener hora y fecha real de Perú usando toLocaleString
    const ahora = new Date();
    const ahoraPeru = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Lima"}));
    
    // Debug: verificar las horas
    console.log('🕐 DEBUG HORAS:', {
      hora_utc: ahora.toTimeString().split(' ')[0],
      hora_peru: ahoraPeru.toTimeString().split(' ')[0],
      fecha_peru: ahoraPeru.toDateString()
    });
    
    // Usar solo la fecha (sin hora) para buscar asistencia existente
    const fechaActual = new Date(ahoraPeru.toDateString()); 
    const horaActual = ahoraPeru.toTimeString().split(' ')[0];

    // 🔍 VALIDACIÓN DE TURNO EXTRA: Verificar si el alumno tiene turno extra para hoy
    const turnosExtra = await this.turnoExtraService.findByAlumno(alumno.id_alumno);
    
    // Función auxiliar para convertir horas a minutos
    const convertirHoraAMinutos = (hora: string): number => {
      const [horas, minutos, segundos] = hora.split(':').map(Number);
      return horas * 60 + minutos + (segundos / 60);
    };
    
    const turnoExtraHoy = turnosExtra.find(turno => {
      // Convertir fechas a formato YYYY-MM-DD para comparación
      const fechaTurno = new Date(turno.fecha_turno);
      const fechaLimite = new Date(turno.fecha_limite);
      const fechaActualStr = fechaActual.toISOString().split('T')[0];
      const fechaTurnoStr = fechaTurno.toISOString().split('T')[0];
      const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];
      
      
      // Verificar que la fecha actual esté dentro del rango del turno extra
      const fechaEnRango = fechaActualStr >= fechaTurnoStr && fechaActualStr <= fechaLimiteStr;
      const estadoActivo = turno.estado === 'ACTIVO';
      
      
      return fechaEnRango && estadoActivo;
    });
    
    if (turnoExtraHoy) {
    } else {
    }

    // 🔒 VALIDACIÓN CRÍTICA: Verificar que la hora actual esté dentro del rango del turno O del turno extra
    const turno = alumno.turno;
    let horaValida = false;
    let dentroHorarioExtra = false;
    
    // Verificar si está en el horario del turno regular
    if (turno.hora_inicio && turno.hora_fin) {
      const horaActualMinutos = convertirHoraAMinutos(horaActual);
      const horaInicioMinutos = convertirHoraAMinutos(turno.hora_inicio);
      const horaFinMinutos = convertirHoraAMinutos(turno.hora_fin);
      
      // Calcular ventana de tolerancia: 2 horas antes de la hora de entrada
      const ventanaToleranciaMinutos = 2 * 60; // 2 horas en minutos
      const horaMinimaEntrada = horaInicioMinutos - ventanaToleranciaMinutos;
      
      
      if (horaActualMinutos >= horaMinimaEntrada && horaActualMinutos <= horaFinMinutos) {
        horaValida = true;
      } else {
      }
    }
    
    // Verificar si está en el horario del turno extra
    if (turnoExtraHoy) {
      const horaActualMinutos = convertirHoraAMinutos(horaActual);
      const horaEntradaMinutos = convertirHoraAMinutos(turnoExtraHoy.hora_entrada);
      const horaSalidaMinutos = convertirHoraAMinutos(turnoExtraHoy.hora_salida);
      
      
      // Para turnos extra: NO hay ventana de tolerancia, debe llegar exactamente en su hora
      if (horaActualMinutos >= horaEntradaMinutos && horaActualMinutos <= horaSalidaMinutos) {
        horaValida = true;
        dentroHorarioExtra = true;
      } else {
      }
    }

    const asistencia = await this.asistenciaRepo.findByAlumnoAndDate(alumno.id_alumno, fechaActual);

    // Si no hay asistencia previa, crear nueva asistencia
    if (!asistencia) {
      // 🔒 VALIDACIÓN CRÍTICA: Solo validar horarios para NUEVAS asistencias (entrada)
      if (!horaValida) {
        // Calcular hora mínima para mostrar en el mensaje de error
        const horaInicioMinutos = convertirHoraAMinutos(turno.hora_inicio);
        const ventanaToleranciaMinutos = 2 * 60; // 2 horas
        const horaMinimaEntrada = horaInicioMinutos - ventanaToleranciaMinutos;
        
        // Convertir minutos a formato HH:MM
        const horaMinimaFormato = `${Math.floor(horaMinimaEntrada/60).toString().padStart(2,'0')}:${(horaMinimaEntrada%60).toString().padStart(2,'0')}`;
        
        let mensajeError = `No se puede registrar asistencia fuera del horario del turno. ` +
          `Turno: ${turno.turno} (${turno.hora_inicio} - ${turno.hora_fin}). ` +
          `Hora actual: ${horaActual}`;
        
        if (turnoExtraHoy) {
          mensajeError += `. Turno extra: ${turnoExtraHoy.hora_entrada} - ${turnoExtraHoy.hora_salida}`;
        }
        
        throw new BadRequestException(mensajeError);
      }

      // Si tiene turno extra válido, crear asistencia extra
      if (turnoExtraHoy) {
        const horaOficialEntradaExtra = turnoExtraHoy.hora_entrada;
        
        const createAsistenciaExtraDto: CreateAsistenciaExtraDto = {
          alumno_id: alumno.id_alumno,
          fecha: fechaActual,
          hora_de_llegada: horaOficialEntradaExtra, // Hora oficial del turno extra
          hora_limite: turnoExtraHoy.hora_limite,
          observaciones: `Turno extra: ${turnoExtraHoy.observaciones}`
        };

        const asistenciaExtraGuardada = await this.asistenciaExtraService.create(createAsistenciaExtraDto, alumno);
        
        // Construir URL completa de la imagen de perfil
        if (asistenciaExtraGuardada.alumno?.usuario?.profile_image) {
          asistenciaExtraGuardada.alumno.usuario.profile_image = this.buildProfileImageUrl(asistenciaExtraGuardada.alumno.usuario.profile_image);
        }
        
        return asistenciaExtraGuardada;
      }

      // Si no tiene turno extra, crear asistencia regular
      const horaLimite = alumno.turno?.hora_limite;
      
      // Siempre registrar la hora oficial de entrada del turno, no la hora actual
      const horaOficialEntrada = turno.hora_inicio;
      
      // Determinar el estado basado en la hora actual vs la hora límite
      const estado =
        horaLimite && horaActual > horaLimite
          ? EstadoAsistencia.TARDANZA
          : EstadoAsistencia.PUNTUAL;

      const nuevaAsistencia = this.asistenciaRepo.create({
        alumno,
        hora_de_llegada: horaOficialEntrada, // Hora oficial del turno
        hora_salida: null,
        estado_asistencia: estado,
        fecha: new Date(ahoraPeru), // Fecha con la hora real de Perú
      });

      const asistenciaGuardada = await this.asistenciaRepo.save(nuevaAsistencia);
      
      // Construir URL completa de la imagen de perfil
      if (asistenciaGuardada.alumno?.usuario?.profile_image) {
        asistenciaGuardada.alumno.usuario.profile_image = this.buildProfileImageUrl(asistenciaGuardada.alumno.usuario.profile_image);
      }
      
      // Enviar notificación de Telegram al apoderado
      await this.telegramNotificationService.notificarAsistenciaApoderado(asistenciaGuardada);
      
      return asistenciaGuardada;
    }

    // Si ya tiene asistencia regular, verificar si puede registrar salida o asistencia extra
    if (asistencia) {
      // Si tiene turno extra válido Y está dentro del horario del turno extra, verificar asistencia extra
      if (turnoExtraHoy) {
        const horaActualMinutos = convertirHoraAMinutos(horaActual);
        const horaEntradaExtraMinutos = convertirHoraAMinutos(turnoExtraHoy.hora_entrada);
        const horaSalidaExtraMinutos = convertirHoraAMinutos(turnoExtraHoy.hora_salida);
        
        // Verificar si está dentro del horario del turno extra
        const dentroHorarioExtra = horaActualMinutos >= horaEntradaExtraMinutos && horaActualMinutos <= horaSalidaExtraMinutos;
        
        if (dentroHorarioExtra) {
          // Verificar que no tenga ya una asistencia extra para hoy
          const asistenciaExtraExistente = await this.asistenciaExtraService.findByAlumnoAndDate(
            alumno.id_alumno, 
            fechaActual
          );

          if (!asistenciaExtraExistente) {
            // Crear asistencia extra en la entidad AsistenciaExtra
            const horaOficialEntradaExtra = turnoExtraHoy.hora_entrada;
            
            const createAsistenciaExtraDto: CreateAsistenciaExtraDto = {
              alumno_id: alumno.id_alumno,
              fecha: fechaActual,
              hora_de_llegada: horaOficialEntradaExtra, // Hora oficial del turno extra
              hora_limite: turnoExtraHoy.hora_limite,
              observaciones: `Turno extra: ${turnoExtraHoy.observaciones}`
            };

            const asistenciaExtraGuardada = await this.asistenciaExtraService.create(createAsistenciaExtraDto, alumno);
            
            // Construir URL completa de la imagen de perfil
            if (asistenciaExtraGuardada.alumno?.usuario?.profile_image) {
              asistenciaExtraGuardada.alumno.usuario.profile_image = this.buildProfileImageUrl(asistenciaExtraGuardada.alumno.usuario.profile_image);
            }
            
            return asistenciaExtraGuardada;
          } else {
            // Si ya tiene asistencia extra pero no tiene salida, permitir registrar salida
            if (!asistenciaExtraExistente.hora_salida) {
              const horaFinTurnoExtra = turnoExtraHoy.hora_salida;
              
              // Verificar que la hora actual sea después del fin del turno extra
              const horaFinTurnoExtraMinutos = convertirHoraAMinutos(horaFinTurnoExtra);
              
              if (horaActualMinutos < horaFinTurnoExtraMinutos) {
                throw new BadRequestException(
                  `La salida del turno extra solo puede registrarse después de las ${horaFinTurnoExtra}`
                );
              }

                             // Registrar hora de salida REAL del alumno
               asistenciaExtraExistente.hora_salida = horaActual;
               const asistenciaExtraActualizada = await this.asistenciaExtraService.update(
                 asistenciaExtraExistente.id_asistencia_extra,
                 { hora_salida: horaActual }
               );
               
               // Construir URL completa de la imagen de perfil
               if (asistenciaExtraActualizada.alumno?.usuario?.profile_image) {
                 asistenciaExtraActualizada.alumno.usuario.profile_image = this.buildProfileImageUrl(asistenciaExtraActualizada.alumno.usuario.profile_image);
               }
               
               return asistenciaExtraActualizada;
            } else {
              throw new BadRequestException('Ya se registró la entrada y salida del turno extra de hoy');
            }
          }
        }
      }

      // Si no tiene turno extra, manejar asistencia regular
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

             // Ya tiene entrada pero no salida → validar si puede registrar salida
       if (!asistencia.hora_salida) {
         const horaFin = alumno.turno?.hora_fin;
         if (!horaFin) throw new BadRequestException('El turno no tiene hora de fin definida');

         // Verificar que la hora actual sea después de la hora de fin del turno
         const horaActualMinutos = convertirHoraAMinutos(horaActual);
         const horaFinMinutos = convertirHoraAMinutos(horaFin);
         
         if (horaActualMinutos < horaFinMinutos) {
           throw new BadRequestException(
             `La salida solo puede registrarse después de las ${horaFin}. Hora actual: ${horaActual}`
           );
         }

                   // Si está dentro del horario del turno extra, NO permitir registrar salida del turno regular
          if (dentroHorarioExtra && turnoExtraHoy) {
            throw new BadRequestException(
              `No se puede registrar salida del turno regular cuando está en horario de turno extra (${turnoExtraHoy.hora_entrada} - ${turnoExtraHoy.hora_salida}). ` +
              `Registre su entrada al turno extra.`
            );
          }

          // Registrar salida (ya validamos que es después de la hora de fin)
          asistencia.hora_salida = horaActual;
          // Actualizar la fecha para incluir la hora de salida (mantener la fecha original pero con la hora de salida)
          const fechaOriginal = new Date(asistencia.fecha);
          fechaOriginal.setHours(ahoraPeru.getHours(), ahoraPeru.getMinutes(), ahoraPeru.getSeconds(), 0);
          asistencia.fecha = fechaOriginal;
          
          const asistenciaActualizada = await this.asistenciaRepo.save(asistencia);
          
          // Cargar las relaciones completas después de actualizar
          const asistenciaConRelaciones = await this.asistenciaRepo.findByAlumnoAndDate(alumno.id_alumno, fechaActual);
          
          // Construir URL completa de la imagen de perfil
          if (asistenciaConRelaciones?.alumno?.usuario?.profile_image) {
            asistenciaConRelaciones.alumno.usuario.profile_image = this.buildProfileImageUrl(asistenciaConRelaciones.alumno.usuario.profile_image);
          }
          
          return asistenciaConRelaciones;
       }

      // Ya tiene entrada y salida → rechazar
      throw new BadRequestException('Ya se registró la entrada y salida de hoy');
    }
  }
}
