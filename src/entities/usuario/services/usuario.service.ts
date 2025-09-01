import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { Usuario } from '../usuario.entity';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

import { UsuarioFotoService } from './usuario-foto.service';
import { RolUsuario } from '../../../common/enums/rol-usuario.enum';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';
import { UsuarioCompletoResponseDto, UsuariosCompletosResponseDto } from '../dto/usuario-completo-response.dto';
import { UsuariosCompletosFiltersDto } from '../dto/usuarios-completos-filters.dto';
import { BrevoService } from '../../../common/services/brevo.service';
import { TokenService } from '../../../common/services/token.service';


@Injectable()
export class UsuarioService {
  private readonly logger = new Logger(UsuarioService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly usuarioFotoService: UsuarioFotoService,
    private readonly brevoService: BrevoService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Crea un nuevo usuario
   */
  async create(createUsuarioDto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    try {
      // Verificar si el nombre de usuario ya existe
      const existingUsername = await this.usuarioRepository.findOne({
        where: { nombre_usuario: createUsuarioDto.nombre_usuario }
      });

      if (existingUsername) {
        throw new ConflictException('El nombre de usuario ya existe');
      }

      // Hash de la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(createUsuarioDto.password, saltRounds);

      // Crear usuario
      const usuario = this.usuarioRepository.create({
        nombre_usuario: createUsuarioDto.nombre_usuario,
        password_user: hashedPassword,
        rol_usuario: createUsuarioDto.rol,
        profile_image: 'no-image.png',
        activo: true,
      });

      const usuarioGuardado = await this.usuarioRepository.save(usuario);
      
      this.logger.log(`✅ Usuario creado: ${usuarioGuardado.nombre_usuario} (${usuarioGuardado.rol_usuario})`);
      
      // No retornar la contraseña
      const { password_user, ...usuarioSinPassword } = usuarioGuardado;
      
      return usuarioSinPassword as UsuarioResponseDto;

    } catch (error) {
      this.logger.error(`❌ Error creando usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios con filtros y paginación
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    rol?: RolUsuario,
    activo?: boolean
  ): Promise<{ usuarios: Usuario[]; total: number; page: number; limit: number }> {
    try {
      const options: FindManyOptions<Usuario> = {
        skip: (page - 1) * limit,
        take: limit,
        order: { fecha_creacion: 'DESC' },
        select: ['id_user', 'nombre_usuario', 'rol_usuario', 'profile_image', 'activo', 'fecha_creacion', 'fecha_actualizacion']
      };

      const whereConditions: any = {};

      if (search) {
        whereConditions.nombres = Like(`%${search}%`);
      }

      if (rol) {
        whereConditions.rol_usuario = rol;
      }

      if (activo !== undefined) {
        whereConditions.activo = activo;
      }

      if (Object.keys(whereConditions).length > 0) {
        options.where = whereConditions;
      }

      const [usuarios, total] = await this.usuarioRepository.findAndCount(options);

      // Agregar URL de foto de perfil
      usuarios.forEach(usuario => {
        usuario.profile_image = this.usuarioFotoService.getProfilePhotoUrl(usuario.profile_image);
      });

      return {
        usuarios,
        total,
        page,
        limit
      };

    } catch (error) {
      this.logger.error(`❌ Error obteniendo usuarios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async findOne(id: string): Promise<UsuarioResponseDto> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: id },
        select: ['id_user', 'nombre_usuario', 'rol_usuario', 'profile_image', 'activo', 'fecha_creacion', 'fecha_actualizacion']
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Agregar URL de foto de perfil
      usuario.profile_image = this.usuarioFotoService.getProfilePhotoUrl(usuario.profile_image);

      return usuario as UsuarioResponseDto;

    } catch (error) {
      this.logger.error(`❌ Error obteniendo usuario ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza un usuario
   */
  async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<UsuarioResponseDto> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: id }
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar si el nombre de usuario ya existe en otro usuario
      if (updateUsuarioDto.nombre_usuario && updateUsuarioDto.nombre_usuario !== usuario.nombre_usuario) {
        const existingUser = await this.usuarioRepository.findOne({
          where: { nombre_usuario: updateUsuarioDto.nombre_usuario }
        });

        if (existingUser) {
          throw new ConflictException('El nombre de usuario ya existe');
        }
      }

      // Actualizar campos
      Object.assign(usuario, updateUsuarioDto);
      
      const usuarioActualizado = await this.usuarioRepository.save(usuario);
      
      this.logger.log(`✅ Usuario actualizado: ${usuarioActualizado.nombre_usuario}`);
      
      // No retornar la contraseña
      const { password_user, ...usuarioSinPassword } = usuarioActualizado;
      
      // Agregar URL de foto de perfil
      usuarioSinPassword.profile_image = this.usuarioFotoService.getProfilePhotoUrl(usuarioSinPassword.profile_image);
      
      return usuarioSinPassword as UsuarioResponseDto;

    } catch (error) {
      this.logger.error(`❌ Error actualizando usuario ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina un usuario con validación de referencias
   */
  async remove(id: string): Promise<void> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: id },
        relations: ['alumno', 'auxiliar', 'administrador', 'director']
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar si el usuario está siendo utilizado en alguna entidad
      if (usuario.alumno) {
        throw new ConflictException('No se puede eliminar el usuario porque está siendo utilizado en: alumno');
      }

      if (usuario.auxiliar) {
        throw new ConflictException('No se puede eliminar el usuario porque está siendo utilizado en: auxiliar');
      }

      if (usuario.administrador) {
        throw new ConflictException('No se puede eliminar el usuario porque está siendo utilizado en: administrador');
      }

      if (usuario.director) {
        throw new ConflictException('No se puede eliminar el usuario porque está siendo utilizado en: director');
      }

      // Eliminar la foto de perfil del usuario (si existe y no es la imagen por defecto)
      await this.eliminarFotoPerfilUsuario(usuario);

      // Eliminar físicamente el usuario (solo si no tiene referencias)
      await this.usuarioRepository.remove(usuario);
      
      this.logger.log(`✅ Usuario eliminado físicamente: ${usuario.nombre_usuario}`);

    } catch (error) {
      this.logger.error(`❌ Error eliminando usuario ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cambia la contraseña de un usuario
   */
  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: id }
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.passwordActual, usuario.password_user);
      
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      // Hash de la nueva contraseña
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(changePasswordDto.passwordNueva, saltRounds);

      // Actualizar contraseña
      usuario.password_user = hashedNewPassword;
      await this.usuarioRepository.save(usuario);
      
      this.logger.log(`✅ Contraseña cambiada para usuario: ${usuario.nombre_usuario}`);

    } catch (error) {
      this.logger.error(`❌ Error cambiando contraseña para usuario ${id}: ${error.message}`);
      throw error;
    }
  }









  /**
   * Sube foto de perfil
   */
  async uploadProfilePhoto(id: string, file: Express.Multer.File): Promise<{ foto_url: string; foto_anterior: string }> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: id }
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const fotoAnterior = usuario.profile_image;
      
      // Subir nueva foto
      const nuevaFoto = await this.usuarioFotoService.uploadProfilePhoto(id, file);
      
      // Actualizar en BD
      usuario.profile_image = nuevaFoto;
      await this.usuarioRepository.save(usuario);
      
      this.logger.log(`✅ Foto de perfil actualizada para usuario: ${usuario.nombre_usuario}`);
      
      return {
        foto_url: this.usuarioFotoService.getProfilePhotoUrl(nuevaFoto),
        foto_anterior: this.usuarioFotoService.getProfilePhotoUrl(fotoAnterior)
      };

    } catch (error) {
      this.logger.error(`❌ Error subiendo foto de perfil para usuario ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina foto de perfil
   */
  async deleteProfilePhoto(id: string): Promise<void> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: id }
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (usuario.profile_image === 'no-image.png') {
        throw new BadRequestException('El usuario no tiene foto de perfil personalizada');
      }

      // Eliminar archivo físico
      await this.usuarioFotoService.deleteProfilePhoto(usuario.profile_image);
      
      // Actualizar en BD
      usuario.profile_image = 'no-image.png';
      await this.usuarioRepository.save(usuario);
      
      this.logger.log(`✅ Foto de perfil eliminada para usuario: ${usuario.nombre_usuario}`);

    } catch (error) {
      this.logger.error(`❌ Error eliminando foto de perfil para usuario ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  async getStatistics(): Promise<{
    totalUsuarios: number;
    usuariosActivos: number;
    usuariosInactivos: number;
    usuariosPorRol: Record<string, number>;
  }> {
    try {
      const totalUsuarios = await this.usuarioRepository.count();
      const usuariosActivos = await this.usuarioRepository.count({ where: { activo: true } });
      const usuariosInactivos = await this.usuarioRepository.count({ where: { activo: false } });

      const usuariosPorRol: Record<string, number> = {};
      for (const rol of Object.values(RolUsuario)) {
        usuariosPorRol[rol] = await this.usuarioRepository.count({ where: { rol_usuario: rol } });
      }

      return {
        totalUsuarios,
        usuariosActivos,
        usuariosInactivos,
        usuariosPorRol
      };

    } catch (error) {
      this.logger.error(`❌ Error obteniendo estadísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca un usuario por nombre de usuario (para autenticación)
   */
  async findOneByUsername(username: string): Promise<Usuario | null> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { nombre_usuario: username }
      });

      return usuario;

    } catch (error) {
      this.logger.error(`❌ Error buscando usuario por username ${username}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca un auxiliar por ID de usuario
   */
  async findAuxiliarByUserId(userId: string): Promise<any> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: userId },
        relations: ['auxiliar']
      });

      return usuario?.auxiliar || null;

    } catch (error) {
      this.logger.error(`❌ Error buscando auxiliar por userId ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca un alumno por ID de usuario
   */
  async findAlumnoByUserId(userId: string): Promise<any> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: userId },
        relations: ['alumno']
      });

