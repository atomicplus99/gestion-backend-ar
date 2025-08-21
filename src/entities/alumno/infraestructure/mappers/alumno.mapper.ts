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
      nivel:           orm.nivel,
      grado:           orm.grado,
      seccion:         orm.seccion,
    };
  }

  static updateAlumnoMapper(alumno: Alumno, dto: UpdateAlumnoDto): Alumno {
    alumno.codigo = dto.codigo;
    alumno.dni_alumno = dto.dni_alumno;
    alumno.nombre = dto.nombre; 
    alumno.apellido = dto.apellido;
    alumno.fecha_nacimiento = new Date(dto.fecha_nacimiento);
    alumno.direccion = dto.direccion;
    alumno.nivel = dto.nivel;
    alumno.grado = dto.grado;
    alumno.seccion = dto.seccion;
    return alumno;
  }
}
