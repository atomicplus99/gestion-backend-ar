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
    this.logger.log(`🔍 [UseCase] Iniciando obtención de lista completa de alumnos con estado`);
    
    try {
      const alumnoRepo = this.dataSource.getRepository(Alumno);
      const estadoRepo = this.dataSource.getRepository(EstadoAlumno);

      this.logger.log(`📊 [UseCase] Buscando todos los alumnos con relaciones`);
      const alumnos = await alumnoRepo.find({
        relations: ['turno', 'usuario'],
      });

      this.logger.log(`✅ [UseCase] Encontrados ${alumnos.length} alumnos, procesando estados`);

      const estadosConAlumno = await Promise.all(
        alumnos.map(async (alumno, index) => {
          this.logger.log(`🔄 [UseCase] Procesando alumno ${index + 1}/${alumnos.length}: ${alumno.codigo}`);
          
          const ultimoEstado = await estadoRepo.findOne({
            where: { id_alumno: alumno.id_alumno },
            order: { fecha_actualizacion: 'DESC' },
          });

          if (!ultimoEstado) {
            this.logger.warn(`⚠️ [UseCase] Alumno ${alumno.codigo} no tiene estado asignado, usando estado por defecto`);
          }

          const resultado = AlumnoEstadoMapper.toDto(alumno, ultimoEstado!);
          this.logger.log(`✅ [UseCase] Alumno ${alumno.codigo} procesado exitosamente`);
          
          return resultado;
        })
      );

      this.logger.log(`🎉 [UseCase] Procesamiento completado: ${estadosConAlumno.length} alumnos con estado`);
      return estadosConAlumno;
      
    } catch (error) {
      this.logger.error(`❌ [UseCase] Error al obtener alumnos con estado: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }

  async executeByCodigo(codigo: string): Promise<AlumnoEstadoResponseDto> {
    this.logger.log(`🔍 [UseCase] Obteniendo estado del alumno con código: ${codigo}`);
    
    try {
      const alumnoRepo = this.dataSource.getRepository(Alumno);
      const estadoRepo = this.dataSource.getRepository(EstadoAlumno);

      this.logger.log(`📊 [UseCase] Buscando alumno con código: ${codigo}`);
      const alumno = await alumnoRepo.findOne({
        where: { codigo },
        relations: ['turno', 'usuario'],
      });

      if (!alumno) {
        this.logger.warn(`⚠️ [UseCase] Alumno no encontrado con código: ${codigo}`);
        throw new NotFoundException(`Alumno con código '${codigo}' no encontrado`);
      }

      this.logger.log(`✅ [UseCase] Alumno encontrado: ${alumno.codigo}, buscando estado actual`);
      
      const ultimoEstado = await estadoRepo.findOne({
        where: { id_alumno: alumno.id_alumno },
        order: { fecha_actualizacion: 'DESC' },
      });

      if (!ultimoEstado) {
        this.logger.warn(`⚠️ [UseCase] Alumno ${alumno.codigo} no tiene estado asignado, usando estado por defecto`);
      }

      const resultado = AlumnoEstadoMapper.toDto(alumno, ultimoEstado!);
      this.logger.log(`✅ [UseCase] Estado del alumno ${alumno.codigo} obtenido exitosamente`);
      
      return resultado;
      
    } catch (error) {
      this.logger.error(`❌ [UseCase] Error al obtener estado del alumno: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }
}
