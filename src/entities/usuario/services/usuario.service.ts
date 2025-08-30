import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuario.entity';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UsuarioFotoService } from './usuario-foto.service';
import { RolUsuario } from '../../../common/enums/rol-usuario.enum';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';

@Injectable()
export class UsuarioService {
  private readonly logger = new Logger(UsuarioService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly usuarioFotoService: UsuarioFotoService,
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
   * Elimina un usuario (soft delete)
   */
  async remove(id: string): Promise<void> {
    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: id }
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Eliminar físicamente el usuario
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

      // TODO: Implementar lógica de envío de email con token
      // Por ahora solo log
      this.logger.log(`📧 Token de restablecimiento generado para: ${forgotPasswordDto.email} (usuario: ${usuario.nombre_usuario})`);

    } catch (error) {
      this.logger.error(`❌ Error en solicitud de restablecimiento: ${error.message}`);
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
   * Restablece la contraseña con token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      // TODO: Implementar validación de token
      // Por ahora solo log
      this.logger.log(`🔄 Restablecimiento de contraseña con token: ${resetPasswordDto.token}`);

    } catch (error) {
      this.logger.error(`❌ Error restableciendo contraseña: ${error.message}`);
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
}
