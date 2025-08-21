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
   * Encuentra todos los auxiliares
   * @returns Lista de auxiliares
   */
  async findAll(): Promise<Auxiliar[]> {
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
    await this.repo.delete({ id_auxiliar });
  }

  /**
   * Cuenta el número de auxiliares que existen
   * @returns Número de auxiliares
   */
  async count(): Promise<number> {
    return this.repo.count();
  }
}