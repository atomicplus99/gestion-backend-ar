import { ApiProperty } from '@nestjs/swagger';

export class ApoderadoErrorResponseDto {
  @ApiProperty({ 
    description: 'Indica si la operación fue exitosa',
    example: false 
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Mensaje descriptivo del error',
    example: 'Error al procesar la solicitud'
  })
  message: string;

  @ApiProperty({ 
    description: 'Tipo de error específico',
    example: 'VALIDATION_ERROR',
    required: false
  })
  error?: string;

  @ApiProperty({ 
    description: 'Código HTTP del error',
    example: 400,
    required: false
  })
  statusCode?: number;

  @ApiProperty({ 
    description: 'Fecha y hora del error',
    example: '2024-01-15T20:30:45.123Z',
    required: false
  })
  timestamp?: string;

  @ApiProperty({ 
    description: 'Campo específico que causó el error',
    example: 'dni',
    required: false
  })
  field?: string;

  @ApiProperty({ 
    description: 'Valor inválido que causó el error',
    example: '12345678',
    required: false
  })
  invalidValue?: any;

  @ApiProperty({ 
    description: 'Sugerencia para resolver el error',
    example: 'Verifique que el DNI no esté registrado previamente',
    required: false
  })
  suggestion?: string;

  @ApiProperty({ 
    description: 'Lista de alumnos que ya tienen apoderado asignado',
    example: ['Juan Pérez (A001)', 'María García (A002)'],
    required: false
  })
  alumnosConApoderado?: string[];
}
