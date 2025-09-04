import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNotEmpty, IsDateString } from 'class-validator';
import { EstadoAsistencia } from '../../enums/estado-asistencia.enum';

export class UpdateAsistenciaRequestDto {
  @ApiProperty({
    description: 'Nueva hora de llegada (opcional)',
    example: '08:15',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'La hora de llegada debe ser una cadena de texto' })
  hora_de_llegada?: string;

  @ApiProperty({
    description: 'Nueva hora de salida (opcional)',
    example: '14:00',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'La hora de salida debe ser una cadena de texto' })
  hora_salida?: string;

  @ApiProperty({
    description: 'Nuevo estado de asistencia (opcional)',
    enum: EstadoAsistencia,
    example: EstadoAsistencia.PUNTUAL,
    required: false
  })
  @IsOptional()
  @IsEnum(EstadoAsistencia, { message: 'El estado de asistencia debe ser PUNTUAL o TARDANZA' })
  estado_asistencia?: EstadoAsistencia;

  @ApiProperty({
    description: 'Motivo del cambio (requerido)',
    example: 'Corrección de hora de llegada por error de registro',
    required: true
  })
  @IsNotEmpty({ message: 'El motivo del cambio es obligatorio' })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  motivo: string;

  @ApiProperty({
    description: 'ID del auxiliar que realiza el cambio (opcional si se envía id_usuario)',
    example: 'uuid-del-auxiliar',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El ID del auxiliar debe ser una cadena de texto' })
  id_auxiliar?: string;

  @ApiProperty({
    description: 'ID del usuario actor (ADMINISTRADOR o DIRECTOR). Opcional si se envía id_auxiliar',
    example: 'uuid-del-administrador-o-director',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El ID de usuario debe ser una cadena de texto' })
  id_usuario?: string;

  @ApiProperty({
    description: 'Fecha de la asistencia a actualizar (YYYY-MM-DD, opcional). Si no se envía, se usa la fecha actual Perú.',
    example: '2025-08-30',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  fecha?: string;
}
