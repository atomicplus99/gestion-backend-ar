import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alumno } from './alumno.entity';

@Injectable()
export class AlumnoService {
  constructor(
    @InjectRepository(Alumno)
    private readonly alumnoRepo: Repository<Alumno>,
  ) {}

  async findByUsuarioId(id: string): Promise<Alumno | null> {
    return this.alumnoRepo.findOne({
      where: {
        usuario: { id_user: id },
      },
      relations: ['usuario'], 
    });
  }
}
