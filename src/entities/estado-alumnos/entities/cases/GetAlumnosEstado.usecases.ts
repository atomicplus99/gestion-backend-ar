// src/entities/estado-alumnos/application/cases/GetAlumnosEstado.usecase.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { EstadoAlumno } from 'src/entities/estado-alumnos/entities/estado-alumno.entity';
import { AlumnoEstadoResponseDto } from '../dto/AlumnoEstadoResponse.dto';
import { AlumnoEstadoMapper } from '../../mappers/AlumnoEstadoMapper.mapper';

@Injectable()
export class GetAlumnosEstadoUseCase {
  private readonly logger = new Logger(GetAlumnosEstadoUseCase.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<AlumnoEstadoResponseDto[]> {
    
    try {
      const alumnoRepo = this.dataSource.getRepository(Alumno);
      const estadoRepo = this.dataSource.getRepository(EstadoAlumno);

      const alumnos = await alumnoRepo.find({
        relations: ['turno', 'usuario'],
      });


      const estadosConAlumno = await Promise.all(
        alumnos.map(async (alumno, index) => {
          
          const ultimoEstado = await estadoRepo.findOne({
            where: { id_alumno: alumno.id_alumno },
            order: { fecha_actualizacion: 'DESC' },
          });

          if (!ultimoEstado) {
          }

          const resultado = AlumnoEstadoMapper.toDto(alumno, ultimoEstado!);
          
          return resultado;
        })
      );

      return estadosConAlumno;
      
    } catch (error) {
      throw error;
    }
  }

  async executeByCodigo(codigo: string): Promise<AlumnoEstadoResponseDto> {
    
    try {
      const alumnoRepo = this.dataSource.getRepository(Alumno);
      const estadoRepo = this.dataSource.getRepository(EstadoAlumno);

      const alumno = await alumnoRepo.findOne({
        where: { codigo },
        relations: ['turno', 'usuario'],
      });

      if (!alumno) {
        throw new NotFoundException(`Alumno con código '${codigo}' no encontrado`);
      }

      
      const ultimoEstado = await estadoRepo.findOne({
        where: { id_alumno: alumno.id_alumno },
        order: { fecha_actualizacion: 'DESC' },
      });

      if (!ultimoEstado) {
      }

      const resultado = AlumnoEstadoMapper.toDto(alumno, ultimoEstado!);
      
      return resultado;
      
    } catch (error) {
      throw error;
    }
  }
}
