import { Alumno } from '../entities/Alumno';

export interface AlumnoImportado {
  id_alumno: string;
  codigo: string;
  dni_alumno: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  direccion: string;
  nivel: string;
  grado: number;
  seccion: string;
  turno_id: string;
  qr_code: string;
  usuario: {
    id_user: string;
    username: string;
    role: string;
  };
  estado: string;
}

export interface ErrorValidacion {
  fila: number;
  campo: string;
  valor: string;
  error: string;
}

export interface EstadisticasImportacion {
  total_importados: number;
  exitosos: number;
  con_errores: number;
  usuarios_creados: number;
  tiempo_procesamiento: number;
}

export interface ImportAlumnosExcelResponse {
  success: boolean;
  message: string;
  total: number;
  data: AlumnoImportado[];
  estadisticas: EstadisticasImportacion;
  errores?: ErrorValidacion[];
  error?: string;
}