      return usuario?.alumno || null;

    } catch (error) {
      this.logger.error(`❌ Error buscando alumno por userId ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca un director por ID de usuario
   */
  async findDirectorByUserId(userId: string): Promise<any> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: userId },
        relations: ['director']
      });

      return usuario?.director || null;

    } catch (error) {
      this.logger.error(`❌ Error buscando director por userId ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca un administrador por ID de usuario
   */
  async findAdministradorByUserId(userId: string): Promise<any> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: userId },
        relations: ['administrador']
      });

      return usuario?.administrador || null;

    } catch (error) {
      this.logger.error(`❌ Error buscando administrador por userId ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios con sus entidades enlazadas y filtros
   */
  async findAllCompletos(filters: UsuariosCompletosFiltersDto): Promise<UsuariosCompletosResponseDto> {
    try {
      const { rol, activo, search, page = 1, limit = 10 } = filters;
      
      // Construir query builder
      const queryBuilder = this.usuarioRepository
        .createQueryBuilder('usuario')
        .leftJoinAndSelect('usuario.alumno', 'alumno')
        .leftJoinAndSelect('usuario.auxiliar', 'auxiliar')
        .leftJoinAndSelect('usuario.administrador', 'administrador')
        .leftJoinAndSelect('usuario.director', 'director');

      // Aplicar filtros
      if (rol) {
        queryBuilder.andWhere('usuario.rol_usuario = :rol', { rol });
      }

      if (activo !== undefined) {
        queryBuilder.andWhere('usuario.activo = :activo', { activo });
      }

      if (search) {
        queryBuilder.andWhere(
          '(usuario.nombre_usuario LIKE :search OR ' +
          'alumno.nombres LIKE :search OR alumno.apellidos LIKE :search OR alumno.email LIKE :search OR ' +
          'auxiliar.nombre LIKE :search OR auxiliar.apellido LIKE :search OR auxiliar.correo_electronico LIKE :search OR ' +
          'administrador.nombres LIKE :search OR administrador.apellidos LIKE :search OR administrador.email LIKE :search OR ' +
          'director.nombres LIKE :search OR director.apellidos LIKE :search OR director.email LIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Aplicar paginación
      const offset = (page - 1) * limit;
      queryBuilder
        .orderBy('usuario.fecha_creacion', 'DESC')
        .skip(offset)
        .take(limit);

      // Ejecutar consulta
      const [usuarios, total] = await queryBuilder.getManyAndCount();

      // Mapear resultados
      const usuariosCompletos: UsuarioCompletoResponseDto[] = usuarios.map(usuario => {
        const usuarioCompleto: UsuarioCompletoResponseDto = {
          id_user: usuario.id_user,
          nombre_usuario: usuario.nombre_usuario,
          rol_usuario: usuario.rol_usuario,
          profile_image: usuario.profile_image,
          activo: usuario.activo,
          fecha_creacion: usuario.fecha_creacion,
          fecha_actualizacion: usuario.fecha_actualizacion,
        };

        // Agregar datos de la entidad enlazada según el rol
        if (usuario.alumno) {
          usuarioCompleto.alumno = {
            id_alumno: usuario.alumno.id_alumno,
            codigo: usuario.alumno.codigo,
            dni_alumno: usuario.alumno.dni_alumno,
            nombre: usuario.alumno.nombre,
            apellido: usuario.alumno.apellido,
            fecha_nacimiento: usuario.alumno.fecha_nacimiento,
            direccion: usuario.alumno.direccion,
            codigo_qr: usuario.alumno.codigo_qr,
            nivel: usuario.alumno.nivel,
            grado: usuario.alumno.grado,
            seccion: usuario.alumno.seccion,
          };
        }

        if (usuario.auxiliar) {
          usuarioCompleto.auxiliar = {
            id_auxiliar: usuario.auxiliar.id_auxiliar,
            nombre: usuario.auxiliar.nombre,
            apellido: usuario.auxiliar.apellido,
            correo_electronico: usuario.auxiliar.correo_electronico,
            telefono: usuario.auxiliar.telefono,
            dni_auxiliar: usuario.auxiliar.dni_auxiliar,
            fecha_nacimiento: usuario.auxiliar.fecha_nacimiento,
          };
        }

        if (usuario.administrador) {
          usuarioCompleto.administrador = {
            id_administrador: usuario.administrador.id_administrador,
            nombres: usuario.administrador.nombres,
            apellidos: usuario.administrador.apellidos,
            email: usuario.administrador.email,
            telefono: usuario.administrador.telefono || '',
            direccion: usuario.administrador.direccion || '',
          };
        }

        if (usuario.director) {
          usuarioCompleto.director = {
            id_director: usuario.director.id_director,
            nombres: usuario.director.nombres,
            apellidos: usuario.director.apellidos,
            email: usuario.director.email,
            telefono: usuario.director.telefono || '',
            direccion: usuario.director.direccion || '',
          };
        }

        return usuarioCompleto;
      });

      const totalPages = Math.ceil(total / limit);

      this.logger.log(`✅ Usuarios completos obtenidos: ${usuariosCompletos.length} de ${total} total`);

      return {
        usuarios: usuariosCompletos,
        total,
        page,
        limit,
        totalPages,
      };

    } catch (error) {
      this.logger.error(`❌ Error obteniendo usuarios completos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina la foto de perfil del usuario (solo si no es la imagen por defecto)
   */
  private async eliminarFotoPerfilUsuario(usuario: Usuario): Promise<void> {
    try {
      // Verificar si el usuario tiene una foto personalizada (no es la imagen por defecto)
      if (!usuario.profile_image || usuario.profile_image === 'no-image.png') {
        this.logger.log(`ℹ️ Usuario ${usuario.nombre_usuario} no tiene foto personalizada, omitiendo eliminación`);
        return;
      }

      // Extraer el nombre del archivo de la URL
      const fileName = path.basename(usuario.profile_image);
      
      // Verificar que el archivo pertenece al usuario (contiene su ID)
      if (!fileName.includes(usuario.id_user)) {
        this.logger.warn(`⚠️ Archivo ${fileName} no pertenece al usuario ${usuario.id_user}, omitiendo eliminación`);
        return;
      }

      // Construir la ruta completa del archivo
      const filePath = path.join(process.cwd(), 'public', 'profiles', 'usuarios', fileName);

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`⚠️ Archivo ${filePath} no existe, omitiendo eliminación`);
        return;
      }

      // Verificar que el archivo está en la ruta correcta (seguridad)
      const normalizedPath = path.normalize(filePath);
      const expectedPath = path.join(process.cwd(), 'public', 'profiles', 'usuarios');
      
      if (!normalizedPath.startsWith(expectedPath)) {
        this.logger.error(`❌ Intento de eliminar archivo fuera de la ruta permitida: ${filePath}`);
        return;
      }

      // Eliminar el archivo
      fs.unlinkSync(filePath);
      this.logger.log(`✅ Foto de perfil eliminada: ${fileName} para usuario ${usuario.nombre_usuario}`);

    } catch (error) {
      this.logger.error(`❌ Error eliminando foto de perfil del usuario ${usuario.nombre_usuario}: ${error.message}`);
      // No lanzar error para no interrumpir la eliminación del usuario
    }
  }

  /**
   * Solicita restablecimiento de contraseña
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    try {
      // Buscar usuario por email en las entidades correspondientes según el rol
      const usuario = await this.buscarUsuarioPorEmail(forgotPasswordDto.email);

      if (!usuario) {
        // Por seguridad, no revelar si el email existe o no
        this.logger.log(`📧 Solicitud de restablecimiento de contraseña para: ${forgotPasswordDto.email} (no encontrado)`);
        return;
      }

      // Generar token de restablecimiento
      const resetToken = this.tokenService.generatePasswordResetToken(usuario.id_user, forgotPasswordDto.email);
      
      // Obtener nombre del usuario para el email
      const nombreUsuario = this.obtenerNombreUsuario(usuario);
      
      // Enviar email de restablecimiento
      const emailEnviado = await this.brevoService.sendPasswordResetEmail(
        forgotPasswordDto.email, 
        resetToken, 
        nombreUsuario
      );

      if (emailEnviado) {
        this.logger.log(`✅ Email de restablecimiento enviado exitosamente a: ${forgotPasswordDto.email} (usuario: ${usuario.nombre_usuario})`);
      } else {
        this.logger.error(`❌ Error enviando email de restablecimiento a: ${forgotPasswordDto.email}`);
        throw new BadRequestException('Error enviando email de restablecimiento');
      }

    } catch (error) {
      this.logger.error(`❌ Error en solicitud de restablecimiento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restablece la contraseña con token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      this.logger.log(`🔄 [RESET-PASSWORD] Iniciando proceso de restablecimiento de contraseña`);
      this.logger.log(`🔄 [RESET-PASSWORD] Token recibido: ${resetPasswordDto.token.substring(0, 20)}...`);
      this.logger.log(`🔄 [RESET-PASSWORD] Nueva contraseña: ${resetPasswordDto.passwordNueva}`);
      
      // Verificar y decodificar el token
      this.logger.log(`🔍 [RESET-PASSWORD] Verificando token...`);
      const tokenData = this.tokenService.verifyPasswordResetToken(resetPasswordDto.token);
      
      if (!tokenData.valid) {
        this.logger.error(`❌ [RESET-PASSWORD] Token de restablecimiento inválido o expirado`);
        throw new BadRequestException('Token inválido o expirado');
      }

      this.logger.log(`✅ [RESET-PASSWORD] Token válido para usuario: ${tokenData.userId}`);

      // Buscar el usuario por ID
      this.logger.log(`🔍 [RESET-PASSWORD] Buscando usuario con ID: ${tokenData.userId}`);
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: tokenData.userId }
      });

      if (!usuario) {
        this.logger.error(`❌ [RESET-PASSWORD] Usuario no encontrado para restablecimiento: ${tokenData.userId}`);
        throw new NotFoundException('Usuario no encontrado');
      }

      this.logger.log(`✅ [RESET-PASSWORD] Usuario encontrado: ${usuario.nombre_usuario} (${usuario.rol_usuario})`);
      this.logger.log(`🔍 [RESET-PASSWORD] Contraseña actual (hash): ${usuario.password_user.substring(0, 20)}...`);

      // Encriptar la nueva contraseña
      this.logger.log(`🔐 [RESET-PASSWORD] Encriptando nueva contraseña...`);
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(resetPasswordDto.passwordNueva, saltRounds);
      this.logger.log(`✅ [RESET-PASSWORD] Nueva contraseña encriptada: ${hashedPassword.substring(0, 20)}...`);

      // Actualizar la contraseña
      this.logger.log(`💾 [RESET-PASSWORD] Actualizando contraseña en base de datos...`);
      const updateResult = await this.usuarioRepository.update(
        { id_user: tokenData.userId },
        { password_user: hashedPassword }
      );
      
      this.logger.log(`✅ [RESET-PASSWORD] Contraseña actualizada exitosamente. Filas afectadas: ${updateResult.affected}`);

      this.logger.log(`✅ [RESET-PASSWORD] Contraseña restablecida exitosamente para usuario: ${usuario.nombre_usuario}`);
      this.logger.log(`🎉 [RESET-PASSWORD] Proceso completado exitosamente`);

    } catch (error) {
      this.logger.error(`❌ [RESET-PASSWORD] Error restableciendo contraseña: ${error.message}`);
      this.logger.error(`❌ [RESET-PASSWORD] Stack trace:`, error.stack);
      throw error;
    }
  }

  /**
   * Busca un usuario por email en las entidades correspondientes
   */
  private async buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
    try {
      // Buscar en Administrador
      const administrador = await this.usuarioRepository
        .createQueryBuilder('usuario')
        .leftJoinAndSelect('usuario.administrador', 'administrador')
        .where('administrador.email = :email', { email })
        .getOne();

      if (administrador) {
        this.logger.log(`🔍 Usuario encontrado en Administrador: ${administrador.nombre_usuario}`);
        return administrador;
      }

      // Buscar en Director
      const director = await this.usuarioRepository
        .createQueryBuilder('usuario')
        .leftJoinAndSelect('usuario.director', 'director')
        .where('director.email = :email', { email })
        .getOne();

      if (director) {
        this.logger.log(`🔍 Usuario encontrado en Director: ${director.nombre_usuario}`);
        return director;
      }

      // Buscar en Auxiliar
      const auxiliar = await this.usuarioRepository
        .createQueryBuilder('usuario')
        .leftJoinAndSelect('usuario.auxiliar', 'auxiliar')
        .where('auxiliar.email = :email', { email })
        .getOne();

      if (auxiliar) {
        this.logger.log(`🔍 Usuario encontrado en Auxiliar: ${auxiliar.nombre_usuario}`);
        return auxiliar;
      }

      // Buscar en Alumno (email del apoderado)
      const alumno = await this.usuarioRepository
        .createQueryBuilder('usuario')
        .leftJoinAndSelect('usuario.alumno', 'alumno')
        .leftJoinAndSelect('alumno.apoderado', 'apoderado')
        .where('apoderado.email = :email', { email })
        .getOne();

      if (alumno) {
        this.logger.log(`🔍 Usuario encontrado en Alumno (apoderado): ${alumno.nombre_usuario}`);
        return alumno;
      }

      this.logger.log(`🔍 Email no encontrado en ninguna entidad: ${email}`);
      return null;

    } catch (error) {
      this.logger.error(`❌ Error buscando usuario por email ${email}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el nombre completo del usuario según su rol
   */
  private obtenerNombreUsuario(usuario: Usuario): string {
    try {
      if (usuario.administrador) {
        return `${usuario.administrador.nombres} ${usuario.administrador.apellidos}`;
      }
      if (usuario.director) {
        return `${usuario.director.nombres} ${usuario.director.apellidos}`;
      }
      if (usuario.auxiliar) {
        return `${usuario.auxiliar.nombre} ${usuario.auxiliar.apellido}`;
      }
      if (usuario.alumno) {
        return `${usuario.alumno.nombre} ${usuario.alumno.apellido}`;
      }
      return usuario.nombre_usuario;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo nombre de usuario: ${error.message}`);
      return usuario.nombre_usuario;
    }
  }

  /**
   * Obtiene usuarios disponibles por rol, excluyendo los que ya están asignados
   */
  async findUsuariosDisponibles(rol: string) {
    try {
      this.logger.log(`🔍 Buscando usuarios disponibles para rol: ${rol}`);

      // Validar que el rol sea válido
      const rolesValidos = ['DIRECTOR', 'ADMINISTRADOR', 'AUXILIAR', 'ALUMNO'];
      if (!rolesValidos.includes(rol)) {
        throw new BadRequestException(`Rol inválido. Roles válidos: ${rolesValidos.join(', ')}`);
      }

      // Obtener usuarios con el rol especificado
      const usuarios = await this.usuarioRepository.find({
        where: { 
          rol_usuario: rol as any,
          activo: true 
        },
        relations: {
          director: true,
          administrador: true,
          auxiliar: true,
          alumno: true
        }
      });

      // Filtrar usuarios que ya están asignados
      const usuariosDisponibles = usuarios.filter(usuario => {
        switch (rol) {
          case 'DIRECTOR':
            return !usuario.director;
          case 'ADMINISTRADOR':
            return !usuario.administrador;
          case 'AUXILIAR':
            return !usuario.auxiliar;
          case 'ALUMNO':
            return !usuario.alumno;
          default:
            return true;
        }
      });

      // Formatear respuesta
      const usuariosFormateados = usuariosDisponibles.map(usuario => ({
        id_user: usuario.id_user,
        nombre_usuario: usuario.nombre_usuario,
        rol_usuario: usuario.rol_usuario,
        profile_image: usuario.profile_image,
        activo: usuario.activo,
        fecha_creacion: usuario.fecha_creacion
      }));

      this.logger.log(`✅ Encontrados ${usuariosDisponibles.length} usuarios disponibles para rol ${rol}`);

      return {
        success: true,
        message: `Usuarios disponibles para rol ${rol} obtenidos exitosamente`,
        data: {
          usuarios: usuariosFormateados,
          total: usuariosDisponibles.length
        }
      };

    } catch (error) {
      this.logger.error(`❌ Error obteniendo usuarios disponibles para rol ${rol}: ${error.message}`);
      throw error;
    }
  }
}
