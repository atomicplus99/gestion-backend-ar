import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from '../../alumno/infraestructure/orm/entities/alumno.entity';
import { Turno } from '../../turno/turno.entity';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';
import { AsistenciaExtra } from '../../asistencia-extra/asistencia-extra.entity';
import { EstadoAsistenciaExtra } from '../../asistencia-extra/enums/estado-asistencia-extra.enum';

export interface EstadisticasAsistenciaDto {
  fecha_inicio?: string;
  fecha_fin?: string;
  nivel?: string;
  grado?: number;
  seccion?: string;
  turno?: string;
  estado?: EstadoAsistencia;
}

export interface ResumenAsistencia {
  porcentaje_dia: number;
  porcentaje_semana: number;
  porcentaje_mes: number;
  total_presentes: number;
  total_ausentes: number;
  total_tardanzas: number;
  total_justificados: number;
  total_anulados: number;
}

export interface IndicadoresPuntualidad {
  llegadas_tardias: number;
  salidas_tempranas: number;
  tiempo_promedio_tardanza: number;
  alumnos_mas_tardios: Array<{
    alumno: string;
    tardanzas: number;
  }>;
}

export interface TendenciaAsistencia {
  diario: Array<{
    fecha: string;
    porcentaje: number;
    total: number;
    presentes: number;
  }>;
  semanal: Array<{
    semana: string;
    porcentaje: number;
    total: number;
    presentes: number;
  }>;
  mensual: Array<{
    mes: string;
    porcentaje: number;
    total: number;
    presentes: number;
  }>;
}

export interface MapaCalor {
  por_dia_semana: Array<{
    dia: string;
    porcentaje: number;
    total: number;
  }>;
  por_hora: Array<{
    hora: string;
    cantidad: number;
    porcentaje: number;
  }>;
}

export interface DistribucionEstados {
  puntual: number;
  ausente: number;
  tardanza: number;
  justificado: number;
  anulado: number;
  extra: number;
}

export interface ListaAusentes {
  ausentes_dia: Array<{
    alumno: string;
    codigo: string;
    nivel: string;
    grado: number;
    seccion: string;
    turno: string;
    dias_ausente_consecutivos: number;
  }>;
  tardanzas_dia: Array<{
    alumno: string;
    codigo: string;
    nivel: string;
    grado: number;
    seccion: string;
    turno: string;
    hora_llegada: string;
    tiempo_retraso: number;
  }>;
  registros_recientes: Array<{
    alumno: string;
    codigo: string;
    estado: string;
    hora_llegada?: string | null;
    hora_salida?: string | null;
    fecha: string;
  }>;
}

export interface AlertasAnomalias {
  ausencias_prolongadas: Array<{
    alumno: string;
    codigo: string;
    dias_ausente: number;
    ultima_asistencia: string;
  }>;
  patrones_irregulares: Array<{
    alumno: string;
    codigo: string;
    patron: string;
    descripcion: string;
  }>;
  eventos_importantes: Array<{
    tipo: string;
    descripcion: string;
    fecha: string;
    impacto: 'alto' | 'medio' | 'bajo';
  }>;
}

