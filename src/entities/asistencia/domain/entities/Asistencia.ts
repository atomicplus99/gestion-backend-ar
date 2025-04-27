import { Alumno } from "src/entities/alumno/domain/entities/Alumno";
import { EstadoAsistencia } from "../../enums/estado-asistencia.enum";

export class AsistenciaModel {
    constructor(
      public readonly id_asistencia: string,
      public horaLlegada: string,
      public estado: EstadoAsistencia,
      public fecha: Date,
      public alumno: Alumno,
    ) {}
  }