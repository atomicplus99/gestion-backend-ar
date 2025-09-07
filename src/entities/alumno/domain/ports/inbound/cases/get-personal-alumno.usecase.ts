// src/application/use-cases/get-alumno-by-codigo.usecase.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Alumno } from '../../../../infraestructure/orm/entities/alumno.entity';
import { AlumnoTypeOrmRepository } from '../../../../infraestructure/adapters/outbounds/repository/alumno.repository';
import { EstadoAlumno } from 'src/entities/estado-alumnos/entities/estado-alumno.entity';
import { AlumnoSearchResponseDto } from 'src/entities/alumno/domain/dtos/response/AlumnoSearchResponse.dto';

@Injectable()
export class GetAlumnoByCodigoUseCase {
  private readonly logger = new Logger(GetAlumnoByCodigoUseCase.name);

  constructor(
    private readonly alumnoTypeOrmRepository: AlumnoTypeOrmRepository,
    private readonly dataSource: DataSource
  ) {}

  async execute(codigo: string): Promise<AlumnoSearchResponseDto> {
    
    try {
      const alumno = await this.alumnoTypeOrmRepository.findByCodigoAlumno(codigo);
      
      
      if (!alumno) {
        throw new NotFoundException(`No se encontró ningún alumno con el código ${codigo}`);
      }
      
      
      // Buscar el estado actual del alumno
      const estadoRepo = this.dataSource.getRepository(EstadoAlumno);
      const ultimoEstado = await estadoRepo.findOne({
        where: { id_alumno: alumno.id_alumno },
        order: { fecha_actualizacion: 'DESC' },
      });

      if (ultimoEstado) {
      } else {
      }
      
      // Construir la respuesta con el estado incluido
      const respuesta: AlumnoSearchResponseDto = {
        id_alumno: alumno.id_alumno,
        codigo: alumno.codigo,
        dni_alumno: alumno.dni_alumno,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        fecha_nacimiento: alumno.fecha_nacimiento,
        direccion: alumno.direccion,
        codigo_qr: alumno.codigo_qr,
        nivel: alumno.nivel,
        grado: alumno.grado,
        seccion: alumno.seccion,
        turno: alumno.turno ? {
          id_turno: alumno.turno.id_turno,
          hora_inicio: alumno.turno.hora_inicio,
          hora_fin: alumno.turno.hora_fin,
          hora_limite: alumno.turno.hora_limite,
          turno: alumno.turno.turno,
        } : null,
        usuario: alumno.usuario ? {
          id_user: alumno.usuario.id_user,
          nombre_usuario: alumno.usuario.nombre_usuario,
          password_user: alumno.usuario.password_user,
          rol_usuario: alumno.usuario.rol_usuario,
          profile_image: alumno.usuario.profile_image,
        } : null,
        estado_actual: ultimoEstado ? {
          estado: ultimoEstado.estado,
          observacion: ultimoEstado.observacion,
          fecha_actualizacion: ultimoEstado.fecha_actualizacion,
        } : undefined,
      };
      
      
      return respuesta;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-lanzar NotFoundException sin modificar
      }
      throw error;
    }
  }
}
