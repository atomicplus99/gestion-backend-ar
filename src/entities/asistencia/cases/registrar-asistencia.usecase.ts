import { Injectable, NotFoundException } from '@nestjs/common';
import { ValidarAlumnoUseCase } from 'src/entities/alumno/cases/validate-alumno-qr.usecases';
import { Alumno } from 'src/entities/alumno/alumno.entity';

@Injectable()
export class RegistrarAsistenciaUseCase {
  constructor(
    private readonly validarAlumno: ValidarAlumnoUseCase,
  ) {}

  async execute(codigo_qr: string): Promise<Alumno> {
    const alumno = await this.validarAlumno.execute(codigo_qr);
    if (!alumno) {
        throw new NotFoundException('El alumno no existe');
      }
    
      return alumno;
  }
}
