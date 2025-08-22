import { TipoRelacion } from '../enums/tipo-relacion.enum';

export class ApoderadoResponseDto {
  id_apoderado: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  dni?: string;
  tipo_relacion: TipoRelacion;
  relacion_especifica?: string;
  activo: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  pupilos?: any[];
  medios_notificacion?: any[];
}
