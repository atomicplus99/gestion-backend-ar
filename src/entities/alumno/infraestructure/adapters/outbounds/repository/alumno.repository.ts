import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Alumno } from '../../../orm/entities/alumno.entity';
import { AlumnoMapper } from '../../../mappers/alumno.mapper';
import { AlumnoRepositoryInterface } from 'src/entities/alumno/domain/ports/outbound/interfaces/AlumnoRepository.interface';
import { UpdateAlumnoDto } from 'src/entities/alumno/domain/dtos/UpdateAlumno.dto';

@Injectable()
export class AlumnoTypeOrmRepository implements AlumnoRepositoryInterface {
  constructor(
    @InjectRepository(Alumno)
    private readonly repositoryAlumno: Repository<Alumno>
  ) {}

  save(alumno: Alumno): Promise<Alumno> {
    return this.repositoryAlumno.save(alumno);
  }

  async findOne(codigo: string){
    return this.repositoryAlumno.findOne({ where: { codigo } });
  }

  async findByCodigoPersonal(codigo: string): Promise<Partial<Alumno> | null> {
    const orm = await this.repositoryAlumno.findOne({
      where: { codigo },
      select: [
        'id_alumno',
        'codigo',
        'dni_alumno',
        'nombre',
        'apellido',
        'fecha_nacimiento',
        'direccion',
        'nivel',
        'grado',
        'seccion'
      ],
    });

    if (!orm) return null;
    return AlumnoMapper.toDomain(orm);
  }

  async findByCodigoAlumno(codigo: string): Promise<Alumno | null> {
    const alumno = await this.repositoryAlumno.findOne({ where: { codigo }, relations: ['turno','usuario'] });
    return alumno;
  }

  
  findAll(): Promise<Alumno[]> {
    return this.repositoryAlumno.find({
      relations: ['turno', 'usuario']
    });
  }

  findByCodigoQR(codigo_qr: string): Promise<Alumno | null> {
    return this.repositoryAlumno.findOne({
      where: { codigo_qr },
      relations: ['turno', 'usuario']
    });
  }



  async updateAlumno(code: string, updateData: UpdateAlumnoDto): Promise<Alumno> {
    const alumno = await this.repositoryAlumno.findOne({ where: { codigo: code }, relations: ['turno', 'usuario'] });
    if (!alumno) throw new NotFoundException(`Alumno con código '${code}' no encontrado`);
    return this.repositoryAlumno.save( AlumnoMapper.updateAlumnoMapper(alumno, updateData));
  }



}
