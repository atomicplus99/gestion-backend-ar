import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseIntPipe,
  ParseBoolPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DirectorService } from '../services/director.service';
import { CreateDirectorDto } from '../dto/create-director.dto';
import { UpdateDirectorDto } from '../dto/update-director.dto';
import { DirectorResponseDto } from '../dto/director-response.dto';

@Controller('directores')
export class DirectorController {
  constructor(private readonly directorService: DirectorService) {}

  /**
   * Crea un nuevo director
   */
  @Post()
  async create(@Body() createDirectorDto: CreateDirectorDto): Promise<{
    success: boolean;
    message: string;
    data: DirectorResponseDto;
  }> {
    try {
      const director = await this.directorService.create(createDirectorDto);
      
      return {
        success: true,
        message: 'Director creado exitosamente',
        data: director
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todos los directores con filtros y paginación
   */
  @Get()
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('search') search?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      directores: DirectorResponseDto[];
      total: number;
      page: number;
      limit: number;
    };
  }> {
    try {
      const result = await this.directorService.findAll(page, limit, search);
      
      return {
        success: true,
        message: 'Directores obtenidos exitosamente',
        data: result
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de directores
   */
  @Get('estadisticas')
  async getStatistics(): Promise<{
    success: boolean;
    message: string;
    data: {
      totalDirectores: number;
    };
  }> {
    try {
      const statistics = await this.directorService.getStatistics();
      
      return {
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: statistics
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un director por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: DirectorResponseDto;
  }> {
    try {
      const director = await this.directorService.findOne(id);
      
      return {
        success: true,
        message: 'Director obtenido exitosamente',
        data: director
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un director
   */
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateDirectorDto: UpdateDirectorDto
  ): Promise<{
    success: boolean;
    message: string;
    data: DirectorResponseDto;
  }> {
    try {
      const director = await this.directorService.update(id, updateDirectorDto);
      
      return {
        success: true,
        message: 'Director actualizado exitosamente',
        data: director
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Asigna un usuario existente a un director
   */
  @Post('asignar-usuario')
  async asignarUsuario(@Body() body: { id_user: string, datos_personales: CreateDirectorDto }): Promise<{
    success: boolean;
    message: string;
    data: DirectorResponseDto;
  }> {
    try {
      const director = await this.directorService.asignarUsuario(body.id_user, body.datos_personales);
      
      return {
        success: true,
        message: 'Usuario asignado a director exitosamente',
        data: director
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un director
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.directorService.remove(id);
      
      return {
        success: true,
        message: 'Director eliminado exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/cambiar-usuario')
  @ApiOperation({ summary: 'Cambiar usuario asignado a director' })
  @ApiResponse({ status: 200, description: 'Usuario del director actualizado exitosamente' })
  async cambiarUsuario(@Param('id') id: string, @Body() body: { id_user: string }): Promise<{
    success: boolean;
    message: string;
    data: DirectorResponseDto;
  }> {
    try {
      const director = await this.directorService.cambiarUsuario(id, body.id_user);
      
      return {
        success: true,
        message: 'Usuario del director actualizado exitosamente',
        data: director
      };
    } catch (error) {
      throw error;
    }
  }
}
