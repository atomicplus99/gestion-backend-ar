export interface TurnoDto {
    id_turno: string;
    turno: string;
    hora_inicio: string;
    hora_fin: string;
    hora_limite: string;
  }
  
  export interface UsuarioDto {
    id_user: string;
    nombre_usuario: string;
    rol_usuario: string;
  }
  
  export interface EstadoActualDto {
    estado: 'activo' | 'inactivo';
    observacion: string;
    fecha_actualizacion: Date;
  }
  
  export interface AlumnoEstadoResponseDto {
    id_alumno: string;
    codigo: string;
    dni_alumno: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento: Date;
    direccion: string;
    codigo_qr: string;
    nivel: string;
    grado: number;
    seccion: string;
    turno: TurnoDto | null;
    usuario: UsuarioDto | null;
    estado_actual: EstadoActualDto;
  }
  