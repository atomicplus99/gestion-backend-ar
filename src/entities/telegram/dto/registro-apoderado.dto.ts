export class IniciarRegistroDto {
  dni_apoderado: string;
}

export class ConfirmarRegistroDto {
  dni_apoderado: string;
  dni_alumnos: string[]; // Array de DNIs de alumnos asignados
}

export class ApoderadoRegistradoDto {
  id_apoderado: string;
  dni: string;
  nombres: string;
  apellidos: string;
  alumnos: AlumnoAsignadoDto[];
}

export class AlumnoAsignadoDto {
  id_alumno: string;
  dni: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  grado: number;
  seccion: string;
  codigo: string;
}
