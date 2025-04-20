import { AlumnoDto } from "src/auth/dto/alumno/alumno.dto";
import { Alumno } from "./alumno.entity";
import { Turno } from "../turno/turno.entity";
import { Usuario } from "../usuario/usuario.entity";


export class AlumnoMapper {
  static toEntity(dto: AlumnoDto, turno: Turno, usuario?: Usuario | null): Alumno {
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
}
