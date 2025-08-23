import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Apoderado } from '../../apoderado/infraestructure/orm/entities/apoderado.entity';
import { Alumno } from '../../alumno/infraestructure/orm/entities/alumno.entity';
import { TelegramUser } from '../telegram-user.entity';
import { TelegramChat } from '../telegram-chat.entity';
import { IniciarRegistroDto, ConfirmarRegistroDto, ApoderadoRegistradoDto, AlumnoAsignadoDto } from '../dto/registro-apoderado.dto';

@Injectable()
export class TelegramApoderadoService {
  private readonly logger = new Logger(TelegramApoderadoService.name);

  constructor(
    @InjectRepository(Apoderado)
    private readonly apoderadoRepository: Repository<Apoderado>,
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
    @InjectRepository(TelegramUser)
    private readonly telegramUserRepository: Repository<TelegramUser>,
    @InjectRepository(TelegramChat)
    private readonly telegramChatRepository: Repository<TelegramChat>,
  ) {}

  /**
   * Inicia el proceso de registro verificando el DNI del apoderado
   */
  async iniciarRegistro(dniApoderado: string): Promise<{
    success: boolean;
    message: string;
    apoderado?: ApoderadoRegistradoDto;
    error?: string;
  }> {
    try {
      this.logger.log(`🔍 Iniciando registro para apoderado con DNI: ${dniApoderado}`);

      // Buscar apoderado por DNI
      const apoderado = await this.apoderadoRepository.findOne({
        where: { dni: dniApoderado },
        relations: ['pupilos'],
      });

      if (!apoderado) {
        this.logger.log(`❌ Apoderado con DNI ${dniApoderado} no encontrado`);
        return {
          success: false,
          message: 'Apoderado no encontrado',
          error: 'DNI no registrado en el sistema'
        };
      }

      if (!apoderado.pupilos || apoderado.pupilos.length === 0) {
        this.logger.log(`⚠️ Apoderado ${dniApoderado} no tiene alumnos asignados`);
        return {
          success: false,
          message: 'No tienes alumnos asignados',
          error: 'Contacta al administrador para asignar alumnos'
        };
      }

      // Verificar si ya está registrado en Telegram
      const telegramUser = await this.telegramUserRepository.findOne({
        where: { telegram_id: parseInt(dniApoderado) }
      });

      if (telegramUser) {
        this.logger.log(`⚠️ Apoderado ${dniApoderado} ya está registrado en Telegram`);
        return {
          success: false,
          message: 'Ya estás registrado en Telegram',
          error: 'Tu cuenta ya está activa'
        };
      }

      // Preparar datos del apoderado
      const apoderadoDto: ApoderadoRegistradoDto = {
        id_apoderado: apoderado.id_apoderado,
        dni: apoderado.dni || '',
        nombres: apoderado.nombre,
        apellidos: apoderado.apellido || '',
        alumnos: apoderado.pupilos.map(alumno => ({
          id_alumno: alumno.id_alumno,
          dni: alumno.dni_alumno,
          nombres: alumno.nombre,
          apellidos: alumno.apellido,
          nivel: alumno.nivel,
          grado: alumno.grado,
          seccion: alumno.seccion,
          codigo: alumno.codigo
        }))
      };

      this.logger.log(`✅ Apoderado ${dniApoderado} encontrado con ${apoderado.pupilos.length} alumnos`);
      
      return {
        success: true,
        message: 'Apoderado encontrado. Completa el registro confirmando los DNIs de tus alumnos.',
        apoderado: apoderadoDto
      };

    } catch (error) {
      this.logger.error(`❌ Error iniciando registro: ${error.message}`);
      return {
        success: false,
        message: 'Error interno del sistema',
        error: error.message
      };
    }
  }

  /**
   * Confirma el registro verificando los DNIs de los alumnos
   */
  async confirmarRegistro(datos: ConfirmarRegistroDto, chatId: number, telegramUserId: number): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      this.logger.log(`🔍 Confirmando registro para apoderado ${datos.dni_apoderado}`);

      // Verificar que el apoderado existe y tiene esos alumnos
      const apoderado = await this.apoderadoRepository.findOne({
        where: { dni: datos.dni_apoderado },
        relations: ['pupilos'],
      });

