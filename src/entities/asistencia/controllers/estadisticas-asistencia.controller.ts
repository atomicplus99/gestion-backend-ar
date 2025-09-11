import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EstadisticasAsistenciaService, EstadisticasAsistenciaDto } from '../services/estadisticas-asistencia.service';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';

@ApiTags('Estadísticas de Asistencia')
@Controller('asistencia/estadisticas')
export class EstadisticasAsistenciaController {
  constructor(
    private readonly estadisticasService: EstadisticasAsistenciaService
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener TODAS las estadísticas de asistencia',
    description: 'Endpoint que devuelve TODA la data de asistencia sin filtros. El frontend se encarga de filtrar y distribuir los datos.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            resumen: {
              type: 'object',
              properties: {
                porcentaje_dia: { type: 'number', description: 'Porcentaje de asistencia del día' },
                porcentaje_semana: { type: 'number', description: 'Porcentaje de asistencia de la semana' },
                porcentaje_mes: { type: 'number', description: 'Porcentaje de asistencia del mes' },
                total_presentes: { type: 'number', description: 'Total de estudiantes presentes' },
                total_ausentes: { type: 'number', description: 'Total de estudiantes ausentes' },
                total_tardanzas: { type: 'number', description: 'Total de tardanzas' },
                total_justificados: { type: 'number', description: 'Total de justificados' },
                total_anulados: { type: 'number', description: 'Total de anulados' }
              }
            },
            indicadores_puntualidad: {
              type: 'object',
              properties: {
                llegadas_tardias: { type: 'number', description: 'Número de llegadas tardías' },
                salidas_tempranas: { type: 'number', description: 'Número de salidas tempranas' },
                tiempo_promedio_tardanza: { type: 'number', description: 'Tiempo promedio de tardanza en minutos' },
                alumnos_mas_tardios: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      alumno: { type: 'string' },
                      tardanzas: { type: 'number' }
                    }
                  }
                }
              }
            },
            tendencias: {
              type: 'object',
              properties: {
                diario: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      fecha: { type: 'string' },
                      porcentaje: { type: 'number' },
                      total: { type: 'number' },
                      presentes: { type: 'number' }
                    }
                  }
                },
                semanal: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      semana: { type: 'string' },
                      porcentaje: { type: 'number' },
                      total: { type: 'number' },
                      presentes: { type: 'number' }
                    }
                  }
                },
                mensual: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      mes: { type: 'string' },
                      porcentaje: { type: 'number' },
                      total: { type: 'number' },
                      presentes: { type: 'number' }
                    }
                  }
                }
              }
            },
            mapa_calor: {
              type: 'object',
              properties: {
                por_dia_semana: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      dia: { type: 'string' },
                      porcentaje: { type: 'number' },
                      total: { type: 'number' }
                    }
                  }
                },
                por_hora: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      hora: { type: 'string' },
                      cantidad: { type: 'number' },
                      porcentaje: { type: 'number' }
                    }
                  }
                }
              }
            },
            distribucion_estados: {
              type: 'object',
              properties: {
                puntual: { type: 'number' },
                ausente: { type: 'number' },
                tardanza: { type: 'number' },
                justificado: { type: 'number' },
                anulado: { type: 'number' },
                extra: { type: 'number' }
              }
            },
            lista_ausentes: {
              type: 'object',
              properties: {
                ausentes_dia: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      alumno: { type: 'string' },
                      codigo: { type: 'string' },
                      nivel: { type: 'string' },
                      grado: { type: 'number' },
                      seccion: { type: 'string' },
                      turno: { type: 'string' },
                      dias_ausente_consecutivos: { type: 'number' }
                    }
                  }
                },
                tardanzas_dia: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      alumno: { type: 'string' },
                      codigo: { type: 'string' },
                      nivel: { type: 'string' },
                      grado: { type: 'number' },
                      seccion: { type: 'string' },
                      turno: { type: 'string' },
                      hora_llegada: { type: 'string' },
                      tiempo_retraso: { type: 'number' }
                    }
                  }
                },
                registros_recientes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      alumno: { type: 'string' },
                      codigo: { type: 'string' },
                      estado: { type: 'string' },
                      hora_llegada: { type: 'string' },
                      hora_salida: { type: 'string' },
                      fecha: { type: 'string' }
                    }
                  }
                }
              }
            },
            alertas_anomalias: {
              type: 'object',
              properties: {
                ausencias_prolongadas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      alumno: { type: 'string' },
                      codigo: { type: 'string' },
                      dias_ausente: { type: 'number' },
                      ultima_asistencia: { type: 'string' }
                    }
                  }
                },
                patrones_irregulares: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      alumno: { type: 'string' },
                      codigo: { type: 'string' },
                      patron: { type: 'string' },
                      descripcion: { type: 'string' }
                    }
                  }
                },
                eventos_importantes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      tipo: { type: 'string' },
                      descripcion: { type: 'string' },
                      fecha: { type: 'string' },
                      impacto: { type: 'string', enum: ['alto', 'medio', 'bajo'] }
                    }
                  }
                }
              }
            },
            filtros_aplicados: { type: 'object' },
            periodo: {
              type: 'object',
              properties: {
                fecha_inicio: { type: 'string' },
                fecha_fin: { type: 'string' }
              }
            }
          }
        }
      }
    }
  })
  async obtenerEstadisticasCompletas() {
    try {
      const estadisticas = await this.estadisticasService.obtenerEstadisticasCompletas();

      return {
        success: true,
        message: 'TODAS las estadísticas de asistencia obtenidas exitosamente',
        data: estadisticas
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al obtener estadísticas de asistencia',
        error: error.message
      };
    }
  }

}
