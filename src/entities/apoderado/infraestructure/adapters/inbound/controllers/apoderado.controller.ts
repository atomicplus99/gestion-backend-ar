import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateApoderadoDto } from '../../../../domain/dtos/CreateApoderado.dto';
import { UpdateApoderadoDto } from '../../../../domain/dtos/UpdateApoderado.dto';
import { AssignStudentsRequestDto } from '../../../../domain/dtos/AssignStudentsRequest.dto';
import { CreateApoderadoUseCase } from '../../../../domain/ports/inbound/cases/create-apoderado.usecase';
import { GetApoderadosUseCase } from '../../../../domain/ports/inbound/cases/get-apoderados.usecase';
import { GetApoderadoByIdUseCase } from '../../../../domain/ports/inbound/cases/get-apoderado-by-id.usecase';
import { GetApoderadoByDniUseCase } from '../../../../domain/ports/inbound/cases/get-apoderado-by-dni.usecase';
import { UpdateApoderadoUseCase } from '../../../../domain/ports/inbound/cases/update-apoderado.usecase';
import { DeleteApoderadoUseCase } from '../../../../domain/ports/inbound/cases/delete-apoderado.usecase';
import { AssignStudentsUseCase } from '../../../../domain/ports/inbound/cases/assign-students.usecase';
import { RemoveStudentsUseCase } from '../../../../domain/ports/inbound/cases/remove-students.usecase';
import { ApoderadoMapper } from '../../../mappers/apoderado.mapper';
import { ApoderadoCreateResponseDto } from '../../../../domain/dtos/response/ApoderadoCreateResponse.dto';
import { ApoderadoErrorResponseDto } from '../../../../domain/dtos/response/ApoderadoErrorResponse.dto';
import { SuccessResponseDto, ErrorResponseDto } from '../../../../../alumno/domain/dtos/response/SuccessResponse.dto';

