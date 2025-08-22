export interface AlumnoExcelData {
  grado?: string | number;
  seccion?: string;
  numeroDocumento?: string;
  dni?: string;
  codigo?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  nombre?: string;
  fechaNacimiento?: string | Date;
  nivel?: string;
  sexo?: string;
  edad?: string | number;
  estadoMatricula?: string;
  tipoVacante?: string;
  validadoReniec?: string;
}

export interface ImportAlumnosExcelDto {
  alumnos: AlumnoExcelData[];
  turnoId: string;
  crearUsuarios: boolean;
}
