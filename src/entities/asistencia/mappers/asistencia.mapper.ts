export class AsistenciaMapper {
    static toResponse(asistencia: any) {
      return {
        nombre: asistencia.alumno.nombre,
        apellido: asistencia.alumno.apellido,
        llegada: asistencia.hora_de_llegada,
        estado: asistencia.estado_asistencia,
        fecha: asistencia.fecha,
      };
    }
  }
  