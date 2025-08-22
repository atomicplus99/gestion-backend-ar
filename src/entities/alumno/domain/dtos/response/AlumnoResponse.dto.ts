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

export class ApoderadoInfoDto {
  @ApiProperty({
    description: 'ID del apoderado',
    example: '2e12a93b-e97f-4654-a3cb-4be56b312088'
  })
  id_apoderado: string;

  @ApiProperty({
    description: 'Nombre del apoderado',
    example: 'AbeL'
  })
  nombre: string;

  @ApiProperty({
    description: 'Apellido del apoderado',
    example: 'Arias Espinoza'
  })
  apellido: string;

  @ApiProperty({
    description: 'Teléfono del apoderado',
    example: '991753149'
  })
  telefono: string;

  @ApiProperty({
    description: 'Email del apoderado',
    example: 'abel.ariase.soft@gmail.com'
  })
  email: string;

  @ApiProperty({
    description: 'DNI del apoderado',
    example: '78945612'
  })
  dni: string;

  @ApiProperty({
    description: 'Tipo de relación con el alumno',
    example: 'TIO'
  })
  tipo_relacion: string;
}

export class AlumnoResponseDto {
  @ApiProperty({
    description: 'ID único del alumno',
    example: '12a2c6ed-74de-4002-8511-135b984b805e'
  })
  id_alumno: string;

  @ApiProperty({
    description: 'Código del alumno',
    example: '0165312025'
  })
  codigo: string;

  @ApiProperty({
    description: 'DNI del alumno',
    example: '72345678'
  })
  dni_alumno: string;

  @ApiProperty({
    description: 'Nombre del alumno',
    example: 'Pedro'
  })
  nombre: string;

  @ApiProperty({
    description: 'Apellido del alumno',
    example: 'Rojas'
  })
  apellido: string;

  @ApiProperty({
    description: 'Fecha de nacimiento del alumno',
    example: '2005-02-13'
  })
  fecha_nacimiento: Date;

  @ApiProperty({
    description: 'Dirección del alumno',
    example: 'Av. Grau 333'
  })
  direccion: string;

  @ApiProperty({
    description: 'Código QR del alumno',
    example: 'e9b45d98-5867-47af-9609-3c03cf39b8d9'
  })
  codigo_qr: string;

  @ApiProperty({
    description: 'Nivel educativo del alumno',
    example: 'Secundaria'
  })
  nivel: string;

  @ApiProperty({
    description: 'Grado del alumno',
    example: 2
  })
  grado: number;

  @ApiProperty({
    description: 'Sección del alumno',
    example: 'B'
  })
  seccion: string;

  @ApiProperty({
    description: 'Información del apoderado (solo si se solicita)',
    type: ApoderadoInfoDto,
    required: false,
    nullable: true
  })
  apoderado?: ApoderadoInfoDto | null;
}

export class AlumnoConApoderadoResponseDto extends AlumnoResponseDto {
  @ApiProperty({
    description: 'Información del apoderado',
    type: ApoderadoInfoDto,
    required: true
  })
  declare apoderado: ApoderadoInfoDto | null;
}