      if (!apoderado) {
        return {
          success: false,
          message: 'Apoderado no encontrado',
          error: 'DNI no válido'
        };
      }

      // Verificar que todos los DNIs de alumnos son correctos
      const alumnosAsignados = apoderado.pupilos.map(alumno => alumno.dni_alumno);
      const dniesCorrectos = datos.dni_alumnos.every(dni => alumnosAsignados.includes(dni));

      if (!dniesCorrectos) {
        return {
          success: false,
          message: 'Algunos DNIs de alumnos no son correctos',
          error: 'Verifica los DNIs de tus alumnos asignados'
        };
      }

      // Crear usuario de Telegram
      const telegramUser = this.telegramUserRepository.create({
        telegram_id: telegramUserId,
        first_name: `Apoderado_${datos.dni_apoderado}`,
        tipo_usuario: 'APODERADO',
        activo: true,
        fecha_registro: new Date()
      });

      await this.telegramUserRepository.save(telegramUser);

      // Crear chat de Telegram
      const telegramChat = this.telegramChatRepository.create({
        id_telegram_user: telegramUser.id_telegram_user,
        chat_id: chatId,
        activo: true,
        fecha_registro: new Date()
      });

      await this.telegramChatRepository.save(telegramChat);

      this.logger.log(`✅ Apoderado ${datos.dni_apoderado} registrado exitosamente en Telegram`);

      return {
        success: true,
        message: 'Registro completado exitosamente. Ahora recibirás notificaciones de tus alumnos.'
      };

    } catch (error) {
      this.logger.error(`❌ Error confirmando registro: ${error.message}`);
      return {
        success: false,
        message: 'Error interno del sistema',
        error: error.message
      };
    }
  }

  /**
   * Obtiene información del apoderado registrado
   */
  async obtenerApoderadoRegistrado(telegramUserId: number): Promise<ApoderadoRegistradoDto | null> {
    try {
      const telegramUser = await this.telegramUserRepository.findOne({
        where: { telegram_id: telegramUserId }
      });

      if (!telegramUser) {
        this.logger.log(`❌ Usuario de Telegram ${telegramUserId} no encontrado`);
        return null;
      }

      // Buscar apoderado por el DNI almacenado en el nombre del usuario
      // El formato es: "Apoderado_{DNI}"
      const nombreUsuario = telegramUser.first_name;
      const dniMatch = nombreUsuario.match(/Apoderado_(\d+)/);
      
      if (!dniMatch) {
        this.logger.log(`❌ No se pudo extraer DNI del nombre de usuario: ${nombreUsuario}`);
        return null;
      }

      const dniApoderado = dniMatch[1];
      this.logger.log(`🔍 Buscando apoderado con DNI: ${dniApoderado}`);

      const apoderado = await this.apoderadoRepository.findOne({
        where: { dni: dniApoderado },
        relations: ['pupilos']
      });

      if (!apoderado) {
        this.logger.log(`❌ Apoderado con DNI ${dniApoderado} no encontrado`);
        return null;
      }

      this.logger.log(`✅ Apoderado encontrado: ${apoderado.nombre} ${apoderado.apellido} con ${apoderado.pupilos?.length || 0} alumnos`);

      const apoderadoDto = {
        id_apoderado: apoderado.id_apoderado,
        dni: apoderado.dni || '',
        nombres: apoderado.nombre,
        apellidos: apoderado.apellido || '',
        alumnos: apoderado.pupilos.map(alumno => ({
          id_alumno: alumno.id_alumno,
          dni: alumno.dni_alumno,
          nombres: alumno.nombre,
          apellidos: alumno.apellido,
          nivel: alumno.nivel,
          grado: alumno.grado,
          seccion: alumno.seccion,
          codigo: alumno.codigo
        }))
      };

      this.logger.log(`📋 DTO generado con ${apoderadoDto.alumnos.length} alumnos`);
      return apoderadoDto;

    } catch (error) {
      this.logger.error(`❌ Error obteniendo apoderado: ${error.message}`);
      return null;
    }
  }
}
