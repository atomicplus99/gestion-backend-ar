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
import { AdministradorService } from '../services/administrador.service';
import { CreateAdministradorDto } from '../dto/create-administrador.dto';
import { UpdateAdministradorDto } from '../dto/update-administrador.dto';
import { AdministradorResponseDto } from '../dto/administrador-response.dto';

@Controller('administradores')
export class AdministradorController {
  constructor(private readonly administradorService: AdministradorService) {}

  /**
   * Crea un nuevo administrador
   */
  @Post()
  async create(@Body() createAdministradorDto: CreateAdministradorDto): Promise<{
    success: boolean;
    message: string;
    data: AdministradorResponseDto;
  }> {
    try {
      const administrador = await this.administradorService.create(createAdministradorDto);
      
      return {
        success: true,
        message: 'Administrador creado exitosamente',
        data: administrador
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todos los administradores con filtros y paginación
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
      administradores: AdministradorResponseDto[];
      total: number;
      page: number;
      limit: number;
    };
  }> {
    try {
      const result = await this.administradorService.findAll(page, limit, search);
      
      return {
        success: true,
        message: 'Administradores obtenidos exitosamente',
        data: result
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de administradores
   */
  @Get('estadisticas')
  async getStatistics(): Promise<{
    success: boolean;
    message: string;
    data: {
      totalAdministradores: number;
    };
  }> {
    try {
      const statistics = await this.administradorService.getStatistics();
      
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
   * Obtiene un administrador por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: AdministradorResponseDto;
  }> {
    try {
      const administrador = await this.administradorService.findOne(id);
      
      return {
        success: true,
        message: 'Administrador obtenido exitosamente',
        data: administrador
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un administrador
   */
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateAdministradorDto: UpdateAdministradorDto
  ): Promise<{
    success: boolean;
    message: string;
    data: AdministradorResponseDto;
  }> {
    try {
      const administrador = await this.administradorService.update(id, updateAdministradorDto);
      
      return {
        success: true,
        message: 'Administrador actualizado exitosamente',
        data: administrador
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Asigna un usuario existente a un administrador
   */
  @Post('asignar-usuario')
  async asignarUsuario(@Body() body: { id_user: string, datos_personales: CreateAdministradorDto }): Promise<{
    success: boolean;
    message: string;
    data: AdministradorResponseDto;
  }> {
    try {
      const administrador = await this.administradorService.asignarUsuario(body.id_user, body.datos_personales);
      
      return {
        success: true,
        message: 'Usuario asignado a administrador exitosamente',
        data: administrador
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un administrador
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.administradorService.remove(id);
      
      return {
        success: true,
        message: 'Administrador eliminado exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/cambiar-usuario')
  @ApiOperation({ summary: 'Cambiar usuario asignado a administrador' })
  @ApiResponse({ status: 200, description: 'Usuario del administrador actualizado exitosamente' })
  async cambiarUsuario(@Param('id') id: string, @Body() body: { id_user: string }): Promise<{
    success: boolean;
    message: string;
    data: AdministradorResponseDto;
  }> {
    try {
      const administrador = await this.administradorService.cambiarUsuario(id, body.id_user);
      
      return {
        success: true,
        message: 'Usuario del administrador actualizado exitosamente',
        data: administrador
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica si un administrador tiene usuarios asignados
   */
  @Get(':id/usuarios')
  async verificarUsuariosAsignados(@Param('id') id: string): Promise<{
    success: boolean;
    data: {
      tieneUsuarios: boolean;
      usuarios?: any[];
    };
  }> {
    try {
      const administrador = await this.administradorService.findOne(id);
      
      return {
        success: true,
        data: {
          tieneUsuarios: !!administrador.usuario,
          usuarios: administrador.usuario ? [administrador.usuario] : []
        }
      };
    } catch (error) {
      throw error;
    }
  }
}
