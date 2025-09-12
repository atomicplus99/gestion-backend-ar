import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BackupService } from '../services/backup.service';
import * as fs from 'fs';

@ApiTags('Respaldo de Base de Datos')
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Crear respaldo de la base de datos',
    description: 'Crea un respaldo completo de la base de datos MySQL usando mysqldump. Solo disponible para administradores y directores.'
  })
  @ApiResponse({
    status: 200,
    description: 'Respaldo creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Respaldo de la base de datos creado exitosamente' },
        data: {
          type: 'object',
          properties: {
            filename: { type: 'string', example: 'backup_gestion_academica_ar_2025-09-12T16-30-00-000Z.sql' },
            filepath: { type: 'string', example: '/path/to/backups/backup_gestion_academica_ar_2025-09-12T16-30-00-000Z.sql' },
            size: { type: 'string', example: '2.45 MB' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la creación del respaldo'
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado'
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes'
  })
  async createBackup() {
    const result = await this.backupService.createBackup();
    return {
      success: result.success,
      message: result.message,
      data: {
        filename: result.filename,
        filepath: result.filepath,
        size: result.size
      }
    };
  }

  @Get('list')
  @ApiOperation({
    summary: 'Listar respaldos disponibles',
    description: 'Lista todos los respaldos de base de datos disponibles, ordenados por fecha de creación (más recientes primero).'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de respaldos obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            backups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string', example: 'backup_gestion_academica_ar_2025-09-12T16-30-00-000Z.sql' },
                  filepath: { type: 'string', example: '/path/to/backups/backup_gestion_academica_ar_2025-09-12T16-30-00-000Z.sql' },
                  size: { type: 'string', example: '2.45 MB' },
                  created: { type: 'string', format: 'date-time', example: '2025-09-12T16:30:00.000Z' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado'
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes'
  })
  async listBackups() {
    const result = await this.backupService.listBackups();
    return {
      success: result.success,
      data: {
        backups: result.backups
      }
    };
  }

  @Get('download/:filename')
  @ApiOperation({
    summary: 'Descargar respaldo',
    description: 'Descarga un archivo de respaldo específico. El archivo se descarga directamente al navegador.'
  })
  @ApiParam({
    name: 'filename',
    description: 'Nombre del archivo de respaldo a descargar',
    example: 'backup_gestion_academica_ar_2025-09-12T16-30-00-000Z.sql'
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo descargado exitosamente',
    content: {
      'application/sql': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo no encontrado o tipo inválido'
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado'
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes'
  })
  async downloadBackup(
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.backupService.downloadBackup(filename);
      
      if (!result.success || !result.filepath) {
        throw new NotFoundException('Archivo no encontrado');
      }

      // Verificar que el archivo existe
      if (!fs.existsSync(result.filepath)) {
        throw new NotFoundException('Archivo no encontrado en el servidor');
      }

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Enviar el archivo
      const fileStream = fs.createReadStream(result.filepath);
      fileStream.pipe(res);

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error descargando archivo: ${error.message}`);
    }
  }

  @Delete(':filename')
  @ApiOperation({
    summary: 'Eliminar respaldo',
    description: 'Elimina un archivo de respaldo específico. Solo disponible para administradores.'
  })
  @ApiParam({
    name: 'filename',
    description: 'Nombre del archivo de respaldo a eliminar',
    example: 'backup_gestion_academica_ar_2025-09-12T16-30-00-000Z.sql'
  })
  @ApiResponse({
    status: 200,
    description: 'Respaldo eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Respaldo backup_gestion_academica_ar_2025-09-12T16-30-00-000Z.sql eliminado exitosamente' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo no encontrado o tipo inválido'
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado'
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes (solo administradores)'
  })
  async deleteBackup(@Param('filename') filename: string) {
    const result = await this.backupService.deleteBackup(filename);
    return {
      success: result.success,
      message: result.message
    };
  }
}
