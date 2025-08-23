import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Justificacion } from './justificacion.entity';

@Injectable()
export class JustificacionRepository {
  constructor(
    @InjectRepository(Justificacion)
    private readonly repository: Repository<Justificacion>,
  ) {}

  async create(justificacion: Partial<Justificacion>): Promise<Justificacion> {
    const nuevaJustificacion = this.repository.create(justificacion);
    return await this.repository.save(nuevaJustificacion);
  }

  async findById(id: string): Promise<Justificacion | null> {
    return await this.repository.findOne({
      where: { id_justificacion: id },
      relations: ['alumno', 'auxiliar'],
    });
  }

  async findByAlumno(idAlumno: string): Promise<Justificacion[]> {
    return await this.repository.find({
      where: { alumno: { id_alumno: idAlumno } },
      relations: ['alumno', 'auxiliar'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByAuxiliar(idAuxiliar: string): Promise<Justificacion[]> {
    return await this.repository.find({
      where: { auxiliar: { id_auxiliar: idAuxiliar } },
      relations: ['alumno', 'auxiliar'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findAll(): Promise<Justificacion[]> {
    return await this.repository.find({
      relations: ['alumno', 'auxiliar'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async update(id: string, data: Partial<Justificacion>): Promise<Justificacion | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  async findByEstado(estado: string): Promise<Justificacion[]> {
    return await this.repository.find({
      where: { estado: estado as any },
      relations: ['alumno', 'auxiliar'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByTipo(tipo: string): Promise<Justificacion[]> {
    return await this.repository.find({
      where: { tipo_justificacion: tipo as any },
      relations: ['alumno', 'auxiliar'],
      order: { fecha_creacion: 'DESC' },
    });
  }
}
