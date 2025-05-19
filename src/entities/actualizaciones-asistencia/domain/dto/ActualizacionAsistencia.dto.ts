import { IsNotEmpty, IsUUID, IsString } from 'class-validator';

export class CreateActualizacionAsistenciaDto {
  
  @IsUUID()
  @IsNotEmpty()
  id_asistencia: string;

  @IsUUID()
  @IsNotEmpty()
  id_alumno: string;

  @IsUUID()
  @IsNotEmpty()
  id_auxiliar: string;

  @IsString()
  @IsNotEmpty()
  motivo: string;
}
