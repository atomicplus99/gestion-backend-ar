import { ApiProperty } from '@nestjs/swagger';
import { SuccessResponseDto } from '../../../../alumno/domain/dtos/response/SuccessResponse.dto';
import { ApoderadoResponseDto } from '../ApoderadoResponse.dto';

export class ApoderadoCreateResponseDto extends SuccessResponseDto<ApoderadoResponseDto> {
  @ApiProperty({ 
    description: 'ID del apoderado creado',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  apoderadoId: string;
}
