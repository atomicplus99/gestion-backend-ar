import { Apoderado as ApoderadoDomain } from '../../domain/entities/Apoderado';
import { Apoderado as ApoderadoORM } from '../orm/entities/apoderado.entity';
import { TipoRelacion } from '../../domain/enums/tipo-relacion.enum';

export class ApoderadoMapper {
  static toDomain(orm: ApoderadoORM): ApoderadoDomain {
    return new ApoderadoDomain(
      orm.id_apoderado,
      orm.nombre,
      orm.tipo_relacion,
      orm.apellido || undefined,
      orm.telefono || undefined,
      orm.email || undefined,
      orm.dni || undefined,
      orm.relacion_especifica || undefined,
      orm.activo,
      orm.fecha_creacion,
      orm.fecha_actualizacion,
      orm.pupilos || [], // Mantener los objetos completos de los alumnos
      orm.medios_notificacion || undefined
    );
  }

  static toORM(domain: ApoderadoDomain): ApoderadoORM {
    const orm = new ApoderadoORM();
    // No asignar id_apoderado si es undefined - TypeORM lo generará automáticamente
    if (domain.id_apoderado) {
      orm.id_apoderado = domain.id_apoderado;
    }
    orm.nombre = domain.nombre;
    orm.apellido = domain.apellido || null;
    orm.telefono = domain.telefono || null;
    orm.email = domain.email || null;
    orm.dni = domain.dni || null;
    orm.tipo_relacion = domain.tipo_relacion as TipoRelacion;
    orm.relacion_especifica = domain.relacion_especifica || null;
    orm.activo = domain.activo;
    orm.fecha_creacion = domain.fecha_creacion;
    orm.fecha_actualizacion = domain.fecha_actualizacion;
    orm.medios_notificacion = domain.medios_notificacion || [];
    return orm;
  }

  static toResponse(domain: ApoderadoDomain): any {
    return {
      id_apoderado: domain.id_apoderado,
      nombre: domain.nombre,
      apellido: domain.apellido,
      telefono: domain.telefono,
      email: domain.email,
      dni: domain.dni,
      tipo_relacion: domain.tipo_relacion,
      relacion_especifica: domain.relacion_especifica,
      activo: domain.activo,
      fecha_creacion: domain.fecha_creacion,
      fecha_actualizacion: domain.fecha_actualizacion,
      pupilos: domain.pupilos || [], // Asegurar que se pasen los datos completos
      medios_notificacion: domain.medios_notificacion
    };
  }
}
