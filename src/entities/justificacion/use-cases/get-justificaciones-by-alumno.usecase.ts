import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Justificacion } from '../justificacion.entity';
import { Alumno } from '../../alumno/infraestructure/orm/entities/alumno.entity';
import { JustificacionListResponseDto } from '../dto/list-justificaciones-response.dto';

@Injectable()
export class GetJustificacionesByAlumnoUseCase {
  constructor(
    @InjectRepository(Justificacion)
    private readonly justificacionRepository: Repository<Justificacion>,
    
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
  ) {}

  async execute(idAlumno: string): Promise<JustificacionListResponseDto[]> {
    // 1. Verificar que el alumno existe
    const alumno = await this.alumnoRepository.findOne({
      where: { id_alumno: idAlumno },
      relations: ['turno'],
    });

    if (!alumno) {
      throw new NotFoundException(`No se encontró ningún alumno con el ID: ${idAlumno}`);
    }

    // 2. Obtener justificaciones del alumno
    const justificaciones = await this.justificacionRepository.find({
      where: { alumno: { id_alumno: idAlumno } },
      relations: ['alumno', 'auxiliar'],
      order: { fecha_creacion: 'DESC' },
    });

    // 3. Mapear a DTOs de respuesta
    return this.mapToResponseDtos(justificaciones, alumno);
  }

  private mapToResponseDtos(justificaciones: Justificacion[], alumno: Alumno): JustificacionListResponseDto[] {
    return justificaciones.map(justificacion => ({
      id_justificacion: justificacion.id_justificacion,
      tipo_justificacion: justificacion.tipo_justificacion,
      motivo: justificacion.motivo,
      estado: justificacion.estado,
      fecha_solicitud: justificacion.fecha_creacion,
      fechas_de_justificacion: justificacion.fecha_de_justificacion || [],
      documentos_adjuntos: justificacion.documentos_adjuntos || [],
      fecha_respuesta: justificacion.fecha_actualizacion,
      observaciones_solicitante: justificacion.observaciones_admin,
      alumno_solicitante: {
        id_alumno: alumno.id_alumno,
        codigo: alumno.codigo,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        nivel: alumno.nivel || 'NO ESPECIFICADO',
        grado: alumno.grado || 0,
        seccion: alumno.seccion || 'NO ESPECIFICADO',
      },
      auxiliar_encargado: {
        id_auxiliar: justificacion.auxiliar.id_auxiliar,
        nombre: justificacion.auxiliar.nombre || 'Auxiliar',
        apellido: justificacion.auxiliar.apellido || 'Sistema',
        correo_electronico: justificacion.auxiliar.correo_electronico || 'no-disponible@colegio.edu.pe',
      },
      asistencias_creadas: 0, // Por ahora hardcodeado
    }));
  }
}
