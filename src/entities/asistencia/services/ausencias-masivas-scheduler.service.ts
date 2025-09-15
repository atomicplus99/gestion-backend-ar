import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AusenciasMasivasService } from './ausencias-masivas.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AusenciasMasivasLog } from '../entities/ausencias-masivas-log.entity';
import { AusenciasMasivasProgramadas } from '../entities/ausencias-masivas-programadas.entity';
import { Usuario } from '../../usuario/usuario.entity';
import { Auxiliar } from '../../auxiliar/auxiliar.entity';
import { Administrador } from '../../administrador/administrador.entity';
import { Director } from '../../director/director.entity';
import { TelegramNotificationService } from '../../telegram/services/telegram-notification.service';
import { NotificacionService } from '../../notificacion/services/notificacion.service';
import { NotificacionGateway } from '../../notificacion/gateways/notificacion.gateway';

@Injectable()
export class AusenciasMasivasSchedulerService {
  private readonly logger = new Logger(AusenciasMasivasSchedulerService.name);

  constructor(
    private readonly ausenciasMasivasService: AusenciasMasivasService,
    @InjectRepository(AusenciasMasivasLog)
    private readonly ausenciasMasivasLogRepository: Repository<AusenciasMasivasLog>,
    @InjectRepository(AusenciasMasivasProgramadas)
    private readonly ausenciasMasivasProgramadasRepository: Repository<AusenciasMasivasProgramadas>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Auxiliar)
    private readonly auxiliarRepository: Repository<Auxiliar>,
    @InjectRepository(Administrador)
    private readonly administradorRepository: Repository<Administrador>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    private readonly telegramNotificationService: TelegramNotificationService,
    private readonly notificacionService: NotificacionService,
    private readonly notificacionGateway: NotificacionGateway,
  ) {}

  /**
   * Ejecuta cada minuto para verificar si hay ausencias programadas
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async verificarAusenciasProgramadas() {
    try {
      this.logger.log(`🕐 [SCHEDULER] Iniciando verificación de ausencias programadas - ${new Date().toLocaleString("en-US", {timeZone: "America/Lima"})}`);
      
      const ahora = new Date();
      this.logger.log(`⏰ [SCHEDULER] Hora actual del sistema: ${ahora.toLocaleString("en-US", {timeZone: "America/Lima"})}`);

      // Buscar TODAS las ausencias programadas
      const ausenciasProgramadas = await this.ausenciasMasivasProgramadasRepository
        .createQueryBuilder('programada')
        .leftJoinAndSelect('programada.usuario', 'usuario')
        .where('programada.estado = :estado', { estado: 'PROGRAMADA' })
        .getMany();

      this.logger.log(`📋 [SCHEDULER] Ausencias programadas encontradas: ${ausenciasProgramadas.length}`);
      
      if (ausenciasProgramadas.length > 0) {
        ausenciasProgramadas.forEach((ausencia, index) => {
          this.logger.log(`📅 [SCHEDULER] Ausencia ${index + 1}: ID=${ausencia.id}, Fecha=${ausencia.fecha_ejecucion}, Hora=${ausencia.hora_programada}, Turnos=${ausencia.turnos_procesar}`);
        });
      }

      // Filtrar las que están en el minuto exacto programado
      const ausenciasParaEjecutar = ausenciasProgramadas.filter(log => {
        // Obtener la fecha actual del sistema (no de la BD)
        const ahora = new Date();
        const [horas, minutos, segundos] = log.hora_programada.split(':').map(Number);
        
        this.logger.log(`🔍 [SCHEDULER] Analizando ausencia ID=${log.id}: Hora programada=${log.hora_programada} (${horas}:${minutos}:${segundos})`);
        
        // Crear fecha programada usando la fecha actual del sistema
        const fechaProgramada = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
          horas,
          minutos,
          segundos || 0,
          0
        );
        
        // Obtener solo hora y minuto actual (ignorar segundos y milisegundos)
        const ahoraHoraMinuto = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), ahora.getHours(), ahora.getMinutes(), 0, 0);
        
        // Obtener solo hora y minuto programado (ignorar segundos y milisegundos)
        const fechaProgramadaHoraMinuto = new Date(
          fechaProgramada.getFullYear(),
          fechaProgramada.getMonth(),
          fechaProgramada.getDate(),
          fechaProgramada.getHours(),
          fechaProgramada.getMinutes(),
          0,
          0
        );
        
        this.logger.log(`⏰ [SCHEDULER] Comparación: Hora actual=${ahoraHoraMinuto.toLocaleString("en-US", {timeZone: "America/Lima"})} vs Hora programada=${fechaProgramadaHoraMinuto.toLocaleString("en-US", {timeZone: "America/Lima"})}`);
        
        // Ejecutar si estamos en la hora y minuto programados (ignorar segundos)
        // También ejecutar si ya pasó el minuto programado (para casos donde el scheduler se ejecutó tarde)
        const debeEjecutar = fechaProgramadaHoraMinuto.getTime() === ahoraHoraMinuto.getTime() || 
                            (ahoraHoraMinuto.getTime() > fechaProgramadaHoraMinuto.getTime() && 
                             ahoraHoraMinuto.getTime() - fechaProgramadaHoraMinuto.getTime() <= 60000); // Máximo 1 minuto de diferencia
        
        const diferenciaTiempo = ahoraHoraMinuto.getTime() - fechaProgramadaHoraMinuto.getTime();
        const diferenciaSegundos = Math.floor(diferenciaTiempo / 1000);
        
        this.logger.log(`✅ [SCHEDULER] ¿Debe ejecutar? ${debeEjecutar} (Diferencia: ${diferenciaSegundos} segundos)`);
        this.logger.log(`📊 [SCHEDULER] Tiempo actual=${ahoraHoraMinuto.getTime()}, Tiempo programado=${fechaProgramadaHoraMinuto.getTime()}`);
        
        return debeEjecutar;
      });

      this.logger.log(`🎯 [SCHEDULER] Ausencias para ejecutar: ${ausenciasParaEjecutar.length}`);
      
      if (ausenciasParaEjecutar.length === 0) {
        this.logger.log(`⏭️ [SCHEDULER] No hay ausencias programadas para ejecutar en este momento`);
        return;
      }

      this.logger.log(`🚀 [SCHEDULER] Iniciando ejecución de ${ausenciasParaEjecutar.length} ausencia(s) programada(s)`);


      for (const ausenciaProgramada of ausenciasParaEjecutar) {
        try {
          this.logger.log(`🔄 [SCHEDULER] Procesando ausencia programada ID=${ausenciaProgramada.id}`);
          
          // Extraer turnos del string almacenado
          const turnos = ausenciaProgramada.turnos_procesar.split(', ').map(t => t.trim());
          this.logger.log(`📋 [SCHEDULER] Turnos a procesar: ${turnos.join(', ')}`);
          
          // Usar la fecha actual del sistema (no la fecha de la BD)
          const fechaActual = new Date();
          this.logger.log(`📅 [SCHEDULER] Fecha de ejecución: ${fechaActual.toLocaleString("en-US", {timeZone: "America/Lima"})}`);

          this.logger.log(`🚀 [SCHEDULER] Ejecutando ausencia masiva - El servicio manejará individualmente a cada alumno`);

          // Ejecutar la ausencia programada
          const resultado = await this.ausenciasMasivasService.ejecutarProgramaAusencias(
            fechaActual,
            ausenciaProgramada.hora_programada,
            turnos
          );

          this.logger.log(`📊 [SCHEDULER] Resultado de ejecución: ${resultado.ausenciasCreadas} ausencias creadas, ${resultado.alumnosConAsistencia} alumnos ya tenían asistencia`);

          // Actualizar estado a EJECUTADA
          await this.ausenciasMasivasProgramadasRepository.update(
            { id: ausenciaProgramada.id },
            { 
              estado: 'EJECUTADA',
              observaciones: `Ejecutado automáticamente. ${resultado.ausenciasCreadas} ausencias creadas.`
            }
          );


          // Crear notificación de scheduler exitoso
          try {
            const infoPersonal = await this.obtenerInformacionPersonalUsuario(ausenciaProgramada.usuario_id);
            const notificacion = await this.notificacionService.createSchedulerNotification({
              ausencias_procesadas: resultado.ausenciasCreadas,
              errores: 0,
              tiempo_ejecucion: 'N/A', // No tenemos tiempo de ejecución en el resultado
              alumnos_afectados: resultado.totalAlumnos,
              estado: 'exitoso',
              usuario_programador: infoPersonal
            });

            // Enviar notificación por WebSocket
            await this.notificacionGateway.broadcastNotification(notificacion);
            
          } catch (notificationError) {
          }

        } catch (error) {
          
          // Marcar como ERROR
          await this.ausenciasMasivasProgramadasRepository.update(
            { id: ausenciaProgramada.id },
            { 
              estado: 'CANCELADA',
              observaciones: `Error en ejecución automática: ${error.message}`
            }
          );

          // Crear notificación de scheduler con error
          try {
            const infoPersonal = await this.obtenerInformacionPersonalUsuario(ausenciaProgramada.usuario_id);
            const notificacion = await this.notificacionService.createSchedulerNotification({
              ausencias_procesadas: 0,
              errores: 1,
              tiempo_ejecucion: 'N/A',
              alumnos_afectados: 0,
              estado: 'error',
              usuario_programador: infoPersonal
            });

            // Enviar notificación por WebSocket
            await this.notificacionGateway.broadcastNotification(notificacion);
            
          } catch (notificationError) {
          }
        }
      }

    } catch (error) {
      this.logger.error(`❌ [SCHEDULER] Error en verificarAusenciasProgramadas: ${error.message}`);
      this.logger.error(`📊 [SCHEDULER] Stack trace: ${error.stack}`);
    }
  }

  /**
   * Programa una nueva ausencia para ejecutarse automáticamente
   */
  async programarAusencia(
    fecha: Date,
    hora: string,
    turnos: string[],
    usuario_id: string
  ): Promise<string> {
    try {

      // Verificar si ya hay una ausencia programada
      const ausenciaExistente = await this.ausenciasMasivasProgramadasRepository.findOne({
        where: { estado: 'PROGRAMADA' }
      });

      if (ausenciaExistente) {
        const infoPersonal = await this.obtenerInformacionPersonalUsuario(ausenciaExistente.usuario_id);
        const nombreUsuario = infoPersonal ? `${infoPersonal.nombre} ${infoPersonal.apellido}` : 'Usuario desconocido';
        throw new Error(`Ya existe una ausencia masiva programada para ${ausenciaExistente.fecha_ejecucion} a las ${ausenciaExistente.hora_programada} por ${nombreUsuario}`);
      }

      const programada = this.ausenciasMasivasProgramadasRepository.create({
        fecha_ejecucion: fecha,
        hora_programada: hora,
        turnos_procesar: turnos.join(', '),
        estado: 'PROGRAMADA',
        observaciones: 'Ausencia programada para ejecución automática',
        usuario_id: usuario_id,
      });

      const resultado = await this.ausenciasMasivasProgramadasRepository.save(programada);
      
      return resultado.id;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todas las ausencias programadas
   */
  async obtenerAusenciasProgramadas(): Promise<any[]> {
    try {
      const programadas = await this.ausenciasMasivasProgramadasRepository.find({
        where: { estado: 'PROGRAMADA' },
        relations: ['usuario'],
        order: { fecha_ejecucion: 'ASC', hora_programada: 'ASC' }
      });

      const programadasConInfo = await Promise.all(
        programadas.map(async (programada) => {
          const infoPersonal = await this.obtenerInformacionPersonalUsuario(programada.usuario_id);
          
          return {
            id: programada.id,
            fecha: programada.fecha_ejecucion,
            hora: programada.hora_programada,
            turnos: programada.turnos_procesar,
            estado: programada.estado,
            usuario: infoPersonal,
            fechaCreacion: programada.fecha_creacion
          };
        })
      );

      return programadasConInfo;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene la información personal del usuario según su rol
   */
  async obtenerInformacionPersonalUsuario(usuario_id: string): Promise<any> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: usuario_id }
      });

      if (!usuario) {
        return null;
      }

      let informacionPersonal: any = null;

      switch (usuario.rol_usuario) {
        case 'AUXILIAR':
          const auxiliar = await this.auxiliarRepository.findOne({
            where: { usuario: { id_user: usuario_id } }
          });
          if (auxiliar) {
            informacionPersonal = {
              id: usuario.id_user,
              nombre_usuario: usuario.nombre_usuario,
              rol: usuario.rol_usuario,
              nombre: auxiliar.nombre,
              apellido: auxiliar.apellido
            };
          }
          break;

        case 'ADMINISTRADOR':
          const administrador = await this.administradorRepository.findOne({
            where: { usuario: { id_user: usuario_id } }
          });
          if (administrador) {
            informacionPersonal = {
              id: usuario.id_user,
              nombre_usuario: usuario.nombre_usuario,
              rol: usuario.rol_usuario,
              nombre: administrador.nombres,
              apellido: administrador.apellidos
            };
          }
          break;

        case 'DIRECTOR':
          const director = await this.directorRepository.findOne({
            where: { usuario: { id_user: usuario_id } }
          });
          if (director) {
            informacionPersonal = {
              id: usuario.id_user,
              nombre_usuario: usuario.nombre_usuario,
              rol: usuario.rol_usuario,
              nombre: director.nombres,
              apellido: director.apellidos
            };
          }
          break;

        default:
          informacionPersonal = {
            id: usuario.id_user,
            nombre_usuario: usuario.nombre_usuario,
            rol: usuario.rol_usuario,
            nombre: 'Usuario',
            apellido: 'Sistema'
          };
      }

      return informacionPersonal;

    } catch (error) {
      return null;
    }
  }

  /**
   * Cancela una ausencia programada (solo el usuario que la programó)
   */
  async cancelarAusenciaProgramada(ausencia_id: string, usuario_id: string): Promise<boolean> {
    try {
      const programada = await this.ausenciasMasivasProgramadasRepository.findOne({
        where: { id: ausencia_id, estado: 'PROGRAMADA' }
      });

      if (!programada) {
        throw new Error('Ausencia programada no encontrada');
      }

      if (programada.usuario_id !== usuario_id) {
        throw new Error('Solo el usuario que programó la ausencia puede cancelarla');
      }

      await this.ausenciasMasivasProgramadasRepository.update(
        { id: ausencia_id },
        { estado: 'CANCELADA' }
      );

      return true;

    } catch (error) {
      throw error;
    }
  }
}
