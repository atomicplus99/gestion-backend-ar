import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Administrador } from '../administrador.entity';
import { CreateAdministradorDto } from '../dto/create-administrador.dto';
import { UpdateAdministradorDto } from '../dto/update-administrador.dto';
import { AdministradorResponseDto } from '../dto/administrador-response.dto';
import { UsuarioService } from '../../usuario/services/usuario.service';

@Injectable()
export class AdministradorService {
  private readonly logger = new Logger(AdministradorService.name);

  constructor(
    @InjectRepository(Administrador)
    private readonly administradorRepository: Repository<Administrador>,
    private readonly usuarioService: UsuarioService,
  ) {}

  /**
   * Crea un nuevo administrador
   */
  async create(createAdministradorDto: CreateAdministradorDto): Promise<AdministradorResponseDto> {
    try {
      // Verificar si el email ya existe
      const existingEmail = await this.administradorRepository.findOne({
        where: { email: createAdministradorDto.email }
      });

      if (existingEmail) {
        throw new ConflictException('El email ya está registrado');
      }

      // Crear administrador
      const administrador = this.administradorRepository.create(createAdministradorDto);
      const administradorGuardado = await this.administradorRepository.save(administrador);
      
      this.logger.log(`✅ Administrador creado: ${administradorGuardado.nombres} ${administradorGuardado.apellidos}`);
      
      return administradorGuardado as AdministradorResponseDto;

    } catch (error) {
      this.logger.error(`❌ Error creando administrador: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todos los administradores con filtros y paginación
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ administradores: Administrador[]; total: number; page: number; limit: number }> {
    try {
      const options: FindManyOptions<Administrador> = {
        skip: (page - 1) * limit,
        take: limit,
        order: { nombres: 'ASC' },
        relations: ['usuario']
      };

      const whereConditions: any = {};

      if (search) {
        whereConditions.nombres = Like(`%${search}%`);
      }

      if (Object.keys(whereConditions).length > 0) {
        options.where = whereConditions;
      }

      const [administradores, total] = await this.administradorRepository.findAndCount(options);

      return {
        administradores,
        total,
        page,
        limit
      };

    } catch (error) {
      this.logger.error(`❌ Error obteniendo administradores: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene un administrador por ID
   */
  async findOne(id: string): Promise<AdministradorResponseDto> {
    try {
      const administrador = await this.administradorRepository.findOne({
        where: { id_administrador: id },
        relations: ['usuario']
      });

      if (!administrador) {
        throw new NotFoundException('Administrador no encontrado');
      }

      return administrador as AdministradorResponseDto;

    } catch (error) {
      this.logger.error(`❌ Error obteniendo administrador ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza un administrador
   */
  async update(id: string, updateAdministradorDto: UpdateAdministradorDto): Promise<AdministradorResponseDto> {
    try {
      const administrador = await this.administradorRepository.findOne({
        where: { id_administrador: id }
      });

      if (!administrador) {
        throw new NotFoundException('Administrador no encontrado');
      }

      // Verificar si el email ya existe en otro administrador
      if (updateAdministradorDto.email && updateAdministradorDto.email !== administrador.email) {
        const existingAdmin = await this.administradorRepository.findOne({
          where: { email: updateAdministradorDto.email }
        });

        if (existingAdmin) {
          throw new ConflictException('El email ya está registrado');
        }
      }

      // Actualizar campos
      Object.assign(administrador, updateAdministradorDto);
      
      const administradorActualizado = await this.administradorRepository.save(administrador);
      
      this.logger.log(`✅ Administrador actualizado: ${administradorActualizado.nombres} ${administradorActualizado.apellidos}`);
      
      return administradorActualizado as AdministradorResponseDto;

    } catch (error) {
      this.logger.error(`❌ Error actualizando administrador ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina un administrador y su usuario asignado si lo tiene
   */
  async remove(id: string): Promise<void> {
    try {
      const administrador = await this.administradorRepository.findOne({
        where: { id_administrador: id },
        relations: ['usuario']
      });

      if (!administrador) {
        throw new NotFoundException('Administrador no encontrado');
      }

      // Guardar referencia al usuario antes de eliminar el administrador
      const usuarioAEliminar = administrador.usuario;

      // Eliminar PRIMERO el administrador
      await this.administradorRepository.remove(administrador);
      
      // DESPUÉS eliminar el usuario (si existe)
      if (usuarioAEliminar) {
        await this.usuarioService.remove(usuarioAEliminar.id_user);
        this.logger.log(`✅ Usuario eliminado: ${usuarioAEliminar.nombre_usuario}`);
      }
      
      this.logger.log(`✅ Administrador eliminado: ${administrador.nombres} ${administrador.apellidos}`);

    } catch (error) {
      this.logger.error(`❌ Error eliminando administrador ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de administradores
   */
  async getStatistics(): Promise<{
    totalAdministradores: number;
  }> {
    try {
      const totalAdministradores = await this.administradorRepository.count();

      return {
        totalAdministradores
      };

    } catch (error) {
      this.logger.error(`❌ Error obteniendo estadísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Asigna un usuario existente a un administrador
   */
  async asignarUsuario(id_user: string, datos_personales: CreateAdministradorDto): Promise<AdministradorResponseDto> {
    try {
      // Verificar si el email ya existe
      const existingEmail = await this.administradorRepository.findOne({
        where: { email: datos_personales.email }
      });

      if (existingEmail) {
        throw new ConflictException('El email ya está registrado');
      }

      // Verificar si el usuario ya tiene un administrador asignado
      const existingAdmin = await this.administradorRepository.findOne({
        where: { usuario: { id_user } }
      });

      if (existingAdmin) {
        throw new ConflictException('El usuario ya tiene un administrador asignado');
      }

      // Crear administrador
      const administrador = this.administradorRepository.create({
        ...datos_personales,
        usuario: { id_user } as any
      });

      const administradorGuardado = await this.administradorRepository.save(administrador);
      this.logger.log(`Usuario ${id_user} asignado a administrador: ${administradorGuardado.id_administrador}`);

      return {
        id_administrador: administradorGuardado.id_administrador,
        nombres: administradorGuardado.nombres,
        apellidos: administradorGuardado.apellidos,
        email: administradorGuardado.email,
        telefono: administradorGuardado.telefono,
        direccion: administradorGuardado.direccion,
        id_user: administradorGuardado.usuario?.id_user
      };
    } catch (error) {
      this.logger.error(`Error asignando usuario a administrador: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cambia el usuario asignado a un administrador
   */
  async cambiarUsuario(id_administrador: string, nuevo_id_user: string): Promise<AdministradorResponseDto> {
    try {
      // Verificar que el administrador existe
      const administrador = await this.administradorRepository.findOne({
        where: { id_administrador }
      });

      if (!administrador) {
        throw new NotFoundException('Administrador no encontrado');
      }

      // Verificar que el nuevo usuario existe
      const usuario = await this.usuarioService.findOne(nuevo_id_user);
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Actualizar el usuario asignado
      await this.administradorRepository.update(
        { id_administrador },
        { usuario: { id_user: nuevo_id_user } as any }
      );

      // Obtener el administrador actualizado
      const administradorActualizado = await this.administradorRepository.findOne({
        where: { id_administrador },
        relations: ['usuario']
      });

      if (!administradorActualizado) {
        throw new NotFoundException('Administrador no encontrado después de la actualización');
      }

      this.logger.log(`Usuario del administrador ${id_administrador} cambiado a ${nuevo_id_user}`);

      return {
        id_administrador: administradorActualizado.id_administrador,
        nombres: administradorActualizado.nombres,
        apellidos: administradorActualizado.apellidos,
        email: administradorActualizado.email,
        telefono: administradorActualizado.telefono,
        direccion: administradorActualizado.direccion,
        id_user: administradorActualizado.usuario?.id_user
      };
    } catch (error) {
      this.logger.error(`Error cambiando usuario del administrador: ${error.message}`);
      throw error;
    }
  }
}