@ApiTags('Apoderados')
@Controller('apoderados')
export class ApoderadoController {
  constructor(
    private readonly createApoderadoUseCase: CreateApoderadoUseCase,
    private readonly getApoderadosUseCase: GetApoderadosUseCase,
    private readonly getApoderadoByIdUseCase: GetApoderadoByIdUseCase,
    private readonly getApoderadoByDniUseCase: GetApoderadoByDniUseCase,
    private readonly updateApoderadoUseCase: UpdateApoderadoUseCase,
    private readonly deleteApoderadoUseCase: DeleteApoderadoUseCase,
    private readonly assignStudentsUseCase: AssignStudentsUseCase,
    private readonly removeStudentsUseCase: RemoveStudentsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Crear un nuevo apoderado',
    description: 'Crea un nuevo apoderado en el sistema con la información proporcionada'
  })
  @ApiBody({ 
    type: CreateApoderadoDto,
    description: 'Datos del apoderado a crear'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Apoderado creado exitosamente',
    type: ApoderadoCreateResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error en los datos proporcionados',
    type: ApoderadoErrorResponseDto
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor',
    type: ErrorResponseDto
  })
  async create(@Body() createApoderadoDto: CreateApoderadoDto): Promise<ApoderadoCreateResponseDto> {
    try {
      
      const apoderado = await this.createApoderadoUseCase.execute(createApoderadoDto);
      
      
      if (!apoderado.id_apoderado) {
        throw new HttpException(
          {
            success: false,
            message: 'Error: El apoderado creado no tiene ID válido',
            error: 'INVALID_APODERADO_ID',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const response: ApoderadoCreateResponseDto = {
        success: true,
        message: 'Apoderado creado exitosamente',
        timestamp: new Date().toISOString(),
        data: ApoderadoMapper.toResponse(apoderado),
        apoderadoId: apoderado.id_apoderado
      };
      
      return response;
    } catch (error) {
      
             // Determinar el tipo de error y proporcionar mensajes más específicos
       let errorMessage = 'Error al crear apoderado';
       let errorType = 'GENERAL_ERROR';
       let field: string | undefined = undefined;
       let invalidValue: any = undefined;
       let suggestion: string | undefined = undefined;
       
       if (error.message?.includes('duplicate') || error.message?.includes('ya existe')) {
         errorMessage = 'El apoderado ya existe en el sistema';
         errorType = 'DUPLICATE_ERROR';
         if (error.message?.includes('DNI')) {
           field = 'dni';
           suggestion = 'Verifique que el DNI no esté registrado previamente';
         }
       } else if (error.message?.includes('validation') || error.message?.includes('invalid')) {
         errorType = 'VALIDATION_ERROR';
         suggestion = 'Verifique que todos los campos requeridos estén completos y sean válidos';
       }
      
      throw new HttpException(
        {
          success: false,
          message: errorMessage,
          error: error.message,
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          errorType,
          field,
          invalidValue,
          suggestion
        } as ApoderadoErrorResponseDto,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll(
    @Query('dni') dni?: string,
    @Query('nombre') nombre?: string,
    @Query('tipo_relacion') tipo_relacion?: string,
    @Query('activo') activo?: boolean,
  ) {
    try {
      let apoderados;
      
      if (dni || nombre || tipo_relacion || activo !== undefined) {
        // Implementar filtros si es necesario
        apoderados = await this.getApoderadosUseCase.execute();
      } else {
        apoderados = await this.getApoderadosUseCase.execute();
      }

      return {
        success: true,
        message: 'Apoderados obtenidos exitosamente',
        data: apoderados.map(apoderado => ApoderadoMapper.toResponse(apoderado)),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener apoderados',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const apoderado = await this.getApoderadoByIdUseCase.execute(id);
      
      if (!apoderado) {
        throw new HttpException(
          {
            success: false,
            message: 'Apoderado no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Apoderado obtenido exitosamente',
        data: ApoderadoMapper.toResponse(apoderado),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener apoderado',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dni/:dni')
  async findByDni(@Param('dni') dni: string) {
    try {
      const apoderado = await this.getApoderadoByDniUseCase.execute(dni);
      
      if (!apoderado) {
        throw new HttpException(
          {
            success: false,
            message: 'Apoderado no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Apoderado obtenido exitosamente',
        data: ApoderadoMapper.toResponse(apoderado),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener apoderado por DNI',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateApoderadoDto: UpdateApoderadoDto) {
    try {
      const apoderado = await this.updateApoderadoUseCase.execute(id, updateApoderadoDto);
      
      if (!apoderado) {
        throw new HttpException(
          {
            success: false,
            message: 'Apoderado no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Apoderado actualizado exitosamente',
        data: ApoderadoMapper.toResponse(apoderado),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        {
          success: false,
          message: 'Error al actualizar apoderado',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const deleted = await this.deleteApoderadoUseCase.execute(id);
      
      if (!deleted) {
        throw new HttpException(
          {
            success: false,
            message: 'Apoderado no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Apoderado eliminado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        {
          success: false,
          message: 'Error al eliminar apoderado',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/estudiantes')
  async getStudents(@Param('id') id: string) {
    try {
      
      const apoderado = await this.getApoderadoByIdUseCase.execute(id);
      
      if (apoderado) {
      }
      
      if (!apoderado) {
        throw new HttpException(
          {
            success: false,
            message: 'Apoderado no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const response = {
        success: true,
        message: 'Estudiantes del apoderado obtenidos exitosamente',
        data: {
          apoderado: ApoderadoMapper.toResponse(apoderado),
          estudiantes: apoderado.pupilos || [],
        },
      };
      
      
      return response;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener estudiantes del apoderado',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/estudiantes')
  @ApiOperation({ 
    summary: 'Asignar estudiantes a un apoderado',
    description: 'Asigna uno o más estudiantes a un apoderado específico. Un alumno solo puede tener un apoderado.'
  })
  @ApiBody({ 
    type: AssignStudentsRequestDto,
    description: 'IDs de los estudiantes a asignar'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estudiantes asignados exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Estudiantes asignados exitosamente al apoderado' },
        timestamp: { type: 'string', example: '2024-01-15T20:30:45.123Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflicto: Algunos estudiantes ya tienen apoderado asignado',
    type: ApoderadoErrorResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error en los datos proporcionados',
    type: ApoderadoErrorResponseDto
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Error interno del servidor',
    type: ApoderadoErrorResponseDto
  })
  async assignStudents(
    @Param('id') id: string,
    @Body() assignStudentsDto: AssignStudentsRequestDto,
  ) {
    try {
      
      const result = await this.assignStudentsUseCase.execute(id, assignStudentsDto);
      
      if (!result.success) {
        
        if (result.alumnosConApoderado && result.alumnosConApoderado.length > 0) {
          // Error específico: alumnos ya tienen apoderado
          throw new HttpException(
            {
              success: false,
              message: `No se pueden asignar los siguientes alumnos: ${result.alumnosConApoderado.join(', ')}. Ya tienen apoderado asignado.`,
              error: 'ALUMNOS_YA_ASIGNADOS',
              statusCode: HttpStatus.CONFLICT,
              timestamp: new Date().toISOString(),
              alumnosConApoderado: result.alumnosConApoderado,
              suggestion: 'Un alumno solo puede tener un apoderado. Remueva la asignación anterior antes de asignar a un nuevo apoderado.'
            },
            HttpStatus.CONFLICT,
          );
        } else {
          // Error general
          throw new HttpException(
            {
              success: false,
              message: result.error || 'Error al asignar estudiantes',
              error: 'ASSIGNMENT_ERROR',
              statusCode: HttpStatus.BAD_REQUEST,
              timestamp: new Date().toISOString(),
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      
      return {
        success: true,
        message: 'Estudiantes asignados exitosamente al apoderado',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      
      throw new HttpException(
        {
          success: false,
          message: 'Error interno al asignar estudiantes',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id/estudiantes')
  async removeStudents(
    @Param('id') id: string,
    @Body() removeStudentsDto: AssignStudentsRequestDto,
  ) {
    try {
      const removed = await this.removeStudentsUseCase.execute(id, removeStudentsDto);
      
      if (!removed) {
        throw new HttpException(
          {
            success: false,
            message: 'Error al remover estudiantes',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        success: true,
        message: 'Estudiantes removidos exitosamente del apoderado',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        {
          success: false,
          message: 'Error al remover estudiantes',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
