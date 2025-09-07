import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class UsuarioFotoService {
  private readonly logger = new Logger(UsuarioFotoService.name);
  private readonly uploadPath: string;
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  private readonly maxDimensions = { width: 2000, height: 2000 };
  private readonly resizeDimensions = { width: 300, height: 300 };

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'public', 'profiles', 'usuarios');
    this.ensureUploadDirectory();
  }

  /**
   * Asegura que el directorio de upload existe
   */
  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  /**
   * Valida el archivo subido
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`El archivo es demasiado grande. Máximo permitido: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de archivo no permitido. Tipos permitidos: ${this.allowedMimeTypes.join(', ')}`);
    }
  }

  /**
   * Genera un nombre único para el archivo
   */
  private generateFileName(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const extension = path.extname(originalName);
    return `user_${userId}_${timestamp}${extension}`;
  }

  /**
   * Procesa y redimensiona la imagen
   */
  private async processImage(inputPath: string, outputPath: string): Promise<void> {
    try {
      
      // Verificar que el archivo de entrada existe
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Archivo de entrada no encontrado: ${inputPath}`);
      }
      
      // Verificar que el directorio de salida existe
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      await sharp(inputPath)
        .resize(this.resizeDimensions.width, this.resizeDimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
      
    } catch (error) {
      throw new BadRequestException(`Error procesando la imagen: ${error.message}`);
    }
  }

  /**
   * Sube y procesa la foto de perfil del usuario
   */
  async uploadProfilePhoto(userId: string, file: Express.Multer.File): Promise<string> {
    try {
      
      this.validateFile(file);
      
      const fileName = this.generateFileName(userId, file.originalname);
      const filePath = path.join(this.uploadPath, fileName);
      
      
      // Si el archivo no tiene ruta temporal, crear un archivo temporal
      let tempFilePath = file.path;
      if (!tempFilePath || !fs.existsSync(tempFilePath)) {
        tempFilePath = path.join(this.uploadPath, `temp_${Date.now()}_${file.originalname}`);
        fs.writeFileSync(tempFilePath, file.buffer);
      }
      
      // Procesar y redimensionar la imagen
      await this.processImage(tempFilePath, filePath);
      
      // Eliminar archivo temporal
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      const relativePath = `usuarios/${fileName}`;
      
      return relativePath;
      
    } catch (error) {
      
      // Limpiar archivo temporal en caso de error
      if (file && file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
        }
      }
      throw error;
    }
  }

  /**
   * Obtiene la ruta de la foto de perfil del usuario
   */
  getProfilePhotoPath(profileImage: string): string {
    if (!profileImage || profileImage === 'no-image.png') {
      return 'no-image.png';
    }
    
    const fullPath = path.join(this.uploadPath, path.basename(profileImage));
    
    if (fs.existsSync(fullPath)) {
      return profileImage;
    } else {
      return 'no-image.png';
    }
  }

  /**
   * Elimina la foto de perfil del usuario
   */
  async deleteProfilePhoto(profileImage: string): Promise<void> {
    if (!profileImage || profileImage === 'no-image.png') {
      return;
    }
    
    const fileName = path.basename(profileImage);
    const filePath = path.join(this.uploadPath, fileName);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      throw new BadRequestException('Error eliminando la foto de perfil');
    }
  }

  /**
   * Obtiene la URL completa de la foto de perfil
   */
  getProfilePhotoUrl(profileImage: string): string {
    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    const photoPath = this.getProfilePhotoPath(profileImage);
    return `${baseUrl}/profiles/${photoPath}`;
  }
}
