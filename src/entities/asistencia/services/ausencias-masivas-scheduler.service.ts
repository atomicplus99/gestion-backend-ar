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
      this.logger.log('🔍 Verificando ausencias programadas...');
      
      const ahora = new Date();

      // Buscar TODAS las ausencias programadas
      const ausenciasProgramadas = await this.ausenciasMasivasProgramadasRepository
        .createQueryBuilder('programada')
        .leftJoinAndSelect('programada.usuario', 'usuario')
        .where('programada.estado = :estado', { estado: 'PROGRAMADA' })
        .getMany();

      // Filtrar las que están en el minuto exacto programado
      const ausenciasParaEjecutar = ausenciasProgramadas.filter(log => {
        // Obtener la fecha actual del sistema (no de la BD)
        const ahora = new Date();
        const [horas, minutos, segundos] = log.hora_programada.split(':').map(Number);
        
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
        
        this.logger.log(`🔍 [DEBUG] Ausencia ${log.id}:`);
        this.logger.log(`   - Fecha base: ${log.fecha_ejecucion}`);
        this.logger.log(`   - Hora programada: ${log.hora_programada}`);
        this.logger.log(`   - Fecha+Hora construida: ${fechaProgramada.toLocaleString('es-PE')}`);
        this.logger.log(`   - Fecha+Hora ISO: ${fechaProgramada.toISOString()}`);
        this.logger.log(`   - Hora+Minuto programado: ${fechaProgramadaHoraMinuto.toLocaleString('es-PE')}`);
        this.logger.log(`   - Ahora: ${ahora.toLocaleString('es-PE')}`);
        this.logger.log(`   - Hora+Minuto actual: ${ahoraHoraMinuto.toLocaleString('es-PE')}`);
        this.logger.log(`   - ¿Coinciden hora+minuto?: ${fechaProgramadaHoraMinuto.getTime() === ahoraHoraMinuto.getTime()}`);
        
        // Ejecutar si estamos en la hora y minuto programados (ignorar segundos)
        const debeEjecutar = fechaProgramadaHoraMinuto.getTime() === ahoraHoraMinuto.getTime();
        
        this.logger.log(`   - ¿Debe ejecutar?: ${debeEjecutar}`);
        
        return debeEjecutar;
      });

      if (ausenciasParaEjecutar.length === 0) {
        this.logger.log('✅ No hay ausencias programadas para ejecutar en este minuto exacto');
        return;
      }

      this.logger.log(`🚀 Ejecutando ${ausenciasParaEjecutar.length} ausencias programadas...`);

      for (const ausenciaProgramada of ausenciasParaEjecutar) {
        try {
          // Extraer turnos del string almacenado
          const turnos = ausenciaProgramada.turnos_procesar.split(', ').map(t => t.trim());
          
          // Usar la fecha actual del sistema (no la fecha de la BD)
          const fechaActual = new Date();

          // Verificar si ya existen ausencias para estos alumnos en esta fecha
          const verificacion = await this.ausenciasMasivasService.verificarAusenciasExistentes(fechaActual, turnos);
          
          if (verificacion.existenAusencias) {
            this.logger.warn(`⚠️ Ya existen ausencias registradas para esta fecha y turnos`);
            this.logger.warn(`   - ${verificacion.detalles.join(', ')}`);
            
            // Actualizar estado a CANCELADA por ausencias existentes
            await this.ausenciasMasivasProgramadasRepository.update(
              { id: ausenciaProgramada.id },
              {
                estado: 'CANCELADA',
                observaciones: `Cancelada: Ya existen ausencias registradas. ${verificacion.detalles.join(', ')}`
              }
            );

            // Crear notificación específica de cancelación
            try {
              const infoPersonal = await this.obtenerInformacionPersonalUsuario(ausenciaProgramada.usuario_id);
              const notificacion = await this.notificacionService.createCancelacionNotification({
                programacion_id: ausenciaProgramada.id,
                fecha_programada: fechaActual.toDateString(),
                hora_programada: ausenciaProgramada.hora_programada,
                turnos: turnos,
                motivo: `Ya existen ${verificacion.detalles.join(', ')}`,
                usuario_programador: infoPersonal
              });

              // Enviar notificación por WebSocket
              await this.notificacionGateway.broadcastNotification(notificacion);
              
              this.logger.log(`📢 Notificación de cancelación enviada: ${notificacion.id}`);
            } catch (notifError) {
              this.logger.error(`❌ Error enviando notificación de cancelación: ${notifError.message}`);
            }

            continue; // Saltar a la siguiente ausencia programada
          }

          // Ejecutar la ausencia programada
          const resultado = await this.ausenciasMasivasService.ejecutarProgramaAusencias(
            fechaActual,
            ausenciaProgramada.hora_programada,
            turnos
          );

          // Actualizar estado a EJECUTADA
          await this.ausenciasMasivasProgramadasRepository.update(
            { id: ausenciaProgramada.id },
            { 
              estado: 'EJECUTADA',
              observaciones: `Ejecutado automáticamente. ${resultado.ausenciasCreadas} ausencias creadas.`
            }
          );

          this.logger.log(`✅ Ausencia programada ejecutada: ${ausenciaProgramada.id}`);

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
            
            this.logger.log(`📢 Notificación de scheduler enviada: ${notificacion.id}`);
          } catch (notificationError) {
            this.logger.error(`❌ Error creando notificación de scheduler: ${notificationError.message}`);
          }

        } catch (error) {
          this.logger.error(`❌ Error ejecutando ausencia programada ${ausenciaProgramada.id}: ${error.message}`);
          
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
            
            this.logger.log(`📢 Notificación de error de scheduler enviada: ${notificacion.id}`);
          } catch (notificationError) {
            this.logger.error(`❌ Error creando notificación de error de scheduler: ${notificationError.message}`);
          }
        }
      }

    } catch (error) {
      this.logger.error(`❌ Error en verificación de ausencias programadas: ${error.message}`);
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
      this.logger.log(`📅 Programando ausencia para ${fecha.toDateString()} a las ${hora}`);

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
      
      this.logger.log(`✅ Ausencia programada exitosamente: ${resultado.id}`);
      return resultado.id;

    } catch (error) {
      this.logger.error(`❌ Error programando ausencia: ${error.message}`);
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
      this.logger.error(`❌ Error obteniendo ausencias programadas: ${error.message}`);
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
      this.logger.error(`❌ Error obteniendo información personal del usuario: ${error.message}`);
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

      this.logger.log(`✅ Ausencia programada cancelada: ${ausencia_id}`);
      return true;

    } catch (error) {
      this.logger.error(`❌ Error cancelando ausencia programada: ${error.message}`);
      throw error;
    }
  }
}
