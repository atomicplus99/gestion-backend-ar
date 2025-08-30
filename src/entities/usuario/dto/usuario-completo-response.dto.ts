import { ApiProperty } from '@nestjs/swagger';
import { RolUsuario } from '../../../common/enums/rol-usuario.enum';

export class UsuarioCompletoResponseDto {
  @ApiProperty({ description: 'ID único del usuario' })
  id_user: string;

  @ApiProperty({ description: 'Nombre de usuario' })
  nombre_usuario: string;

  @ApiProperty({ description: 'Rol del usuario', enum: RolUsuario })
  rol_usuario: RolUsuario;

  @ApiProperty({ description: 'URL de la imagen de perfil' })
  profile_image: string;

  @ApiProperty({ description: 'Estado activo del usuario' })
  activo: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  fecha_creacion: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  fecha_actualizacion: Date;

  // Datos de la entidad enlazada
  @ApiProperty({ description: 'Datos del alumno (si aplica)', required: false })
  alumno?: {
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
  };

  @ApiProperty({ description: 'Datos del auxiliar (si aplica)', required: false })
  auxiliar?: {
    id_auxiliar: string;
    nombre: string;
    apellido: string;
    correo_electronico: string;
    telefono: string;
    dni_auxiliar: string;
    fecha_nacimiento: Date;
  };

  @ApiProperty({ description: 'Datos del administrador (si aplica)', required: false })
  administrador?: {
    id_administrador: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    direccion: string;
  };

  @ApiProperty({ description: 'Datos del director (si aplica)', required: false })
  director?: {
    id_director: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    direccion: string;
  };
}

export class UsuariosCompletosResponseDto {
  @ApiProperty({ description: 'Lista de usuarios con entidades enlazadas', type: [UsuarioCompletoResponseDto] })
  usuarios: UsuarioCompletoResponseDto[];

  @ApiProperty({ description: 'Total de usuarios encontrados' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Límite por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}
