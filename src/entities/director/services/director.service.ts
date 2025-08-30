import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Director } from '../director.entity';
import { CreateDirectorDto } from '../dto/create-director.dto';
import { UpdateDirectorDto } from '../dto/update-director.dto';
import { DirectorResponseDto } from '../dto/director-response.dto';
import { UsuarioService } from '../../usuario/services/usuario.service';
import { Administrador } from '../../administrador/administrador.entity';
import { Auxiliar } from '../../auxiliar/auxiliar.entity';

@Injectable()
export class DirectorService {
  private readonly logger = new Logger(DirectorService.name);

  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Administrador)
    private readonly administradorRepository: Repository<Administrador>,
    @InjectRepository(Auxiliar)
    private readonly auxiliarRepository: Repository<Auxiliar>,
    private readonly usuarioService: UsuarioService,
  ) {}

  /**
   * Crea un nuevo director
   */
  async create(createDirectorDto: CreateDirectorDto): Promise<DirectorResponseDto> {
    try {
      // Verificar si el email ya existe
      const existingEmail = await this.directorRepository.findOne({
        where: { email: createDirectorDto.email }
      });

      if (existingEmail) {
        throw new ConflictException('El email ya está registrado');
      }

      // Crear director
      const director = this.directorRepository.create(createDirectorDto);
      const directorGuardado = await this.directorRepository.save(director);
      
      this.logger.log(`✅ Director creado: ${directorGuardado.nombres} ${directorGuardado.apellidos}`);
      
      return directorGuardado as DirectorResponseDto;

    } catch (error) {
      this.logger.error(`❌ Error creando director: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todos los directores con filtros y paginación
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ directores: Director[]; total: number; page: number; limit: number }> {
    try {
      const options: FindManyOptions<Director> = {
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

      const [directores, total] = await this.directorRepository.findAndCount(options);

      return {
        directores,
        total,
        page,
        limit
      };

    } catch (error) {
      this.logger.error(`❌ Error obteniendo directores: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene un director por ID
   */
  async findOne(id: string): Promise<DirectorResponseDto> {
    try {
      const director = await this.directorRepository.findOne({
        where: { id_director: id },
        relations: ['usuario']
      });

      if (!director) {
        throw new NotFoundException('Director no encontrado');
      }

      return director as DirectorResponseDto;

    } catch (error) {
      this.logger.error(`❌ Error obteniendo director ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza un director
   */
  async update(id: string, updateDirectorDto: UpdateDirectorDto): Promise<DirectorResponseDto> {
    try {
      const director = await this.directorRepository.findOne({
        where: { id_director: id }
      });

      if (!director) {
        throw new NotFoundException('Director no encontrado');
      }

      // Verificar si el email ya existe en otro director
      if (updateDirectorDto.email && updateDirectorDto.email !== director.email) {
        const existingDirector = await this.directorRepository.findOne({
          where: { email: updateDirectorDto.email }
        });

        if (existingDirector) {
          throw new ConflictException('El email ya está registrado');
        }
      }

      // Actualizar campos
      Object.assign(director, updateDirectorDto);
      
      const directorActualizado = await this.directorRepository.save(director);
      
      this.logger.log(`✅ Director actualizado: ${directorActualizado.nombres} ${directorActualizado.apellidos}`);
      
      return directorActualizado as DirectorResponseDto;

    } catch (error) {
      this.logger.error(`❌ Error actualizando director ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina un director y su usuario asignado si lo tiene
   */
  async remove(id: string): Promise<void> {
    try {
      const director = await this.directorRepository.findOne({
        where: { id_director: id },
        relations: ['usuario']
      });

      if (!director) {
        throw new NotFoundException('Director no encontrado');
      }

      // Guardar referencia al usuario antes de eliminar el director
      const usuarioAEliminar = director.usuario;

      // Eliminar PRIMERO el director
      await this.directorRepository.remove(director);
      
      // DESPUÉS eliminar el usuario (si existe)
      if (usuarioAEliminar) {
        await this.usuarioService.remove(usuarioAEliminar.id_user);
        this.logger.log(`✅ Usuario eliminado: ${usuarioAEliminar.nombre_usuario}`);
      }
      
      this.logger.log(`✅ Director eliminado: ${director.nombres} ${director.apellidos}`);

    } catch (error) {
      this.logger.error(`❌ Error eliminando director ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de directores
   */
  async getStatistics(): Promise<{
    totalDirectores: number;
  }> {
    try {
      const totalDirectores = await this.directorRepository.count();

      return {
        totalDirectores
      };

    } catch (error) {
      this.logger.error(`❌ Error obteniendo estadísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Asigna un usuario existente a un director
   */
  async asignarUsuario(id_user: string, datos_personales: CreateDirectorDto): Promise<DirectorResponseDto> {
    try {
      // Verificar si el email ya existe en cualquier entidad
      const existingEmail = await this.directorRepository.findOne({
        where: { email: datos_personales.email }
      });

      if (existingEmail) {
        throw new ConflictException('El email ya está registrado en directores');
      }

      // Verificar si el email existe en administradores
      const existingEmailAdmin = await this.administradorRepository.findOne({
        where: { email: datos_personales.email }
      });

      if (existingEmailAdmin) {
        throw new ConflictException('El email ya está registrado en administradores');
      }

      // Verificar si el email existe en auxiliares
      const existingEmailAuxiliar = await this.auxiliarRepository.findOne({
        where: { correo_electronico: datos_personales.email }
      });

      if (existingEmailAuxiliar) {
        throw new ConflictException('El email ya está registrado en auxiliares');
      }

      // Verificar si el usuario ya tiene un director asignado
      const existingDirector = await this.directorRepository.findOne({
        where: { usuario: { id_user } }
      });

      if (existingDirector) {
        throw new ConflictException('El usuario ya tiene un director asignado');
      }

      // Crear director
      const director = this.directorRepository.create({
        ...datos_personales,
        usuario: { id_user } as any
      });

      const directorGuardado = await this.directorRepository.save(director);
      this.logger.log(`Usuario ${id_user} asignado a director: ${directorGuardado.id_director}`);

      return {
        id_director: directorGuardado.id_director,
        nombres: directorGuardado.nombres,
        apellidos: directorGuardado.apellidos,
        email: directorGuardado.email,
        telefono: directorGuardado.telefono,
        direccion: directorGuardado.direccion,
        id_user: directorGuardado.usuario?.id_user
      };
    } catch (error) {
      this.logger.error(`Error asignando usuario a director: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cambia el usuario asignado a un director
   */
  async cambiarUsuario(id_director: string, nuevo_id_user: string): Promise<DirectorResponseDto> {
    try {
      // Verificar que el director existe
      const director = await this.directorRepository.findOne({
        where: { id_director }
      });

      if (!director) {
        throw new NotFoundException('Director no encontrado');
      }

      // Verificar que el nuevo usuario existe
      const usuario = await this.usuarioService.findOne(nuevo_id_user);
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Actualizar el usuario asignado
      await this.directorRepository.update(
        { id_director },
        { usuario: { id_user: nuevo_id_user } as any }
      );

      // Obtener el director actualizado
      const directorActualizado = await this.directorRepository.findOne({
        where: { id_director },
        relations: ['usuario']
      });

      if (!directorActualizado) {
        throw new NotFoundException('Director no encontrado después de la actualización');
      }

      this.logger.log(`Usuario del director ${id_director} cambiado a ${nuevo_id_user}`);

      return {
        id_director: directorActualizado.id_director,
        nombres: directorActualizado.nombres,
        apellidos: directorActualizado.apellidos,
        email: directorActualizado.email,
        telefono: directorActualizado.telefono,
        direccion: directorActualizado.direccion,
        id_user: directorActualizado.usuario?.id_user
      };
    } catch (error) {
      this.logger.error(`Error cambiando usuario del director: ${error.message}`);
      throw error;
    }
  }
}
