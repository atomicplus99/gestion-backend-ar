import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Justificacion } from '../justificacion.entity';
import { UpdateEstadoJustificacionDto } from '../dto/update-estado-justificacion.dto';
import { JustificacionListResponseDto } from '../dto/list-justificaciones-response.dto';

@Injectable()
export class UpdateEstadoJustificacionUseCase {
  constructor(
    @InjectRepository(Justificacion)
    private readonly justificacionRepository: Repository<Justificacion>,
  ) {}

  async execute(
    idJustificacion: string, 
    updateDto: UpdateEstadoJustificacionDto
  ): Promise<JustificacionListResponseDto> {
    // 1. Buscar la justificación
    const justificacion = await this.justificacionRepository.findOne({
      where: { id_justificacion: idJustificacion },
      relations: ['alumno', 'auxiliar', 'alumno.turno'],
    });

    if (!justificacion) {
      throw new NotFoundException(`No se encontró ninguna justificación con el ID: ${idJustificacion}`);
    }

    // 2. Validar que el estado actual sea PENDIENTE
    if (justificacion.estado !== 'PENDIENTE') {
      throw new BadRequestException(
        `No se puede actualizar una justificación con estado '${justificacion.estado}'. Solo se pueden actualizar justificaciones PENDIENTES.`
      );
    }

    // 3. Actualizar el estado y observaciones
    justificacion.estado = updateDto.nuevo_estado;
    justificacion.observaciones_admin = updateDto.observaciones_respuesta;
    justificacion.fecha_actualizacion = new Date();

    // 4. Guardar los cambios
    const justificacionActualizada = await this.justificacionRepository.save(justificacion);

    // 5. Mapear a DTO de respuesta
    return this.mapToResponseDto(justificacionActualizada);
  }

  private mapToResponseDto(justificacion: Justificacion): JustificacionListResponseDto {
    return {
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
        id_alumno: justificacion.alumno.id_alumno,
        codigo: justificacion.alumno.codigo,
        nombre: justificacion.alumno.nombre,
        apellido: justificacion.alumno.apellido,
        nivel: justificacion.alumno.nivel || 'NO ESPECIFICADO',
        grado: justificacion.alumno.grado || 0,
        seccion: justificacion.alumno.seccion || 'NO ESPECIFICADO',
      },
      auxiliar_encargado: {
        id_auxiliar: justificacion.auxiliar.id_auxiliar,
        nombre: justificacion.auxiliar.nombre || 'Auxiliar',
        apellido: justificacion.auxiliar.apellido || 'Sistema',
        correo_electronico: justificacion.auxiliar.correo_electronico || 'no-disponible@colegio.edu.pe',
      },
      asistencias_creadas: 0, // Por ahora hardcodeado
    };
  }
}
