import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualizacionesAsistencia } from '../orm/actualizaciones-asistencia.entity';
import { ActualizacionAsistenciaResponseDto } from '../../domain/dto/actualizacion-asistencia-response.dto';

@Injectable()
export class GetActualizacionesAsistenciaUseCase {
  constructor(
    @InjectRepository(ActualizacionesAsistencia)
    private readonly actualizacionRepository: Repository<ActualizacionesAsistencia>,
  ) {}

  /**
   * Obtiene todas las actualizaciones de asistencia con información completa
   */
  async getAllActualizaciones(): Promise<ActualizacionAsistenciaResponseDto[]> {
    const actualizaciones = await this.actualizacionRepository.find({
      relations: [
        'asistencia',
        'alumno',
        'auxiliar',
        'administrador',
        'director'
      ],
      order: {
        fechaActualizacion: 'DESC'
      }
    });

    return actualizaciones.map(actualizacion => new ActualizacionAsistenciaResponseDto(actualizacion));
  }

  /**
   * Obtiene las actualizaciones de asistencia de un alumno específico
   */
  async getActualizacionesByAlumno(idAlumno: string): Promise<ActualizacionAsistenciaResponseDto[]> {
    const actualizaciones = await this.actualizacionRepository.find({
      where: {
        alumno: { id_alumno: idAlumno }
      },
      relations: [
        'asistencia',
        'alumno',
        'auxiliar',
        'administrador',
        'director'
      ],
      order: {
        fechaActualizacion: 'DESC'
      }
    });

    return actualizaciones.map(actualizacion => new ActualizacionAsistenciaResponseDto(actualizacion));
  }

  /**
   * Obtiene las actualizaciones de asistencia de una asistencia específica
   */
  async getActualizacionesByAsistencia(idAsistencia: string): Promise<ActualizacionAsistenciaResponseDto[]> {
    const actualizaciones = await this.actualizacionRepository.find({
      where: {
        asistencia: { id_asistencia: idAsistencia }
      },
      relations: [
        'asistencia',
        'alumno',
        'auxiliar',
        'administrador',
        'director'
      ],
      order: {
        fechaActualizacion: 'DESC'
      }
    });

    return actualizaciones.map(actualizacion => new ActualizacionAsistenciaResponseDto(actualizacion));
  }

  /**
   * Obtiene las actualizaciones de asistencia por tipo de acción
   */
  async getActualizacionesByAccion(accion: string): Promise<ActualizacionAsistenciaResponseDto[]> {
    const actualizaciones = await this.actualizacionRepository.find({
      where: {
        accion_realizada: accion
      },
      relations: [
        'asistencia',
        'alumno',
        'auxiliar',
        'administrador',
        'director'
      ],
      order: {
        fechaActualizacion: 'DESC'
      }
    });

    return actualizaciones.map(actualizacion => new ActualizacionAsistenciaResponseDto(actualizacion));
  }
}
