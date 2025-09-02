import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsistenciaExtra } from './asistencia-extra.entity';
import { EstadoAsistenciaExtra } from './enums/estado-asistencia-extra.enum';

@Injectable()
export class AsistenciaExtraRepository {
  constructor(
    @InjectRepository(AsistenciaExtra)
    private readonly repo: Repository<AsistenciaExtra>,
  ) {}

  save(asistenciaExtra: AsistenciaExtra): Promise<AsistenciaExtra> {
    return this.repo.save(asistenciaExtra);
  }

  create(data: Partial<AsistenciaExtra>): AsistenciaExtra {
    return this.repo.create(data);
  }

  async findByAlumnoAndDate(
    id_alumno: string,
    fecha: Date,
  ): Promise<AsistenciaExtra | null> {
    const fechaFormato = fecha.toISOString().split('T')[0];
    
    return this.repo
      .createQueryBuilder('asistencia_extra')
      .leftJoinAndSelect('asistencia_extra.alumno', 'alumno')
      .where('alumno.id_alumno = :alumnoId', { alumnoId: id_alumno })
      .andWhere('DATE(asistencia_extra.fecha) = :fecha', { fecha: fechaFormato })
      .getOne();
  }

  async findByAlumnoAndDateAndEstado(
    id_alumno: string,
    fecha: Date,
    estado: EstadoAsistenciaExtra,
  ): Promise<AsistenciaExtra | null> {
    const fechaFormato = fecha.toISOString().split('T')[0];
    
    return this.repo
      .createQueryBuilder('asistencia_extra')
      .leftJoinAndSelect('asistencia_extra.alumno', 'alumno')
      .where('alumno.id_alumno = :alumnoId', { alumnoId: id_alumno })
      .andWhere('DATE(asistencia_extra.fecha) = :fecha', { fecha: fechaFormato })
      .andWhere('asistencia_extra.estado_asistencia = :estado', { estado })
      .getOne();
  }

  async findAllWithAlumnoYTurno(): Promise<AsistenciaExtra[]> {
    return this.repo
      .createQueryBuilder('asistencia_extra')
      .leftJoinAndSelect('asistencia_extra.alumno', 'alumno')
      .leftJoinAndSelect('alumno.turno', 'turno')
      .orderBy('asistencia_extra.fecha', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<AsistenciaExtra | null> {
    return this.repo.findOne({
      where: { id_asistencia_extra: id },
      relations: ['alumno']
    });
  }

  async update(id: string, dataToUpdate: Partial<AsistenciaExtra>): Promise<AsistenciaExtra> {
    await this.repo.update({ id_asistencia_extra: id }, dataToUpdate);
    
    const updatedAsistenciaExtra = await this.repo.findOne({
      where: { id_asistencia_extra: id }
    });
    
    if (!updatedAsistenciaExtra) {
      throw new Error(`No se encontró la asistencia extra con ID: ${id} después de actualizar`);
    }
    
    return updatedAsistenciaExtra;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id_asistencia_extra: id });
  }
}
