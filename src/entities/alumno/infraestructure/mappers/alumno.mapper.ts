import { RegisterAlumnoDto } from "src/auth/dto/alumno/registers/alumno-create.dto";
import { Alumno } from "../orm/entities/alumno.entity";
import { Turno } from "../../../turno/turno.entity";
import { Usuario } from "../../../usuario/usuario.entity";
import { UpdateAlumnoDto } from "../../domain/dtos/UpdateAlumno.dto";


export class AlumnoMapper {
  static toEntity(dto: RegisterAlumnoDto, turno: Turno, usuario?: Usuario | null): Alumno {
    const a = new Alumno();
    Object.assign(a, {
      codigo: dto.codigo,
      dni_alumno: dto.dni_alumno,
      nombre: dto.nombre,
      apellido: dto.apellido,
      fecha_nacimiento: new Date(dto.fecha_nacimiento),
      direccion: dto.direccion,
      codigo_qr: dto.codigo_qr,
      nivel: dto.nivel,
      grado: dto.grado,
      seccion: dto.seccion,
      turno,
      usuario,
    });
    return a;
  }

  static toDomain(orm: Alumno): Partial<Alumno> {
    return {
      id_alumno:       orm.id_alumno,
      codigo:          orm.codigo,
      dni_alumno:      orm.dni_alumno,
      nombre:          orm.nombre,
      apellido:        orm.apellido,
      fecha_nacimiento: orm.fecha_nacimiento,
      direccion:       orm.direccion,
      codigo_qr:       orm.codigo_qr,
      nivel:           orm.nivel,
      grado:           orm.grado,
      seccion:         orm.seccion,
      turno:           orm.turno,
      usuario:         orm.usuario,
    };
  }

  static updateAlumnoMapper(alumno: Alumno, dto: UpdateAlumnoDto): Alumno {
    // Solo actualizar los campos que se proporcionen en el DTO
    if (dto.codigo !== undefined) {
      alumno.codigo = dto.codigo;
    }
    if (dto.dni_alumno !== undefined) {
      alumno.dni_alumno = dto.dni_alumno;
    }
    if (dto.nombre !== undefined) {
      alumno.nombre = dto.nombre;
    }
    if (dto.apellido !== undefined) {
      alumno.apellido = dto.apellido;
    }
    if (dto.fecha_nacimiento !== undefined) {
      alumno.fecha_nacimiento = new Date(dto.fecha_nacimiento);
    }
    if (dto.direccion !== undefined) {
      alumno.direccion = dto.direccion;
    }
    if (dto.codigo_qr !== undefined) {
      alumno.codigo_qr = dto.codigo_qr;
    }
    if (dto.nivel !== undefined) {
      alumno.nivel = dto.nivel;
    }
    if (dto.grado !== undefined) {
      alumno.grado = dto.grado;
    }
    if (dto.seccion !== undefined) {
      alumno.seccion = dto.seccion;
    }
    
    return alumno;
  }
}
