import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramAccount } from '../entities/telegram-account.entity';
import { Apoderado } from '../../apoderado/infraestructure/orm/entities/apoderado.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class TelegramAccountService {
  private readonly logger = new Logger(TelegramAccountService.name);
  private readonly passwordFilePath = path.join(process.cwd(), 'password-apoderados-tel.txt');
  private readonly encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

  constructor(
    @InjectRepository(TelegramAccount)
    private telegramAccountRepository: Repository<TelegramAccount>,
    @InjectRepository(Apoderado)
    private apoderadoRepository: Repository<Apoderado>,
  ) {}

  /**
   * Encripta una contraseña usando AES-256-GCM
   */
  public encriptarPassword(password: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    cipher.setAAD(Buffer.from('telegram-accounts', 'utf8'));
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combinar IV, authTag y datos encriptados
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Desencripta una contraseña usando AES-256-GCM
   */
  private desencriptarPassword(encryptedPassword: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const parts = encryptedPassword.split(':');
    if (parts.length !== 3) {
      throw new Error('Formato de contraseña encriptada inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAAD(Buffer.from('telegram-accounts', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Genera un nombre de usuario basado en el nombre y DNI del apoderado
   */
  private generarUsername(apoderado: Apoderado): string {
    const nombre = apoderado.nombre.toLowerCase().replace(/\s+/g, '_');
    const dni = apoderado.dni || '';
    return `${nombre}_${dni}`;
  }

  /**
   * Genera la contraseña usando el DNI del apoderado
   */
  private generarPassword(apoderado: Apoderado): string {
    return apoderado.dni || '';
  }

  /**
   * Guarda las credenciales en el archivo de texto
   */
  private async guardarCredencialesEnArchivo(username: string, password: string, apoderado: Apoderado): Promise<void> {
    try {
      const credenciales = `Usuario: ${username}\nContraseña: ${password}\nApoderado: ${apoderado.nombre} ${apoderado.apellido || ''}\nDNI: ${apoderado.dni}\nFecha: ${new Date().toISOString()}\n${'='.repeat(50)}\n`;
      
      // Verificar si el archivo existe, si no, crearlo
      if (!fs.existsSync(this.passwordFilePath)) {
        fs.writeFileSync(this.passwordFilePath, 'CREDENCIALES DE CUENTAS TELEGRAM - APODERADOS\n' + '='.repeat(50) + '\n\n');
      }
      
      // Agregar las nuevas credenciales al archivo
      fs.appendFileSync(this.passwordFilePath, credenciales);
      
      this.logger.log(`✅ Credenciales guardadas en archivo para apoderado: ${apoderado.dni}`);
    } catch (error) {
      this.logger.error(`❌ Error al guardar credenciales en archivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una nueva cuenta de Telegram para un apoderado
   */
  async crearCuentaTelegram(apoderado: Apoderado): Promise<{ success: boolean; username?: string; password?: string; message?: string }> {
    try {
      this.logger.log(`🔄 Creando cuenta Telegram para apoderado: ${apoderado.dni}`);
      this.logger.log(`🔄 Apoderado ID: ${apoderado.id_apoderado}`);
      this.logger.log(`🔄 Ruta del archivo: ${this.passwordFilePath}`);

      // Verificar si ya existe una cuenta para este apoderado
      const cuentaExistente = await this.telegramAccountRepository.findOne({
        where: { apoderadoId: apoderado.id_apoderado }
      });

      if (cuentaExistente) {
        this.logger.warn(`⚠️ Ya existe una cuenta Telegram para el apoderado: ${apoderado.dni}`);
        return {
          success: false,
          message: 'Ya existe una cuenta de Telegram para este apoderado'
        };
      }

      // Generar credenciales
      const username = this.generarUsername(apoderado);
      const passwordPlain = this.generarPassword(apoderado);
      const passwordEncrypted = this.encriptarPassword(passwordPlain);

      // Crear la cuenta en la base de datos
      const nuevaCuenta = this.telegramAccountRepository.create({
        username,
        password: passwordEncrypted, // Guardar contraseña encriptada
        apoderadoId: apoderado.id_apoderado,
        activo: true
      });

      const cuentaGuardada = await this.telegramAccountRepository.save(nuevaCuenta);

      // Guardar credenciales en archivo (usar contraseña en texto plano para el archivo)
      await this.guardarCredencialesEnArchivo(username, passwordPlain, apoderado);

      this.logger.log(`✅ Cuenta Telegram creada exitosamente para apoderado: ${apoderado.dni}`);
      
      return {
        success: true,
        username,
        password: passwordPlain, // Devolver contraseña en texto plano
        message: 'Cuenta de Telegram creada exitosamente'
      };

    } catch (error) {
      this.logger.error(`❌ Error al crear cuenta Telegram: ${error.message}`);
      return {
        success: false,
        message: `Error al crear cuenta de Telegram: ${error.message}`
      };
    }
  }

  /**
   * Elimina una cuenta de Telegram de un apoderado
   */
  async eliminarCuentaTelegram(apoderadoId: string): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`🔄 Eliminando cuenta Telegram para apoderado ID: ${apoderadoId}`);

      // Buscar la cuenta del apoderado
      const cuenta = await this.telegramAccountRepository.findOne({
        where: { apoderadoId }
      });

      if (!cuenta) {
        this.logger.warn(`⚠️ No se encontró cuenta Telegram para el apoderado ID: ${apoderadoId}`);
        return {
          success: false,
          message: 'No se encontró una cuenta de Telegram para este apoderado'
        };
      }

      // Eliminar la cuenta de la base de datos
      await this.telegramAccountRepository.remove(cuenta);

      this.logger.log(`✅ Cuenta Telegram eliminada exitosamente para apoderado ID: ${apoderadoId}`);
      
      return {
        success: true,
        message: 'Cuenta de Telegram eliminada exitosamente'
      };

    } catch (error) {
      this.logger.error(`❌ Error al eliminar cuenta Telegram: ${error.message}`);
      return {
        success: false,
        message: `Error al eliminar cuenta de Telegram: ${error.message}`
      };
    }
  }

  /**
   * Obtiene la cuenta de Telegram de un apoderado
   */
  async obtenerCuentaTelegram(apoderadoId: string): Promise<TelegramAccount | null> {
    try {
      return await this.telegramAccountRepository.findOne({
        where: { apoderadoId, activo: true },
        relations: ['apoderado']
      });
    } catch (error) {
      this.logger.error(`❌ Error al obtener cuenta Telegram: ${error.message}`);
      return null;
    }
  }

  /**
   * Verifica si un apoderado tiene una cuenta de Telegram activa
   */
  async tieneCuentaTelegram(apoderadoId: string): Promise<boolean> {
    try {
      const cuenta = await this.telegramAccountRepository.findOne({
        where: { apoderadoId, activo: true }
      });
      return !!cuenta;
    } catch (error) {
      this.logger.error(`❌ Error al verificar cuenta Telegram: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifica las credenciales de login de un apoderado
   */
  async verificarCredenciales(username: string, password: string): Promise<{ success: boolean; apoderadoId?: string; message?: string }> {
    try {
      this.logger.log(`🔍 Verificando credenciales para usuario: ${username}`);
      
      const cuenta = await this.telegramAccountRepository.findOne({
        where: { username, activo: true },
        relations: ['apoderado']
      });

      if (!cuenta) {
        this.logger.warn(`⚠️ Usuario no encontrado: ${username}`);
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      this.logger.log(`✅ Usuario encontrado: ${username}`);
      this.logger.log(`🔐 Contraseña encriptada: ${cuenta.password.substring(0, 20)}...`);
      
      // Desencriptar contraseña almacenada
      const passwordDesencriptada = this.desencriptarPassword(cuenta.password);
      this.logger.log(`🔓 Contraseña desencriptada: ${passwordDesencriptada}`);
      this.logger.log(`🔑 Contraseña ingresada: ${password}`);
      
      if (passwordDesencriptada === password) {
        this.logger.log(`✅ Credenciales válidas para: ${username}`);
        return {
          success: true,
          apoderadoId: cuenta.apoderadoId,
          message: 'Credenciales válidas'
        };
      } else {
        this.logger.warn(`❌ Contraseña incorrecta para: ${username}`);
        return {
          success: false,
          message: 'Contraseña incorrecta'
        };
      }
    } catch (error) {
      this.logger.error(`❌ Error al verificar credenciales: ${error.message}`);
      return {
        success: false,
        message: 'Error al verificar credenciales'
      };
    }
  }

  /**
   * Método de prueba para verificar la escritura del archivo
   */
  async probarEscrituraArchivo(): Promise<void> {
    try {
      this.logger.log(`🧪 Probando escritura en archivo: ${this.passwordFilePath}`);
      
      const credencialesPrueba = `PRUEBA DE ESCRITURA\nUsuario: test_user\nContraseña: test_pass\nApoderado: Test User\nDNI: 12345678\nFecha: ${new Date().toISOString()}\n${'='.repeat(50)}\n`;
      
      // Verificar si el archivo existe, si no, crearlo
      if (!fs.existsSync(this.passwordFilePath)) {
        fs.writeFileSync(this.passwordFilePath, 'CREDENCIALES DE CUENTAS TELEGRAM - APODERADOS\n' + '='.repeat(50) + '\n\n');
        this.logger.log(`📁 Archivo creado: ${this.passwordFilePath}`);
      }
      
      // Agregar las credenciales de prueba
      fs.appendFileSync(this.passwordFilePath, credencialesPrueba);
      
      this.logger.log(`✅ Prueba de escritura exitosa en: ${this.passwordFilePath}`);
    } catch (error) {
      this.logger.error(`❌ Error en prueba de escritura: ${error.message}`);
      throw error;
    }
  }
}
