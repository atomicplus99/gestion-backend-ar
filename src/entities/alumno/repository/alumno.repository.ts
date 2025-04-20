import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Alumno } from '../alumno.entity';


@Injectable()
export class AlumnoTypeOrmRepository {
  constructor(
    @InjectRepository(Alumno)
    private readonly repositoryAlumno: Repository<Alumno>
  ) {}

  save(alumno: Alumno): Promise<Alumno> {
    return this.repositoryAlumno.save(alumno);
  }

  findByCodigo(codigo: string): Promise<Alumno|null> {
    return this.repositoryAlumno.findOne({ where: { codigo } });
  }

  findAll(): Promise<Alumno[]> {
    return this.repositoryAlumno.find({ relations: ['turno','usuario'] });
  }

  findByCodigoQR(codigo_qr: string): Promise<Alumno | null>{
    return this.repositoryAlumno.findOne(
      { where: { codigo_qr },
        relations: ['turno','usuario']
      }
    )
  }

}
