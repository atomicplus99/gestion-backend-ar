import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualizacionesAsistencia } from '../../infraestructure/orm/actualizaciones-asistencia.entity';
import { Asistencia } from 'src/entities/asistencia/asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';


@Injectable()
export class ActualizacionesAsistenciaRepository {
  constructor(
    @InjectRepository(ActualizacionesAsistencia)
    private repo: Repository<ActualizacionesAsistencia>,
  ) {}

  /**
   * Encuentra todas las actualizaciones de asistencia
   * @returns Lista de actualizaciones
   */
  async findAll(): Promise<ActualizacionesAsistencia[]> {
    return this.repo.find({
      relations: ['asistencia', 'alumno', 'auxiliar', 'administrador', 'director'],
    });
  }

  /**
   * Encuentra una actualización por su ID
   * @param id ID de la actualización
   * @returns Actualización encontrada o null
   */
  async findOne(id: string): Promise<ActualizacionesAsistencia | null> {
    return this.repo.findOneBy({ id });
  }

  /**
   * Encuentra todas las actualizaciones para una asistencia específica
   * @param id_asistencia ID de la asistencia
   * @returns Lista de actualizaciones para esa asistencia
   */
  async findByAsistenciaId(id_asistencia: string): Promise<ActualizacionesAsistencia[]> {
    return this.repo.createQueryBuilder('actualizacion')
      .innerJoinAndSelect('actualizacion.asistencia', 'asistencia')
      .innerJoinAndSelect('actualizacion.alumno', 'alumno')
      .leftJoinAndSelect('actualizacion.auxiliar', 'auxiliar')
      .leftJoinAndSelect('actualizacion.administrador', 'administrador')
      .leftJoinAndSelect('actualizacion.director', 'director')
      .where('asistencia.id_asistencia = :id_asistencia', { id_asistencia })
      .orderBy('actualizacion.fechaActualizacion', 'DESC')
      .getMany();
  }

  /**
   * Encuentra todas las actualizaciones hechas por un auxiliar específico
   * @param id_auxiliar ID del auxiliar
   * @returns Lista de actualizaciones realizadas por ese auxiliar
   */
  async findByAuxiliarId(id_auxiliar: string): Promise<ActualizacionesAsistencia[]> {
    return this.repo.createQueryBuilder('actualizacion')
      .innerJoinAndSelect('actualizacion.asistencia', 'asistencia')
      .innerJoinAndSelect('actualizacion.alumno', 'alumno')
      .leftJoinAndSelect('actualizacion.auxiliar', 'auxiliar')
      .leftJoinAndSelect('actualizacion.administrador', 'administrador')
      .leftJoinAndSelect('actualizacion.director', 'director')
      .where('auxiliar.id_auxiliar = :id_auxiliar', { id_auxiliar })
      .orderBy('actualizacion.fechaActualizacion', 'DESC')
      .getMany();
  }

  /**
   * Encuentra todas las actualizaciones para un alumno específico
   * @param id_alumno ID del alumno
   * @returns Lista de actualizaciones para ese alumno
   */
  async findByAlumnoId(id_alumno: string): Promise<ActualizacionesAsistencia[]> {
    return this.repo.createQueryBuilder('actualizacion')
      .innerJoinAndSelect('actualizacion.asistencia', 'asistencia')
      .innerJoinAndSelect('actualizacion.alumno', 'alumno')
      .leftJoinAndSelect('actualizacion.auxiliar', 'auxiliar')
      .leftJoinAndSelect('actualizacion.administrador', 'administrador')
      .leftJoinAndSelect('actualizacion.director', 'director')
      .where('alumno.id_alumno = :id_alumno', { id_alumno })
      .orderBy('actualizacion.fechaActualizacion', 'DESC')
      .getMany();
  }

  /**
   * Encuentra actualizaciones por rango de fechas
   * @param fechaInicio Fecha de inicio
   * @param fechaFin Fecha de fin
   * @returns Lista de actualizaciones dentro del rango de fechas
   */
  async findByDateRange(fechaInicio: Date, fechaFin: Date): Promise<ActualizacionesAsistencia[]> {
    return this.repo.createQueryBuilder('actualizacion')
      .innerJoinAndSelect('actualizacion.asistencia', 'asistencia')
      .innerJoinAndSelect('actualizacion.alumno', 'alumno')
      .innerJoinAndSelect('actualizacion.auxiliar', 'auxiliar')
      .where('actualizacion.fechaActualizacion >= :fechaInicio', { fechaInicio })
      .andWhere('actualizacion.fechaActualizacion <= :fechaFin', { fechaFin })
      .orderBy('actualizacion.fechaActualizacion', 'DESC')
      .getMany();
  }

  /**
   * Guarda una nueva actualización de asistencia
   * @param actualizacion Datos de la actualización
   * @returns Actualización guardada
   */
  async save(actualizacion: Partial<ActualizacionesAsistencia>): Promise<ActualizacionesAsistencia> {
    return this.repo.save(actualizacion);
  }

  /**
   * Crea y guarda una nueva actualización con todas las relaciones
   * @param asistencia Asistencia actualizada
   * @param alumno Alumno relacionado
   * @param auxiliar Auxiliar que realizó la actualización
   * @param motivo Motivo de la actualización
   * @returns Actualización guardada
   */
  async createActualizacion(
    asistencia: Asistencia,
    alumno: Alumno,
    auxiliar: Auxiliar | null,
    motivo: string,
    administrador?: any,
    director?: any,
  ): Promise<ActualizacionesAsistencia> {
    const actualizacion = new ActualizacionesAsistencia();
    actualizacion.asistencia = asistencia;
    actualizacion.alumno = alumno;
    if (auxiliar) actualizacion.auxiliar = auxiliar;
    if (administrador) actualizacion.administrador = administrador;
    if (director) actualizacion.director = director;
    actualizacion.motivo = motivo;
    // La fecha se asigna automáticamente por ser un CreateDateColumn
    
    return this.save(actualizacion);
  }

  /**
   * Elimina una actualización
   * @param id ID de la actualización
   */
  async remove(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  /**
   * Cuenta el número de actualizaciones
   * @returns Número de actualizaciones
   */
  async count(): Promise<number> {
    return this.repo.count();
  }
}