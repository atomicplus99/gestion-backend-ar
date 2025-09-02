import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ValidarAlumnoUseCase } from 'src/entities/alumno/domain/ports/inbound/cases/validate-alumno-qr.usecases';
import { Asistencia } from '../asistencia.entity';
import { AsistenciaTypeOrmRepository } from '../domain/repository/asistencia.repository';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';
import { TelegramNotificationService } from '../../telegram/services/telegram-notification.service';
import { TurnoExtraService } from '../../turno-extra/turno-extra.service';
import { AsistenciaExtraService } from '../../asistencia-extra/asistencia-extra.service';
import { CreateAsistenciaExtraDto } from '../../asistencia-extra/asistencia-extra.service';

@Injectable()
export class RegistrarAsistenciaDesdeQRUseCase {
  constructor(
    private readonly validarAlumno: ValidarAlumnoUseCase,
    private readonly asistenciaRepo: AsistenciaTypeOrmRepository,
    private readonly telegramNotificationService: TelegramNotificationService,
    private readonly turnoExtraService: TurnoExtraService,
    private readonly asistenciaExtraService: AsistenciaExtraService,
  ) {}

  async execute(codigo_qr: string): Promise<Asistencia | any> {
    const alumno = await this.validarAlumno.execute(codigo_qr);
    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }

    // 🔒 VALIDACIÓN CRÍTICA: Verificar que el alumno tenga turno asignado
    if (!alumno.turno) {
      throw new BadRequestException('El alumno no tiene un turno asignado. No se puede registrar asistencia.');
    }

    const ahora = new Date();
    ahora.setHours(15,0, 0); 

    const fechaActual = new Date(ahora.toDateString()); 
    const horaActual = ahora.toTimeString().split(' ')[0]; 

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
      
      console.log(`🔍 DEBUG BÚSQUEDA TURNO EXTRA:`);
      console.log(`   - Fecha inicio turno extra: ${fechaTurnoStr}`);
      console.log(`   - Fecha límite turno extra: ${fechaLimiteStr}`);
      console.log(`   - Fecha actual: ${fechaActualStr}`);
      console.log(`   - ¿Fecha actual >= fecha inicio? ${fechaActualStr >= fechaTurnoStr}`);
      console.log(`   - ¿Fecha actual <= fecha límite? ${fechaActualStr <= fechaLimiteStr}`);
      console.log(`   - Estado turno extra: ${turno.estado}`);
      console.log(`   - ¿Estado ACTIVO? ${turno.estado === 'ACTIVO'}`);
      
      // Verificar que la fecha actual esté dentro del rango del turno extra
      const fechaEnRango = fechaActualStr >= fechaTurnoStr && fechaActualStr <= fechaLimiteStr;
      const estadoActivo = turno.estado === 'ACTIVO';
      
      console.log(`   - ¿Fecha en rango? ${fechaEnRango}`);
      console.log(`   - ¿Estado activo? ${estadoActivo}`);
      console.log(`   - ¿Turno extra válido? ${fechaEnRango && estadoActivo}`);
      
