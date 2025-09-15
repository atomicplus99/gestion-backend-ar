import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramUser } from '../telegram-user.entity';
import { TelegramChat } from '../telegram-chat.entity';
import { TelegramAccount } from '../entities/telegram-account.entity';
import { Apoderado } from '../../apoderado/infraestructure/orm/entities/apoderado.entity';
import { Alumno } from '../../alumno/infraestructure/orm/entities/alumno.entity';
import { TelegramAccountService } from './telegram-account.service';

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);

  constructor(
    @InjectRepository(TelegramUser)
    private telegramUserRepository: Repository<TelegramUser>,
    @InjectRepository(TelegramChat)
    private telegramChatRepository: Repository<TelegramChat>,
    @InjectRepository(TelegramAccount)
    private telegramAccountRepository: Repository<TelegramAccount>,
    @InjectRepository(Apoderado)
    private apoderadoRepository: Repository<Apoderado>,
    @InjectRepository(Alumno)
    private alumnoRepository: Repository<Alumno>,
    private telegramAccountService: TelegramAccountService,
  ) {}

  /**
   * Inicia sesión de un apoderado con sus credenciales
   */
  async iniciarSesion(telegramId: number, chatId: number, username: string, password: string): Promise<{
    success: boolean;
    message: string;
    apoderado?: any;
    alumnos?: any[];
  }> {
    try {
      this.logger.log(`🔐 Intentando iniciar sesión para usuario: ${username}`);

      // Verificar credenciales usando el servicio de cuentas
      const verificacion = await this.telegramAccountService.verificarCredenciales(username, password);
      
      if (!verificacion.success) {
        return {
          success: false,
          message: verificacion.message || 'Credenciales inválidas'
        };
      }

      // Obtener el apoderado
      const apoderado = await this.apoderadoRepository.findOne({
        where: { id_apoderado: verificacion.apoderadoId },
        relations: ['pupilos']
      });

      if (!apoderado) {
        return {
          success: false,
          message: 'Apoderado no encontrado'
        };
      }

      // Buscar el usuario de Telegram
      let telegramUser = await this.telegramUserRepository.findOne({
        where: { telegram_id: telegramId }
      });

      if (!telegramUser) {
        // Si no existe el usuario de Telegram, crearlo automáticamente
        this.logger.log(`🔄 Creando usuario de Telegram automáticamente para ID: ${telegramId}`);
        
        telegramUser = this.telegramUserRepository.create({
          telegram_id: telegramId,
          first_name: 'Usuario', // Nombre por defecto
          activo: true,
          sesion_iniciada: false
        });
        
        await this.telegramUserRepository.save(telegramUser);
        this.logger.log(`✅ Usuario de Telegram creado automáticamente: ${telegramId}`);

        // También crear el TelegramChat automáticamente
        const telegramChat = this.telegramChatRepository.create({
          chat_id: chatId,
          id_telegram_user: telegramUser.id_telegram_user,
          activo: true
        });
        
        await this.telegramChatRepository.save(telegramChat);
        this.logger.log(`✅ Chat de Telegram creado automáticamente: ${chatId}`);
      }

      // Actualizar estado de sesión
      telegramUser.sesion_iniciada = true;
      telegramUser.ultima_sesion = new Date();
      await this.telegramUserRepository.save(telegramUser);

      // Obtener información detallada de los alumnos
      const alumnos = await this.alumnoRepository.find({
        where: apoderado.pupilos.map(p => ({ id_alumno: p.id_alumno }))
      });

      this.logger.log(`✅ Sesión iniciada exitosamente para: ${apoderado.nombre} ${apoderado.apellido || ''}`);

      return {
        success: true,
        message: 'Sesión iniciada exitosamente',
        apoderado: {
          id: apoderado.id_apoderado,
          nombres: apoderado.nombre,
          apellidos: apoderado.apellido || '',
          dni: apoderado.dni
        },
        alumnos: alumnos.map(alumno => ({
          id: alumno.id_alumno,
          nombres: alumno.nombre,
          apellidos: alumno.apellido,
          dni: alumno.dni_alumno,
          codigo: alumno.codigo,
          nivel: alumno.nivel,
          grado: alumno.grado,
          seccion: alumno.seccion
        }))
      };

    } catch (error) {
      this.logger.error(`❌ Error al iniciar sesión: ${error.message}`);
      return {
        success: false,
        message: 'Error interno del sistema'
      };
    }
  }

  /**
   * Cierra la sesión de un apoderado
   */
  async cerrarSesion(telegramId: number): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`🔓 Cerrando sesión para usuario: ${telegramId}`);

      const telegramUser = await this.telegramUserRepository.findOne({
        where: { telegram_id: telegramId }
      });

      if (!telegramUser) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      // Actualizar estado de sesión
      telegramUser.sesion_iniciada = false;
      await this.telegramUserRepository.save(telegramUser);

      this.logger.log(`✅ Sesión cerrada exitosamente para: ${telegramId}`);

      return {
        success: true,
        message: 'Sesión cerrada exitosamente'
      };

    } catch (error) {
      this.logger.error(`❌ Error al cerrar sesión: ${error.message}`);
      return {
        success: false,
        message: 'Error interno del sistema'
      };
    }
  }

  /**
   * Verifica si un usuario tiene sesión iniciada
   */
  async tieneSesionIniciada(telegramId: number): Promise<boolean> {
    try {
      const telegramUser = await this.telegramUserRepository.findOne({
        where: { telegram_id: telegramId, sesion_iniciada: true, activo: true }
      });
      return !!telegramUser;
    } catch (error) {
      this.logger.error(`❌ Error al verificar sesión: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene información del apoderado autenticado
   */
  async obtenerApoderadoAutenticado(telegramId: number): Promise<{
    apoderado?: any;
    alumnos?: any[];
  }> {
    try {
      const telegramUser = await this.telegramUserRepository.findOne({
        where: { telegram_id: telegramId, sesion_iniciada: true, activo: true }
      });

      if (!telegramUser) {
        return {};
      }

      // Buscar la cuenta de Telegram asociada
      const cuenta = await this.telegramAccountRepository.findOne({
        where: { activo: true },
        relations: ['apoderado']
      });

      if (!cuenta) {
        return {};
      }

      // Obtener información del apoderado y sus alumnos
      const apoderado = await this.apoderadoRepository.findOne({
        where: { id_apoderado: cuenta.apoderadoId },
        relations: ['pupilos']
      });

      if (!apoderado) {
        return {};
      }

      // Obtener información detallada de los alumnos
      const alumnos = await this.alumnoRepository.find({
        where: apoderado.pupilos.map(p => ({ id_alumno: p.id_alumno }))
      });

      return {
        apoderado: {
          id: apoderado.id_apoderado,
          nombres: apoderado.nombre,
          apellidos: apoderado.apellido || '',
          dni: apoderado.dni
        },
        alumnos: alumnos.map(alumno => ({
          id_alumno: alumno.id_alumno,
          nombres: alumno.nombre,
          apellidos: alumno.apellido,
          dni: alumno.dni_alumno,
          codigo: alumno.codigo,
          nivel: alumno.nivel,
          grado: alumno.grado,
          seccion: alumno.seccion
        }))
      };

    } catch (error) {
      this.logger.error(`❌ Error al obtener apoderado autenticado: ${error.message}`);
      return {};
    }
  }

  /**
   * Cambia la contraseña de un apoderado
   */
  async cambiarContraseña(telegramId: number, nuevaContraseña: string): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`🔑 Cambiando contraseña para usuario: ${telegramId}`);

      // Verificar que el usuario tiene sesión iniciada
      const tieneSesion = await this.tieneSesionIniciada(telegramId);
      if (!tieneSesion) {
        return {
          success: false,
          message: 'Debe iniciar sesión primero'
        };
      }

      // Buscar la cuenta de Telegram
      const cuenta = await this.telegramAccountRepository.findOne({
        where: { activo: true }
      });

      if (!cuenta) {
        return {
          success: false,
          message: 'Cuenta no encontrada'
        };
      }

      // Encriptar y actualizar contraseña
      const passwordEncriptada = this.telegramAccountService.encriptarPassword(nuevaContraseña);
      cuenta.password = passwordEncriptada;
      await this.telegramAccountRepository.save(cuenta);

      this.logger.log(`✅ Contraseña actualizada exitosamente para: ${telegramId}`);

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };

    } catch (error) {
      this.logger.error(`❌ Error al cambiar contraseña: ${error.message}`);
      return {
        success: false,
        message: 'Error interno del sistema'
      };
    }
  }
}
