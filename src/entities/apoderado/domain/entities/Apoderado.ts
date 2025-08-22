export class Apoderado {
  constructor(
    public id_apoderado: string | undefined,
    public nombre: string,
    public tipo_relacion: string,
    public apellido?: string,
    public telefono?: string,
    public email?: string,
    public dni?: string,
    public relacion_especifica?: string,
    public activo: boolean = true,
    public fecha_creacion: Date = new Date(),
    public fecha_actualizacion: Date = new Date(),
    public pupilos?: string[] | any[], // IDs de alumnos o objetos completos
    public medios_notificacion?: any[]
  ) {}
}
