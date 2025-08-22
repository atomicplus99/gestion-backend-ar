import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T> {
  @ApiProperty({ description: 'Indica si la operación fue exitosa', example: true })
  success: boolean;

  @ApiProperty({ description: 'Mensaje descriptivo del resultado' })
  message: string;

  @ApiProperty({ description: 'Fecha y hora de la operación' })
  timestamp: string;

  @ApiProperty({ description: 'Datos de la respuesta' })
  data?: T;
}

export class AlumnoUpdateResponseDto {
  @ApiProperty({ description: 'Indica si la operación fue exitosa', example: true })
  success: boolean;

  @ApiProperty({ description: 'Mensaje descriptivo del resultado' })
  message: string;

  @ApiProperty({ description: 'Objeto completo del alumno actualizado' })
  alumno: any;

  @ApiProperty({ description: 'Fecha y hora de la actualización' })
  timestamp: string;
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'Indica si la operación fue exitosa', example: false })
  success: boolean;

  @ApiProperty({ description: 'Descripción del error' })
  message: string;

  @ApiProperty({ description: 'Código o tipo de error' })
  error: string;

  @ApiProperty({ description: 'Código HTTP del error' })
  statusCode: number;

  @ApiProperty({ description: 'Fecha y hora del error' })
  timestamp: string;
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({ description: 'Array con errores por campo' })
  errors: Array<{
    field: string;
    value: any;
    message: string;
  }>;
}
