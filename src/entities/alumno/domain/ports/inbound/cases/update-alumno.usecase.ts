import { Injectable } from '@nestjs/common';

import { AlumnoTypeOrmRepository } from 'src/entities/alumno/infraestructure/adapters/outbounds/repository/alumno.repository';
import { UpdateAlumnoDto } from '../../../dtos/UpdateAlumno.dto';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';



@Injectable()
export class ActualizarAlumnoCase {
  constructor(
    private readonly alumnoRepository: AlumnoTypeOrmRepository
  ) {}

  async execute(codigo: string, updateData: UpdateAlumnoDto): Promise<Alumno> {
    return this.alumnoRepository.updateAlumno(codigo, updateData);
  }
}