@Injectable()
export class EstadisticasAsistenciaService {
  private readonly logger = new Logger(EstadisticasAsistenciaService.name);

  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(AsistenciaExtra)
    private readonly asistenciaExtraRepository: Repository<AsistenciaExtra>,
  ) {}

  /**
   * Obtiene estadísticas completas de asistencia - TODA LA DATA SIN FILTROS
   */
  async obtenerEstadisticasCompletas() {
    try {
      // Obtener TODOS los datos disponibles sin filtros
      const [
        resumen,
        indicadoresPuntualidad,
        tendencias,
        mapaCalor,
        distribucionEstados,
        listaAusentes,
        alertas,
        datosCompletos
      ] = await Promise.all([
        this.obtenerResumenAsistencia(),
        this.obtenerIndicadoresPuntualidad(),
        this.obtenerTendenciasAsistencia(),
        this.obtenerMapaCalor(),
        this.obtenerDistribucionEstados(),
        this.obtenerListaAusentes(),
        this.obtenerAlertasAnomalias(),
        this.obtenerDatosCompletos()
      ]);

      return {
        resumen,
        indicadores_puntualidad: indicadoresPuntualidad,
        tendencias,
        mapa_calor: mapaCalor,
        distribucion_estados: distribucionEstados,
        lista_ausentes: listaAusentes,
        alertas_anomalias: alertas,
        datos_completos: datosCompletos,
        metadata: {
          fecha_consulta: new Date().toISOString(),
          total_registros: datosCompletos.total_asistencias,
          periodo_disponible: {
            fecha_mas_antigua: datosCompletos.fecha_mas_antigua,
            fecha_mas_reciente: datosCompletos.fecha_mas_reciente
          }
        }
      };
    } catch (error) {
      this.logger.error('Error al obtener estadísticas completas:', error);
      throw error;
    }
  }

  /**
   * Obtiene resumen de asistencia - TODA LA DATA
   */
  private async obtenerResumenAsistencia(): Promise<ResumenAsistencia> {
    
    // Estadísticas del día
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
    
    const asistenciasDia = await this.asistenciaRepository.count({
      where: { fecha: Between(inicioDia, finDia) }
    });
    
    const presentesDia = await this.asistenciaRepository.count({
      where: { 
        fecha: Between(inicioDia, finDia),
        estado_asistencia: In([EstadoAsistencia.PUNTUAL, EstadoAsistencia.TARDANZA])
      }
    });
    
    const ausentesDia = await this.asistenciaRepository.count({
      where: { 
        fecha: Between(inicioDia, finDia),
        estado_asistencia: EstadoAsistencia.AUSENTE
      }
    });

    // Estadísticas de la semana
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    
    const asistenciasSemana = await this.asistenciaRepository.count({
      where: { fecha: Between(inicioSemana, finDia) }
    });
    
    const presentesSemana = await this.asistenciaRepository.count({
      where: { 
        fecha: Between(inicioSemana, finDia),
        estado_asistencia: In([EstadoAsistencia.PUNTUAL, EstadoAsistencia.TARDANZA])
      }
    });

    // Estadísticas del mes (último mes completo)
    const inicioMes = this.getFechaInicioMes();
    const finMes = new Date();
    
    const asistenciasMes = await this.asistenciaRepository.count({
      where: { fecha: Between(inicioMes, finMes) }
    });
    
    const presentesMes = await this.asistenciaRepository.count({
      where: { 
        fecha: Between(inicioMes, finMes),
        estado_asistencia: In([EstadoAsistencia.PUNTUAL, EstadoAsistencia.TARDANZA])
      }
    });

    const tardanzasMes = await this.asistenciaRepository.count({
      where: { 
        fecha: Between(inicioMes, finMes),
        estado_asistencia: EstadoAsistencia.TARDANZA
      }
    });

    const justificadosMes = await this.asistenciaRepository.count({
      where: { 
        fecha: Between(inicioMes, finMes),
        estado_asistencia: EstadoAsistencia.JUSTIFICADO
      }
    });

    const anuladosMes = await this.asistenciaRepository.count({
      where: { 
        fecha: Between(inicioMes, finMes),
        estado_asistencia: EstadoAsistencia.ANULADO
      }
    });

    return {
      porcentaje_dia: asistenciasDia > 0 ? Math.round((presentesDia / asistenciasDia) * 100) : 0,
      porcentaje_semana: asistenciasSemana > 0 ? Math.round((presentesSemana / asistenciasSemana) * 100) : 0,
      porcentaje_mes: asistenciasMes > 0 ? Math.round((presentesMes / asistenciasMes) * 100) : 0,
      total_presentes: presentesMes,
      total_ausentes: ausentesDia,
      total_tardanzas: tardanzasMes,
      total_justificados: justificadosMes,
      total_anulados: anuladosMes
    };
  }

  /**
   * Obtiene indicadores de puntualidad - TODA LA DATA
   */
  private async obtenerIndicadoresPuntualidad(): Promise<IndicadoresPuntualidad> {
    
    const tardanzas = await this.asistenciaRepository.find({
      where: { 
        estado_asistencia: EstadoAsistencia.TARDANZA
      },
      relations: ['alumno']
    });

    // Calcular tiempo promedio de tardanza
    let tiempoTotalTardanza = 0;
    const alumnosTardios = new Map<string, number>();

    for (const asistencia of tardanzas) {
      if (asistencia.hora_de_llegada && asistencia.alumno.turno) {
        const horaTurno = asistencia.alumno.turno.hora_inicio;
        const horaLLegada = asistencia.hora_de_llegada;
        
        const minutosTurno = this.convertirHoraAMinutos(horaTurno);
        const minutosLlegada = this.convertirHoraAMinutos(horaLLegada);
        const minutosTardanza = minutosLlegada - minutosTurno;
        
        if (minutosTardanza > 0) {
          tiempoTotalTardanza += minutosTardanza;
          
          const codigoAlumno = asistencia.alumno.codigo;
          alumnosTardios.set(codigoAlumno, (alumnosTardios.get(codigoAlumno) || 0) + 1);
        }
      }
    }

    const tiempoPromedioTardanza = tardanzas.length > 0 ? Math.round(tiempoTotalTardanza / tardanzas.length) : 0;

    // Obtener alumnos más tardíos
    const alumnosMasTardios = Array.from(alumnosTardios.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([codigo, tardanzas]) => ({
        alumno: codigo,
        tardanzas
      }));

    return {
      llegadas_tardias: tardanzas.length,
      salidas_tempranas: 0, // Implementar lógica de salidas tempranas
      tiempo_promedio_tardanza: tiempoPromedioTardanza,
      alumnos_mas_tardios: alumnosMasTardios
    };
  }

  /**
   * Obtiene tendencias de asistencia - TODA LA DATA
   */
  private async obtenerTendenciasAsistencia(): Promise<TendenciaAsistencia> {
    
    // Tendencias diarias (últimos 30 días)
    const diario: Array<{
      fecha: string;
      porcentaje: number;
      total: number;
      presentes: number;
    }> = [];
    for (let i = 29; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const inicioDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      const finDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59);
      
      const total = await this.asistenciaRepository.count({
        where: { fecha: Between(inicioDia, finDia) }
      });
      
      const presentes = await this.asistenciaRepository.count({
        where: { 
          fecha: Between(inicioDia, finDia),
          estado_asistencia: In([EstadoAsistencia.PUNTUAL, EstadoAsistencia.TARDANZA])
        }
      });
      
      diario.push({
        fecha: fecha.toISOString().split('T')[0],
        porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0,
        total,
        presentes
      });
    }

    // Tendencias semanales (últimas 12 semanas)
    const semanal: Array<{
      semana: string;
      porcentaje: number;
      total: number;
      presentes: number;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const inicioSemana = new Date();
      inicioSemana.setDate(inicioSemana.getDate() - (inicioSemana.getDay() + (i * 7)));
      inicioSemana.setHours(0, 0, 0, 0);
      
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(finSemana.getDate() + 6);
      finSemana.setHours(23, 59, 59, 999);
      
      const total = await this.asistenciaRepository.count({
        where: { fecha: Between(inicioSemana, finSemana) }
      });
      
      const presentes = await this.asistenciaRepository.count({
        where: { 
          fecha: Between(inicioSemana, finSemana),
          estado_asistencia: In([EstadoAsistencia.PUNTUAL, EstadoAsistencia.TARDANZA])
        }
      });
      
      semanal.push({
        semana: `Sem ${i + 1}`,
        porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0,
        total,
        presentes
      });
    }

    // Tendencias mensuales (últimos 12 meses)
    const mensual: Array<{
      mes: string;
      porcentaje: number;
      total: number;
      presentes: number;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const inicioMes = new Date();
      inicioMes.setMonth(inicioMes.getMonth() - i);
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const finMes = new Date(inicioMes);
      finMes.setMonth(finMes.getMonth() + 1);
      finMes.setDate(0);
      finMes.setHours(23, 59, 59, 999);
      
      const total = await this.asistenciaRepository.count({
        where: { fecha: Between(inicioMes, finMes) }
      });
      
      const presentes = await this.asistenciaRepository.count({
        where: { 
          fecha: Between(inicioMes, finMes),
          estado_asistencia: In([EstadoAsistencia.PUNTUAL, EstadoAsistencia.TARDANZA])
        }
      });
      
      mensual.push({
        mes: inicioMes.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0,
        total,
        presentes
      });
    }

    return { diario, semanal, mensual };
  }

  /**
   * Obtiene mapa de calor - TODA LA DATA
   */
  private async obtenerMapaCalor(): Promise<MapaCalor> {
    
    // Por día de la semana
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const porDiaSemana: Array<{
      dia: string;
      porcentaje: number;
      total: number;
    }> = [];
    
    for (let i = 0; i < 7; i++) {
      const total = await this.asistenciaRepository
        .createQueryBuilder('asistencia')
        .leftJoinAndSelect('asistencia.alumno', 'alumno')
        .andWhere('DAYOFWEEK(asistencia.fecha) = :dia', { dia: i + 1 })
        .getCount();
      
      const presentes = await this.asistenciaRepository
        .createQueryBuilder('asistencia')
        .leftJoinAndSelect('asistencia.alumno', 'alumno')
        .andWhere('DAYOFWEEK(asistencia.fecha) = :dia', { dia: i + 1 })
        .andWhere('asistencia.estado_asistencia IN (:...estados)', { 
          estados: [EstadoAsistencia.PUNTUAL, EstadoAsistencia.TARDANZA] 
        })
        .getCount();
      
      porDiaSemana.push({
        dia: diasSemana[i],
        porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0,
        total
      });
    }

    // Por hora (últimas 24 horas)
    const porHora: Array<{
      hora: string;
      cantidad: number;
      porcentaje: number;
    }> = [];
    for (let i = 0; i < 24; i++) {
      const cantidad = await this.asistenciaRepository
        .createQueryBuilder('asistencia')
        .andWhere('HOUR(asistencia.fecha) = :hora', { hora: i })
        .getCount();
      
      porHora.push({
        hora: `${i.toString().padStart(2, '0')}:00`,
        cantidad,
        porcentaje: 0 // Se calculará en el frontend
      });
    }

    return { por_dia_semana: porDiaSemana, por_hora: porHora };
  }

  /**
   * Obtiene distribución de estados - TODA LA DATA
   */
  private async obtenerDistribucionEstados(): Promise<DistribucionEstados> {
    
    const [puntual, ausente, tardanza, justificado, anulado, extra] = await Promise.all([
      this.asistenciaRepository.count({ where: { estado_asistencia: EstadoAsistencia.PUNTUAL } }),
      this.asistenciaRepository.count({ where: { estado_asistencia: EstadoAsistencia.AUSENTE } }),
      this.asistenciaRepository.count({ where: { estado_asistencia: EstadoAsistencia.TARDANZA } }),
      this.asistenciaRepository.count({ where: { estado_asistencia: EstadoAsistencia.JUSTIFICADO } }),
      this.asistenciaRepository.count({ where: { estado_asistencia: EstadoAsistencia.ANULADO } }),
      this.asistenciaRepository.count({ where: { estado_asistencia: EstadoAsistencia.EXTRA } })
    ]);

    return { puntual, ausente, tardanza, justificado, anulado, extra };
  }

  /**
   * Obtiene lista de ausentes y tardanzas - TODA LA DATA
   */
  private async obtenerListaAusentes(): Promise<ListaAusentes> {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    // Ausentes del día
    const ausentesDia = await this.asistenciaRepository.find({
      where: { 
        fecha: Between(inicioDia, finDia),
        estado_asistencia: EstadoAsistencia.AUSENTE
      },
      relations: ['alumno', 'alumno.turno']
    });

    // Tardanzas del día
    const tardanzasDia = await this.asistenciaRepository.find({
      where: { 
        fecha: Between(inicioDia, finDia),
        estado_asistencia: EstadoAsistencia.TARDANZA
      },
      relations: ['alumno', 'alumno.turno']
    });

    // Registros recientes (últimas 10)
    const registrosRecientes = await this.asistenciaRepository.find({
      relations: ['alumno'],
      order: { fecha: 'DESC' },
      take: 10
    });

    return {
      ausentes_dia: ausentesDia.map(a => ({
        alumno: `${a.alumno.nombre} ${a.alumno.apellido}`,
        codigo: a.alumno.codigo,
        nivel: a.alumno.nivel,
        grado: a.alumno.grado,
        seccion: a.alumno.seccion,
        turno: a.alumno.turno?.turno || 'Sin turno',
        dias_ausente_consecutivos: 0 // Implementar lógica de días consecutivos
      })),
      tardanzas_dia: tardanzasDia.map(a => ({
        alumno: `${a.alumno.nombre} ${a.alumno.apellido}`,
        codigo: a.alumno.codigo,
        nivel: a.alumno.nivel,
        grado: a.alumno.grado,
        seccion: a.alumno.seccion,
        turno: a.alumno.turno?.turno || 'Sin turno',
        hora_llegada: a.hora_de_llegada || '',
        tiempo_retraso: a.hora_de_llegada && a.alumno.turno ? 
          this.calcularTiempoRetraso(a.hora_de_llegada, a.alumno.turno.hora_inicio) : 0
      })),
      registros_recientes: registrosRecientes.map(a => ({
        alumno: `${a.alumno.nombre} ${a.alumno.apellido}`,
        codigo: a.alumno.codigo,
        estado: a.estado_asistencia,
        hora_llegada: a.hora_de_llegada,
        hora_salida: a.hora_salida,
        fecha: a.fecha.toISOString().split('T')[0]
      }))
    };
  }

  /**
   * Obtiene alertas y anomalías - TODA LA DATA
   */
  private async obtenerAlertasAnomalias(): Promise<AlertasAnomalias> {
    // Implementar lógica de alertas
    return {
      ausencias_prolongadas: [],
      patrones_irregulares: [],
      eventos_importantes: []
    };
  }

  /**
   * Construye la cláusula WHERE basada en los filtros
   */
  private buildWhereClause(fechaInicio: Date, fechaFin: Date, filtros: EstadisticasAsistenciaDto) {
    const whereClause: any = {
      fecha: Between(fechaInicio, fechaFin)
    };

    if (filtros.estado) {
      whereClause.estado_asistencia = filtros.estado;
    }

    return whereClause;
  }

  /**
   * Convierte hora a minutos
   */
  private convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  /**
   * Calcula tiempo de retraso en minutos
   */
  private calcularTiempoRetraso(horaLlegada: string, horaTurno: string): number {
    const minutosLlegada = this.convertirHoraAMinutos(horaLlegada);
    const minutosTurno = this.convertirHoraAMinutos(horaTurno);
    return Math.max(0, minutosLlegada - minutosTurno);
  }

  /**
   * Obtiene TODOS los datos completos de asistencia
   */
  private async obtenerDatosCompletos(): Promise<{
    total_asistencias: number;
    total_alumnos: number;
    fecha_mas_antigua: string | null;
    fecha_mas_reciente: string | null;
    asistencias_por_nivel: Record<string, number>;
    asistencias_por_grado: Record<string, number>;
    asistencias_por_turno: Record<string, number>;
    asistencias_por_estado: Record<string, number>;
    asistencias_detalladas: Array<{
      id: string;
      alumno: string;
      codigo: string;
      nivel: string;
      grado: number;
      seccion: string;
      turno: string;
      estado: string;
      hora_llegada: string | null;
      hora_salida: string | null;
      fecha: string;
    }>;
  }> {
    // Obtener totales
    const totalAsistencias = await this.asistenciaRepository.count();
    const totalAlumnos = await this.alumnoRepository.count();

    // Obtener fechas extremas
    const fechaMasAntigua = await this.asistenciaRepository
      .createQueryBuilder('asistencia')
      .select('MIN(asistencia.fecha)', 'fecha')
      .getRawOne();

    const fechaMasReciente = await this.asistenciaRepository
      .createQueryBuilder('asistencia')
      .select('MAX(asistencia.fecha)', 'fecha')
      .getRawOne();

    // Obtener asistencias con relaciones completas
    const asistenciasCompletas = await this.asistenciaRepository.find({
      relations: ['alumno', 'alumno.turno'],
      order: { fecha: 'DESC' }
    });

    // Procesar datos por categorías
    const asistenciasPorNivel: Record<string, number> = {};
    const asistenciasPorGrado: Record<string, number> = {};
    const asistenciasPorTurno: Record<string, number> = {};
    const asistenciasPorEstado: Record<string, number> = {};

    const asistenciasDetalladas = asistenciasCompletas.map(a => {
      // Contar por nivel
      const nivel = a.alumno.nivel;
      asistenciasPorNivel[nivel] = (asistenciasPorNivel[nivel] || 0) + 1;

      // Contar por grado
      const grado = `${a.alumno.grado}°`;
      asistenciasPorGrado[grado] = (asistenciasPorGrado[grado] || 0) + 1;

      // Contar por turno
      const turno = a.alumno.turno?.turno || 'Sin turno';
      asistenciasPorTurno[turno] = (asistenciasPorTurno[turno] || 0) + 1;

      // Contar por estado
      const estado = a.estado_asistencia;
      asistenciasPorEstado[estado] = (asistenciasPorEstado[estado] || 0) + 1;

      return {
        id: a.id_asistencia,
        alumno: `${a.alumno.nombre} ${a.alumno.apellido}`,
        codigo: a.alumno.codigo,
        nivel: a.alumno.nivel,
        grado: a.alumno.grado,
        seccion: a.alumno.seccion,
        turno: turno,
        estado: estado,
        hora_llegada: a.hora_de_llegada,
        hora_salida: a.hora_salida,
        fecha: a.fecha.toISOString().split('T')[0]
      };
    });

    return {
      total_asistencias: totalAsistencias,
      total_alumnos: totalAlumnos,
      fecha_mas_antigua: fechaMasAntigua?.fecha || null,
      fecha_mas_reciente: fechaMasReciente?.fecha || null,
      asistencias_por_nivel: asistenciasPorNivel,
      asistencias_por_grado: asistenciasPorGrado,
      asistencias_por_turno: asistenciasPorTurno,
      asistencias_por_estado: asistenciasPorEstado,
      asistencias_detalladas: asistenciasDetalladas
    };
  }

  /**
   * Obtiene fecha de inicio del mes
   */
  private getFechaInicioMes(): Date {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }
}
