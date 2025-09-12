import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor() {
    this.ensureBackupDirectory();
  }

  /**
   * Asegura que el directorio de respaldos existe
   */
  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`📁 Directorio de respaldos creado: ${this.backupDir}`);
    }
  }

  /**
   * Crea un respaldo de la base de datos
   */
  async createBackup(): Promise<{
    success: boolean;
    message: string;
    filename?: string;
    filepath?: string;
    size?: string;
  }> {
    try {
      this.logger.log('🔄 Iniciando respaldo de la base de datos...');

      // Obtener variables de entorno
      const dbHost = process.env.DB_HOST || 'localhost';
      const dbPort = process.env.DB_PORT || '3306';
      const dbUsername = process.env.DB_USERNAME || 'root';
      const dbPassword = process.env.DB_PASSWORD || '';
      const dbName = process.env.DB_NAME || 'gestion_academica_ar';

      // Validar que las variables estén configuradas
      if (!dbName) {
        throw new BadRequestException('Nombre de la base de datos no configurado');
      }

      // Generar nombre del archivo con timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${dbName}_${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      // Construir comando mysqldump
      let command = `mysqldump`;
      
      // Agregar parámetros de conexión
      command += ` --host=${dbHost}`;
      command += ` --port=${dbPort}`;
      command += ` --user=${dbUsername}`;
      
      if (dbPassword) {
        command += ` --password=${dbPassword}`;
      }

      // Agregar opciones de respaldo
      command += ` --single-transaction`; // Para InnoDB
      command += ` --routines`; // Incluir procedimientos almacenados
      command += ` --triggers`; // Incluir triggers
      command += ` --events`; // Incluir eventos
      command += ` --add-drop-database`; // Agregar DROP DATABASE
      command += ` --add-drop-table`; // Agregar DROP TABLE
      command += ` --complete-insert`; // INSERT completos
      command += ` --extended-insert`; // INSERT extendidos
      command += ` --lock-tables=false`; // No bloquear tablas
      command += ` --databases ${dbName}`; // Base de datos específica
      command += ` > "${filepath}"`;

      this.logger.log(`📋 Ejecutando comando: mysqldump [parámetros ocultos] > ${filename}`);

      // Ejecutar el comando
      await execAsync(command);

      // Verificar que el archivo se creó
      if (!fs.existsSync(filepath)) {
        throw new BadRequestException('Error: El archivo de respaldo no se creó');
      }

      // Obtener información del archivo
      const stats = fs.statSync(filepath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      this.logger.log(`✅ Respaldo creado exitosamente: ${filename} (${fileSizeInMB} MB)`);

      return {
        success: true,
        message: 'Respaldo de la base de datos creado exitosamente',
        filename,
        filepath,
        size: `${fileSizeInMB} MB`
      };

    } catch (error) {
      this.logger.error(`❌ Error creando respaldo:`, error.message);
      
      if (error.message.includes('mysqldump')) {
        throw new BadRequestException('Error: mysqldump no está disponible. Asegúrate de que MySQL esté instalado y en el PATH.');
      }
      
      throw new BadRequestException(`Error creando respaldo: ${error.message}`);
    }
  }

  /**
   * Lista todos los respaldos disponibles
   */
  async listBackups(): Promise<{
    success: boolean;
    backups: Array<{
      filename: string;
      filepath: string;
      size: string;
      created: Date;
    }>;
  }> {
    try {
      this.logger.log('📋 Listando respaldos disponibles...');

      if (!fs.existsSync(this.backupDir)) {
        return {
          success: true,
          backups: []
        };
      }

      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => {
          const filepath = path.join(this.backupDir, file);
          const stats = fs.statSync(filepath);
          const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

          return {
            filename: file,
            filepath,
            size: `${sizeInMB} MB`,
            created: stats.birthtime
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime()); // Más recientes primero

      this.logger.log(`📋 Encontrados ${files.length} respaldos`);

      return {
        success: true,
        backups: files
      };

    } catch (error) {
      this.logger.error(`❌ Error listando respaldos:`, error.message);
      throw new BadRequestException(`Error listando respaldos: ${error.message}`);
    }
  }

  /**
   * Descarga un respaldo específico
   */
  async downloadBackup(filename: string): Promise<{
    success: boolean;
    filepath?: string;
    message?: string;
  }> {
    try {
      this.logger.log(`📥 Descargando respaldo: ${filename}`);

      const filepath = path.join(this.backupDir, filename);

      // Verificar que el archivo existe
      if (!fs.existsSync(filepath)) {
        throw new BadRequestException('Archivo de respaldo no encontrado');
      }

      // Verificar que es un archivo .sql
      if (!filename.endsWith('.sql')) {
        throw new BadRequestException('Tipo de archivo no válido');
      }

      this.logger.log(`✅ Respaldo disponible para descarga: ${filename}`);

      return {
        success: true,
        filepath
      };

    } catch (error) {
      this.logger.error(`❌ Error descargando respaldo:`, error.message);
      throw new BadRequestException(`Error descargando respaldo: ${error.message}`);
    }
  }

  /**
   * Elimina un respaldo específico
   */
  async deleteBackup(filename: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.log(`🗑️ Eliminando respaldo: ${filename}`);

      const filepath = path.join(this.backupDir, filename);

      // Verificar que el archivo existe
      if (!fs.existsSync(filepath)) {
        throw new BadRequestException('Archivo de respaldo no encontrado');
      }

      // Verificar que es un archivo .sql
      if (!filename.endsWith('.sql')) {
        throw new BadRequestException('Tipo de archivo no válido');
      }

      // Eliminar el archivo
      fs.unlinkSync(filepath);

      this.logger.log(`✅ Respaldo eliminado: ${filename}`);

      return {
        success: true,
        message: `Respaldo ${filename} eliminado exitosamente`
      };

    } catch (error) {
      this.logger.error(`❌ Error eliminando respaldo:`, error.message);
      throw new BadRequestException(`Error eliminando respaldo: ${error.message}`);
    }
  }
}
