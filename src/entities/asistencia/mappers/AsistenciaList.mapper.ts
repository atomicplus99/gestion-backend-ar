import { Alumno } from "src/entities/alumno/domain/entities/Alumno";
import { Asistencia } from "../asistencia.entity";
import { EstadoAsistencia } from "../enums/estado-asistencia.enum";
import { AsistenciaModel } from "../domain/entities/Asistencia";


export class AsistenciaMapper {
  static toDomain(ent: Asistencia): AsistenciaModel {
    const alumnoDomain = new Alumno(
      ent.alumno.id_alumno,
      ent.alumno.codigo,
      ent.alumno.dni_alumno,
      ent.alumno.nombre,
      ent.alumno.apellido,
      ent.alumno.fecha_nacimiento,
      ent.alumno.direccion,
      ent.alumno.codigo_qr,
      ent.alumno.nivel,
      ent.alumno.grado,
      ent.alumno.seccion,
      ent.alumno.turno?.id_turno,
      ent.alumno.usuario?.id_user,
    );

    return new AsistenciaModel(
      ent.id_asistencia,
      ent.hora_de_llegada,
      ent.estado_asistencia as EstadoAsistencia,
      ent.fecha,
      alumnoDomain,
    );
  }
}
