import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { EstadoAlumno } from 'src/entities/estado-alumnos/entities/estado-alumno.entity';
import { AlumnoEstadoResponseDto } from '../entities/dto/AlumnoEstadoResponse.dto';


export class AlumnoEstadoMapper {
  static toDto(alumno: Alumno, estado: EstadoAlumno): AlumnoEstadoResponseDto {
    return {
      id_alumno: alumno.id_alumno,
      codigo: alumno.codigo,
      dni_alumno: alumno.dni_alumno,
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      fecha_nacimiento: alumno.fecha_nacimiento,
      direccion: alumno.direccion,
      codigo_qr: alumno.codigo_qr,
      nivel: alumno.nivel,
      grado: alumno.grado,
      seccion: alumno.seccion,
      turno: alumno.turno
        ? {
            id_turno: alumno.turno.id_turno,
            turno: alumno.turno.turno,
            hora_inicio: alumno.turno.hora_inicio,
            hora_fin: alumno.turno.hora_fin,
            hora_limite: alumno.turno.hora_limite,
          }
        : null,
      usuario: alumno.usuario
        ? {
            id_user: alumno.usuario.id_user,
            nombre_usuario: alumno.usuario.nombre_usuario,
            rol_usuario: alumno.usuario.rol_usuario,
          }
        : null,
      estado_actual: {
        estado: estado.estado,
        observacion: estado.observacion,
        fecha_actualizacion: estado.fecha_actualizacion,
      },
    };
  }
}