      return fechaEnRango && estadoActivo;
    });
    
    if (turnoExtraHoy) {
      console.log(`✅ TURNO EXTRA ENCONTRADO para hoy: ${turnoExtraHoy.observaciones}`);
    } else {
      console.log(`❌ NO se encontró turno extra para hoy`);
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
      
      console.log(`🔍 DEBUG TURNO REGULAR (en minutos):`);
      console.log(`   - Hora actual: ${horaActual} (${horaActualMinutos} min)`);
      console.log(`   - Hora inicio turno: ${turno.hora_inicio} (${horaInicioMinutos} min)`);
      console.log(`   - Hora fin turno: ${turno.hora_fin} (${horaFinMinutos} min)`);
      console.log(`   - Ventana tolerancia: 2 horas antes`);
      console.log(`   - Hora mínima entrada: ${horaMinimaEntrada} min (${Math.floor(horaMinimaEntrada/60)}:${(horaMinimaEntrada%60).toString().padStart(2,'0')})`);
      console.log(`   - Comparación: ${horaActualMinutos} >= ${horaMinimaEntrada} = ${horaActualMinutos >= horaMinimaEntrada}`);
      console.log(`   - Comparación: ${horaActualMinutos} <= ${horaFinMinutos} = ${horaActualMinutos <= horaFinMinutos}`);
      
      if (horaActualMinutos >= horaMinimaEntrada && horaActualMinutos <= horaFinMinutos) {
        horaValida = true;
        console.log(`✅ Hora válida para turno regular (dentro de ventana de tolerancia)`);
      } else {
        console.log(`❌ Hora NO válida para turno regular`);
      }
    }
    
    // Verificar si está en el horario del turno extra
    if (turnoExtraHoy) {
      const horaActualMinutos = convertirHoraAMinutos(horaActual);
      const horaEntradaMinutos = convertirHoraAMinutos(turnoExtraHoy.hora_entrada);
      const horaSalidaMinutos = convertirHoraAMinutos(turnoExtraHoy.hora_salida);
      
      console.log(`🔍 DEBUG TURNO EXTRA (en minutos):`);
      console.log(`   - Hora actual: ${horaActual} (${horaActualMinutos} min)`);
      console.log(`   - Hora entrada turno extra: ${turnoExtraHoy.hora_entrada} (${horaEntradaMinutos} min)`);
      console.log(`   - Hora salida turno extra: ${turnoExtraHoy.hora_salida} (${horaSalidaMinutos} min)`);
      console.log(`   - Comparación: ${horaActualMinutos} >= ${horaEntradaMinutos} = ${horaActualMinutos >= horaEntradaMinutos}`);
      console.log(`   - Comparación: ${horaActualMinutos} <= ${horaSalidaMinutos} = ${horaActualMinutos <= horaSalidaMinutos}`);
      
      // Para turnos extra: NO hay ventana de tolerancia, debe llegar exactamente en su hora
      if (horaActualMinutos >= horaEntradaMinutos && horaActualMinutos <= horaSalidaMinutos) {
        horaValida = true;
        dentroHorarioExtra = true;
        console.log(`✅ Hora válida para turno extra (sin tolerancia)`);
      } else {
        console.log(`❌ Hora NO válida para turno extra (fuera del horario exacto)`);
      }
    }

    const asistencia = await this.asistenciaRepo.findByAlumnoAndDate(alumno.id_alumno, fechaActual);

    // Si no hay asistencia previa, crear nueva asistencia
    if (!asistencia) {
      // 🔒 VALIDACIÓN CRÍTICA: Solo validar horarios para NUEVAS asistencias
      if (!horaValida) {
        // Calcular hora mínima para mostrar en el mensaje de error
        const horaInicioMinutos = convertirHoraAMinutos(turno.hora_inicio);
        const ventanaToleranciaMinutos = 2 * 60; // 2 horas
        const horaMinimaEntrada = horaInicioMinutos - ventanaToleranciaMinutos;
        
        // Convertir minutos a formato HH:MM
        const horaMinimaFormato = `${Math.floor(horaMinimaEntrada/60).toString().padStart(2,'0')}:${(horaMinimaEntrada%60).toString().padStart(2,'0')}`;
        
        let mensajeError = `No se puede registrar asistencia fuera del horario del turno. ` +
          `Turno: ${turno.turno} (${horaMinimaFormato} - ${turno.hora_fin}). ` +
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
        
        console.log(`✅ Asistencia extra registrada:`);
        console.log(`   - Hora actual: ${horaActual}`);
        console.log(`   - Hora oficial entrada extra: ${horaOficialEntradaExtra}`);
        
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
        fecha: fechaActual,
      });

      const asistenciaGuardada = await this.asistenciaRepo.save(nuevaAsistencia);
      
      console.log(`✅ Asistencia registrada:`);
      console.log(`   - Hora actual: ${horaActual}`);
      console.log(`   - Hora oficial entrada: ${horaOficialEntrada}`);
      console.log(`   - Estado: ${estado}`);
      
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
            
            console.log(`✅ Asistencia extra registrada:`);
            console.log(`   - Hora actual: ${horaActual}`);
            console.log(`   - Hora oficial entrada extra: ${horaOficialEntradaExtra}`);
            
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
               
               console.log(`✅ Salida registrada para asistencia extra:`);
               console.log(`   - Hora real de salida: ${horaActual}`);
               console.log(`   - Hora fin turno extra oficial: ${turnoExtraHoy.hora_salida}`);
               console.log(`   - Salida registrada con hora real del alumno`);
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

                   // Si está dentro del horario del turno extra, NO permitir registrar salida del turno regular
          if (dentroHorarioExtra && turnoExtraHoy) {
            throw new BadRequestException(
              `No se puede registrar salida del turno regular cuando está en horario de turno extra (${turnoExtraHoy.hora_entrada} - ${turnoExtraHoy.hora_salida}). ` +
              `Registre su entrada al turno extra.`
            );
          }

                   // Permitir registrar salida incluso después del horario del turno regular
          // (los alumnos pueden salir tarde de sus aulas)
          // La hora de salida debe ser la hora REAL cuando marca, no la hora oficial
          asistencia.hora_salida = horaActual;
          
          console.log(`✅ Salida registrada para turno regular:`);
          console.log(`   - Hora real de salida: ${horaActual}`);
          console.log(`   - Hora fin turno oficial: ${horaFin}`);
          console.log(`   - Salida registrada con hora real del alumno`);
          
          return this.asistenciaRepo.save(asistencia);
       }

      // Ya tiene entrada y salida → rechazar
      throw new BadRequestException('Ya se registró la entrada y salida de hoy');
    }
  }
}
