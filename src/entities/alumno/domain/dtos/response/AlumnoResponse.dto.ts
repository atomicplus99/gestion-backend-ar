import { ApiProperty } from '@nestjs/swagger';
import { Turno } from '../../../../turno/turno.entity';
import { Usuario } from '../../../../usuario/usuario.entity';

export class TurnoResponseDto {
  @ApiProperty({ description: 'ID único del turno' })
  id_turno: string;

  @ApiProperty({ description: 'Hora de inicio del turno' })
  hora_inicio: string;

  @ApiProperty({ description: 'Hora de fin del turno' })
  hora_fin: string;

  @ApiProperty({ description: 'Hora límite del turno' })
  hora_limite: string;

  @ApiProperty({ description: 'Nombre del turno' })
  turno: string;
}

export class UsuarioResponseDto {
  @ApiProperty({ description: 'ID único del usuario' })
  id_user: string;

  @ApiProperty({ description: 'Nombre de usuario' })
  nombre_usuario: string;

  @ApiProperty({ description: 'Contraseña del usuario' })
  password_user: string;

  @ApiProperty({ description: 'Rol del usuario' })
  rol_usuario: string;

  @ApiProperty({ description: 'Imagen de perfil del usuario' })
  profile_image: string;
}

export class AlumnoResponseDto {
  @ApiProperty({ description: 'ID único del alumno' })
  id_alumno: string;

  @ApiProperty({ description: 'Código de 14 dígitos del alumno' })
  codigo: string;

  @ApiProperty({ description: 'DNI de 8 dígitos del alumno' })
  dni_alumno: string;

  @ApiProperty({ description: 'Nombre del alumno' })
  nombre: string;

  @ApiProperty({ description: 'Apellido del alumno' })
  apellido: string;

  @ApiProperty({ description: 'Fecha de nacimiento en formato ISO' })
  fecha_nacimiento: Date;

  @ApiProperty({ description: 'Dirección completa del alumno' })
  direccion: string;

  @ApiProperty({ description: 'Código QR generado' })
  codigo_qr: string;

  @ApiProperty({ description: 'Nivel educativo' })
  nivel: string;

  @ApiProperty({ description: 'Número del grado' })
  grado: number;

  @ApiProperty({ description: 'Letra de la sección' })
  seccion: string;

  @ApiProperty({ description: 'Información del turno', type: TurnoResponseDto })
  turno: TurnoResponseDto;

  @ApiProperty({ description: 'Información del usuario', type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;
}
