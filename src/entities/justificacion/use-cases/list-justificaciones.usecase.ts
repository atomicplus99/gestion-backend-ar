import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Justificacion } from '../justificacion.entity';
import { Alumno } from '../../alumno/infraestructure/orm/entities/alumno.entity';
import { FiltroJustificacionesDto } from '../dto/list-justificaciones.dto';
import { JustificacionListResponseDto, PaginacionResponseDto } from '../dto/list-justificaciones-response.dto';

@Injectable()
export class ListJustificacionesUseCase {
  constructor(
    @InjectRepository(Justificacion)
    private readonly justificacionRepository: Repository<Justificacion>,
    
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
  ) {}

  async execute(filtros: FiltroJustificacionesDto, paginacion: { pagina: number; elementos_por_pagina: number }): Promise<{
    justificaciones: JustificacionListResponseDto[];
    total: number;
    paginacion: PaginacionResponseDto;
  }> {
    // 1. Construir query base con filtros
    const queryBuilder = this.buildQueryWithFilters(filtros);

    // 2. Obtener total de registros
    const total = await queryBuilder.getCount();

    // 3. Aplicar paginación
    const { pagina, elementos_por_pagina } = paginacion;
    const skip = (pagina - 1) * elementos_por_pagina;
    
    queryBuilder
      .skip(skip)
      .take(elementos_por_pagina)
      .orderBy('justificacion.fecha_creacion', 'DESC');

    // 4. Ejecutar query
    const justificaciones = await queryBuilder.getMany();

    // 5. Mapear a DTOs de respuesta
    const justificacionesMapeadas = await this.mapToResponseDtos(justificaciones);

    // 6. Calcular información de paginación
    const infoPaginacion = this.calcularPaginacion(total, pagina, elementos_por_pagina);

    return {
      justificaciones: justificacionesMapeadas,
      total,
      paginacion: infoPaginacion,
    };
  }

  private buildQueryWithFilters(filtros: FiltroJustificacionesDto): SelectQueryBuilder<Justificacion> {
    const queryBuilder = this.justificacionRepository
      .createQueryBuilder('justificacion')
      .leftJoinAndSelect('justificacion.alumno', 'alumno')
      .leftJoinAndSelect('justificacion.auxiliar', 'auxiliar')
      .leftJoinAndSelect('alumno.turno', 'turno');

    // Filtro por código de alumno
    if (filtros.codigo_alumno) {
      queryBuilder.andWhere('alumno.codigo = :codigo', { codigo: filtros.codigo_alumno });
    }

    // Filtro por estado
    if (filtros.estado) {
      queryBuilder.andWhere('justificacion.estado = :estado', { estado: filtros.estado });
    }

    // Filtro por tipo
    if (filtros.tipo_justificacion) {
      queryBuilder.andWhere('justificacion.tipo_justificacion = :tipo', { tipo: filtros.tipo_justificacion });
    }

    // Filtro por rango de fechas
    if (filtros.fecha_desde) {
      queryBuilder.andWhere('justificacion.fecha_creacion >= :fechaDesde', { 
        fechaDesde: new Date(filtros.fecha_desde + 'T00:00:00') 
      });
    }

    if (filtros.fecha_hasta) {
      queryBuilder.andWhere('justificacion.fecha_creacion <= :fechaHasta', { 
        fechaHasta: new Date(filtros.fecha_hasta + 'T23:59:59') 
      });
    }

    return queryBuilder;
  }

  private async mapToResponseDtos(justificaciones: Justificacion[]): Promise<JustificacionListResponseDto[]> {
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
      asistencias_creadas: 0, // Por ahora hardcodeado, se puede implementar lógica para contar asistencias
    }));
  }

  private calcularPaginacion(total: number, pagina: number, elementosPorPagina: number): PaginacionResponseDto {
    const totalPaginas = Math.ceil(total / elementosPorPagina);
    
    return {
      pagina_actual: pagina,
      elementos_por_pagina: elementosPorPagina,
      total_elementos: total,
      total_paginas: totalPaginas,
      tiene_pagina_anterior: pagina > 1,
      tiene_pagina_siguiente: pagina < totalPaginas,
    };
  }
}
