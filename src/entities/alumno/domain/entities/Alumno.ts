// src/domain/entities/Alumno.ts

export class Alumno {
  constructor(
    public  id_alumno: string,
    public codigo: string,
    public dni_alumno: string,
    public nombre: string,
    public apellido: string,
    public fecha_nacimiento: Date,
    public direccion: string,
    public codigo_qr: string,
    public nivel: string,
    public grado: number,
    public seccion: string,
    public id_turno?: string,
    public id_usuario?: string,
  ) {}
}
