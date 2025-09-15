import { Asistencia } from 'src/entities/asistencia/asistencia.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { CreateActualizacionAsistenciaDto } from '../../domain/dto/ActualizacionAsistencia.dto';
// ✅ corregido aquí
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { ActualizacionesAsistencia } from '../orm/actualizaciones-asistencia.entity';

export class ActualizacionAsistenciaMapper {
  static toEntity(dto: CreateActualizacionAsistenciaDto): ActualizacionesAsistencia {
    const entity = new ActualizacionesAsistencia();

    entity.asistencia = new Asistencia();
    entity.asistencia.id_asistencia = dto.id_asistencia;

    entity.alumno = new Alumno();
    entity.alumno.id_alumno = dto.id_alumno;

    entity.auxiliar = new Auxiliar();
    entity.auxiliar.id_auxiliar = dto.id_auxiliar;

    entity.motivo = dto.motivo;
    entity.accion_realizada = dto.accion_realizada;

    return entity;
  }
}
