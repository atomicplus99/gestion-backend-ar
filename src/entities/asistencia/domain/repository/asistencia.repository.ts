import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from '../../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';

@Injectable()
export class AsistenciaTypeOrmRepository {
  constructor(
    @InjectRepository(Asistencia)
    private readonly repo: Repository<Asistencia>,
  ) {}

  /* ---------- CRUD existentes ---------- */

  save(asistencia: Asistencia): Promise<Asistencia> {
    return this.repo.save(asistencia);
  }

  create(data: Partial<Asistencia>): Asistencia {
    return this.repo.create(data);
  }

  async findAlumnoById(alumno: Alumno){
    return this.repo.find({
      where: { alumno: { id_alumno: alumno.id_alumno } },
      relations: ['alumno', 'alumno.turno'],
      order: {
        fecha: 'DESC',
        hora_de_llegada: 'DESC',
      },
    })
  }

  async findByAlumnoAndDate(
    id_alumno: string,
    fecha: Date,
  ): Promise<Asistencia | null> {
    // Usar la misma lógica que en CreateAsistenciaManual para evitar problemas de zona horaria
    const fechaFormato = fecha.toISOString().split('T')[0]; // "2025-08-22"
    
    return this.repo
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.alumno', 'alumno')
      .leftJoinAndSelect('alumno.turno', 'turno')
      .leftJoinAndSelect('alumno.usuario', 'usuario')
      .where('alumno.id_alumno = :alumnoId', { alumnoId: id_alumno })
      .andWhere('DATE(asistencia.fecha) = :fecha', { fecha: fechaFormato })
      .getOne();
  }

  async findByAlumnoAndDateAndEstado(
    id_alumno: string,
    fecha: Date,
    estado: string,
  ): Promise<Asistencia | null> {
    // Usar la misma lógica que en CreateAsistenciaManual para evitar problemas de zona horaria
    const fechaFormato = fecha.toISOString().split('T')[0]; // "2025-08-22"
    
    return this.repo
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.alumno', 'alumno')
      .where('alumno.id_alumno = :alumnoId', { alumnoId: id_alumno })
      .andWhere('DATE(asistencia.fecha) = :fecha', { fecha: fechaFormato })
      .andWhere('asistencia.estado_asistencia = :estado', { estado })
      .getOne();
  }

  async existeAsistenciaDelDia(
    idAlumno: string,
    fecha: Date,
  ): Promise<boolean> {
    const asistencia = await this.repo.findOne({
      where: {
        alumno: { id_alumno: idAlumno },
        fecha,
      },
    });
    return !!asistencia;
  }

  /* ---------- NUEVO: lista de asistencias ---------- */

  /**
   * Devuelve todas las asistencias ordenadas por fecha DESC
   * e incluye las relaciones necesarias (`alumno` y su `turno`)
   * para el DTO de listado.
   * Usa createQueryBuilder para asegurar datos frescos sin caché.
   */
  async findAllWithAlumnoYTurno(): Promise<Asistencia[]> {
    return this.repo
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.alumno', 'alumno')
      .leftJoinAndSelect('alumno.turno', 'turno')
      .orderBy('asistencia.fecha', 'DESC')
      .getMany();
  }

  async findOne(id_asistencia : string){
    return this.repo.findOne({ where: { id_asistencia: id_asistencia } });
  }

  async update(id_asistencia: string, dataToUpdate: Partial<Asistencia>): Promise<Asistencia> {
    // Primero actualizamos los datos
    await this.repo.update({ id_asistencia }, dataToUpdate);
    
    // Luego obtenemos la entidad actualizada para retornarla
    const updatedAsistencia = await this.repo.findOne({
      where: { id_asistencia }
    });
    
    // Verificar si se encontró después de actualizar
    if (!updatedAsistencia) {
      throw new NotFoundException(`No se encontró la asistencia con ID: ${id_asistencia} después de actualizar`);
    }
    
    return updatedAsistencia;
  }
}
