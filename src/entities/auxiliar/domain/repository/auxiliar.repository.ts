import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Auxiliar } from '../../auxiliar.entity';

@Injectable()
export class AuxiliarRepository {
  constructor(
    @InjectRepository(Auxiliar)
    private repo: Repository<Auxiliar>,
  ) {}

  /**
   * Encuentra todos los auxiliares (método simple)
   * @returns Lista de auxiliares
   */
  async findAllSimple(): Promise<Auxiliar[]> {
    return this.repo.find();
  }

  /**
   * Encuentra un auxiliar por su ID
   * @param id_auxiliar ID del auxiliar
   * @returns Auxiliar encontrado o null
   */
  async findOne(id_auxiliar: string): Promise<Auxiliar | null> {
    return this.repo.findOneBy({ id_auxiliar });
  }

  /**
   * Encuentra un auxiliar por el ID de usuario
   * @param idUser ID del usuario asociado
   * @returns Auxiliar encontrado o null
   */
  async findByUsuarioId(idUser: string): Promise<Auxiliar | null> {
    return this.repo.createQueryBuilder('auxiliar')
      .innerJoinAndSelect('auxiliar.usuario', 'usuario')
      .where('usuario.id_user = :idUser', { idUser })
      .getOne();
  }

  /**
   * Encuentra un auxiliar por DNI
   * @param dni_auxiliar DNI del auxiliar
   * @returns Auxiliar encontrado o null
   */
  async findByDni(dni_auxiliar: string): Promise<Auxiliar | null> {
    return this.repo.findOneBy({ dni_auxiliar });
  }

  /**
   * Guarda un nuevo auxiliar o actualiza uno existente
   * @param auxiliar Datos del auxiliar
   * @returns Auxiliar guardado
   */
  async save(auxiliar: Partial<Auxiliar>): Promise<Auxiliar> {
    return this.repo.save(auxiliar);
  }

  /**
   * Actualiza un auxiliar existente
   * @param id_auxiliar ID del auxiliar
   * @param data Datos a actualizar
   * @returns Auxiliar actualizado
   */
  async update(id_auxiliar: string, data: Partial<Auxiliar>): Promise<Auxiliar | null> {
    await this.repo.update({ id_auxiliar }, data);
    
    return this.findOne(id_auxiliar);
  }

  /**
   * Elimina un auxiliar
   * @param id_auxiliar ID del auxiliar
   * @returns Resultado de la operación
   */
  async remove(id_auxiliar: string): Promise<void> {
    // Obtener el auxiliar con su usuario antes de eliminar
    const auxiliar = await this.repo.findOne({
      where: { id_auxiliar },
      relations: ['usuario']
    });

    if (!auxiliar) {
      throw new Error('Auxiliar no encontrado');
    }

    // Guardar referencia al usuario antes de eliminar el auxiliar
    const usuarioAEliminar = auxiliar.usuario;

    // Eliminar PRIMERO el auxiliar
    await this.repo.delete({ id_auxiliar });

    // DESPUÉS eliminar el usuario (si existe)
    if (usuarioAEliminar) {
      await this.repo.manager.delete('USUARIO', { id_user: usuarioAEliminar.id_user });
    }
  }

  /**
   * Cuenta el número de auxiliares que existen
   * @returns Número de auxiliares
   */
  async count(): Promise<number> {
    return this.repo.count();
  }

  /**
   * Crea un nuevo auxiliar
   * @param data Datos del auxiliar
   * @returns Auxiliar creado
   */
  async create(data: Partial<Auxiliar>): Promise<Auxiliar> {
    const auxiliar = this.repo.create(data);
    return this.repo.save(auxiliar);
  }

  /**
   * Obtiene auxiliares con paginación y búsqueda
   * @param page Página
   * @param limit Límite por página
   * @param search Término de búsqueda
   * @returns Resultado paginado
   */
  async findAll(page: number = 1, limit: number = 10, search?: string): Promise<{
    auxiliares: Auxiliar[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.repo.createQueryBuilder('auxiliar')
      .leftJoinAndSelect('auxiliar.usuario', 'usuario');

    if (search) {
      queryBuilder.where(
        'auxiliar.nombre ILIKE :search OR auxiliar.apellido ILIKE :search OR auxiliar.correo_electronico ILIKE :search',
        { search: `%${search}%` }
      );
    }

    const [auxiliares, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      auxiliares,
      total,
      page,
      limit
    };
  }

  /**
   * Obtiene estadísticas de auxiliares
   * @returns Estadísticas
   */
  async getStatistics(): Promise<{ totalAuxiliares: number }> {
    const totalAuxiliares = await this.repo.count();
    return { totalAuxiliares };
  }

  /**
   * Asigna un usuario existente a un auxiliar
   * @param id_user ID del usuario
   * @param datos_personales Datos personales del auxiliar
   * @returns Auxiliar creado
   */
  async asignarUsuario(id_user: string, datos_personales: {
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string;
    direccion?: string;
  }): Promise<Auxiliar> {
    const auxiliar = this.repo.create({
      nombre: datos_personales.nombres,
      apellido: datos_personales.apellidos,
      correo_electronico: datos_personales.email,
      telefono: datos_personales.telefono || '000000000',
      dni_auxiliar: '00000000', // DNI temporal
      fecha_nacimiento: new Date(), // Fecha temporal
      usuario: { id_user } as any
    });
    return this.repo.save(auxiliar);
  }

  /**
   * Cambia el usuario asignado a un auxiliar
   * @param id_auxiliar ID del auxiliar
   * @param nuevo_id_user ID del nuevo usuario
   * @returns Auxiliar actualizado
   */
  async cambiarUsuario(id_auxiliar: string, nuevo_id_user: string): Promise<Auxiliar> {
    await this.repo.update({ id_auxiliar }, { usuario: { id_user: nuevo_id_user } as any });
    const auxiliar = await this.findOne(id_auxiliar);
    if (!auxiliar) {
      throw new Error('Auxiliar no encontrado después de la actualización');
    }
    return auxiliar;
  }
}