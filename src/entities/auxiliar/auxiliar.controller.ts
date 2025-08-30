import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { AuxiliarRepository } from './domain/repository/auxiliar.repository';
import { Auxiliar } from './auxiliar.entity';

@Controller('auxiliares')
export class AuxiliarController {
  constructor(
    private readonly auxiliarRepository: AuxiliarRepository,
  ) {}

  /**
   * Crea un nuevo auxiliar
   */
  @Post()
  async create(@Body() body: {
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string;
    direccion?: string;
    id_user: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: Auxiliar;
  }> {
    try {
      const auxiliar = await this.auxiliarRepository.create({
        nombre: body.nombres,
        apellido: body.apellidos,
        correo_electronico: body.email,
        telefono: body.telefono,
        dni_auxiliar: '00000000', // DNI temporal, se debe agregar al DTO
        fecha_nacimiento: new Date(), // Fecha temporal, se debe agregar al DTO
        usuario: { id_user: body.id_user } as any
      });
      
      return {
        success: true,
        message: 'Auxiliar creado exitosamente',
        data: auxiliar
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todos los auxiliares con filtros y paginación
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
      auxiliares: Auxiliar[];
      total: number;
      page: number;
      limit: number;
    };
  }> {
    try {
      const result = await this.auxiliarRepository.findAll(page, limit, search);
      
      return {
        success: true,
        message: 'Auxiliares obtenidos exitosamente',
        data: result
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de auxiliares
   */
  @Get('estadisticas')
  async getStatistics(): Promise<{
    success: boolean;
    message: string;
    data: {
      totalAuxiliares: number;
    };
  }> {
    try {
      const statistics = await this.auxiliarRepository.getStatistics();
      
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
   * Obtiene un auxiliar por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: Auxiliar;
  }> {
    try {
      const auxiliar = await this.auxiliarRepository.findOne(id);
      
      if (!auxiliar) {
        throw new NotFoundException('Auxiliar no encontrado');
      }
      
      return {
        success: true,
        message: 'Auxiliar obtenido exitosamente',
        data: auxiliar
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene la información de un auxiliar basado en el ID del usuario
   * @param idUser ID del usuario asociado al auxiliar
   * @returns Información completa del auxiliar con relaciones cargadas
   */
  @Get('auxiliar-user/:idUser')
  async findByUserId(@Param('idUser') idUser: string): Promise<Auxiliar> {
    const auxiliar = await this.auxiliarRepository.findByUsuarioId(idUser);
    
    if (!auxiliar) {
      throw new NotFoundException(`No se encontró auxiliar con usuario ID: ${idUser}`);
    }
    
    return auxiliar;
  }

  /**
   * Actualiza un auxiliar
   */
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() body: {
      nombres?: string;
      apellidos?: string;
      email?: string;
      telefono?: string;
      direccion?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data: Auxiliar;
  }> {
    try {
      const auxiliar = await this.auxiliarRepository.update(id, body);
      
      if (!auxiliar) {
        throw new NotFoundException('Auxiliar no encontrado');
      }
      
      return {
        success: true,
        message: 'Auxiliar actualizado exitosamente',
        data: auxiliar
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Asigna un usuario existente a un auxiliar
   */
  @Post('asignar-usuario')
  async asignarUsuario(@Body() body: { 
    id_user: string, 
    nombres: string, 
    apellidos: string, 
    email: string, 
    telefono?: string, 
    direccion?: string 
  }): Promise<{
    success: boolean;
    message: string;
    data: Auxiliar;
  }> {
    try {
      const auxiliar = await this.auxiliarRepository.asignarUsuario(body.id_user, {
        nombres: body.nombres,
        apellidos: body.apellidos,
        email: body.email,
        telefono: body.telefono,
        direccion: body.direccion
      });
      
      return {
        success: true,
        message: 'Usuario asignado a auxiliar exitosamente',
        data: auxiliar
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un auxiliar
   */
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.auxiliarRepository.remove(id);
      
      return {
        success: true,
        message: 'Auxiliar eliminado exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambia el usuario asignado a un auxiliar
   */
  @Patch(':id/cambiar-usuario')
  async cambiarUsuario(@Param('id') id: string, @Body() body: { id_user: string }): Promise<{
    success: boolean;
    message: string;
    data: Auxiliar;
  }> {
    try {
      const auxiliar = await this.auxiliarRepository.cambiarUsuario(id, body.id_user);
      
      return {
        success: true,
        message: 'Usuario del auxiliar actualizado exitosamente',
        data: auxiliar
      };
    } catch (error) {
      throw error;
    }
  }
}
