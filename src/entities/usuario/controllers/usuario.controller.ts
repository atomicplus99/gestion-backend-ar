import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { UsuarioService } from '../services/usuario.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

import { RolUsuario } from '../../../common/enums/rol-usuario.enum';
import { UsuariosCompletosResponseDto } from '../dto/usuario-completo-response.dto';
import { UsuariosCompletosFiltersDto } from '../dto/usuarios-completos-filters.dto';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email o nombre de usuario ya existe' })
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    const usuario = await this.usuarioService.create(createUsuarioDto);
    return {
      success: true,
      message: 'Usuario creado exitosamente',
      data: usuario
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de usuarios con filtros y paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Búsqueda por nombre' })
  @ApiQuery({ name: 'rol', required: false, enum: RolUsuario, description: 'Filtrar por rol' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean, description: 'Filtrar por estado activo' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('rol') rol?: RolUsuario,
    @Query('activo') activo?: boolean,
  ) {
    const result = await this.usuarioService.findAll(page, limit, search, rol, activo);
    return {
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: result
    };
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de usuarios' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getStatistics() {
    const estadisticas = await this.usuarioService.getStatistics();
    return {
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: estadisticas
    };
  }

  @Get('completos')
  @ApiOperation({ 
    summary: 'Obtener usuarios con entidades enlazadas',
    description: 'Obtiene todos los usuarios con sus datos de entidades enlazadas (alumno, auxiliar, administrador, director) y filtros avanzados'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuarios obtenidos exitosamente con entidades enlazadas',
    type: UsuariosCompletosResponseDto
  })
  @ApiQuery({ name: 'rol', required: false, enum: RolUsuario, description: 'Filtrar por rol de usuario' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean, description: 'Filtrar por estado activo' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nombre de usuario, nombres, apellidos o email' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite por página (default: 10, max: 100)' })
  async findAllCompletos(@Query() filters: UsuariosCompletosFiltersDto): Promise<UsuariosCompletosResponseDto> {
    return await this.usuarioService.findAllCompletos(filters);
  }

  @Get('disponibles')
  @ApiOperation({ 
    summary: 'Obtener usuarios disponibles por rol',
    description: 'Obtiene usuarios disponibles para asignar a entidades específicas, excluyendo los que ya están asignados'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuarios disponibles obtenidos exitosamente'
  })
  @ApiQuery({ name: 'rol', required: true, enum: RolUsuario, description: 'Rol de usuario a filtrar' })
  async findUsuariosDisponibles(@Query('rol') rol: string) {
    return await this.usuarioService.findUsuariosDisponibles(rol);
  }

  @Get(':id/auxiliar')
  @ApiOperation({ 
    summary: 'Obtener datos del auxiliar desde usuario',
    description: 'Obtiene los datos del auxiliar enlazado a un usuario específico'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Datos del auxiliar obtenidos exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado o no tiene auxiliar enlazado'
  })
  async getAuxiliarByUserId(@Param('id') id: string) {
    const auxiliar = await this.usuarioService.findAuxiliarByUserId(id);
    return {
      success: true,
      message: auxiliar ? 'Auxiliar obtenido exitosamente' : 'Usuario no tiene auxiliar enlazado',
      data: auxiliar
    };
  }

  @Get(':id/alumno')
  @ApiOperation({ 
    summary: 'Obtener datos del alumno desde usuario',
    description: 'Obtiene los datos del alumno enlazado a un usuario específico'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Datos del alumno obtenidos exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado o no tiene alumno enlazado'
  })
  async getAlumnoByUserId(@Param('id') id: string) {
    const alumno = await this.usuarioService.findAlumnoByUserId(id);
    return {
      success: true,
      message: alumno ? 'Alumno obtenido exitosamente' : 'Usuario no tiene alumno enlazado',
      data: alumno
    };
  }

  @Get(':id/administrador')
  @ApiOperation({ 
    summary: 'Obtener datos del administrador desde usuario',
    description: 'Obtiene los datos del administrador enlazado a un usuario específico'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Datos del administrador obtenidos exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado o no tiene administrador enlazado'
  })
  async getAdministradorByUserId(@Param('id') id: string) {
    const administrador = await this.usuarioService.findAdministradorByUserId(id);
    return {
      success: true,
      message: administrador ? 'Administrador obtenido exitosamente' : 'Usuario no tiene administrador enlazado',
      data: administrador
    };
  }

  @Get(':id/director')
  @ApiOperation({ 
    summary: 'Obtener datos del director desde usuario',
    description: 'Obtiene los datos del director enlazado a un usuario específico'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Datos del director obtenidos exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado o no tiene director enlazado'
  })
  async getDirectorByUserId(@Param('id') id: string) {
    const director = await this.usuarioService.findDirectorByUserId(id);
    return {
      success: true,
      message: director ? 'Director obtenido exitosamente' : 'Usuario no tiene director enlazado',
      data: director
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id') id: string) {
    const usuario = await this.usuarioService.findOne(id);
    return {
      success: true,
      message: 'Usuario obtenido exitosamente',
      data: usuario
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Email ya existe' })
  async update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.usuarioService.update(id, updateUsuarioDto);
    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuario
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un usuario (soft delete)' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async remove(@Param('id') id: string) {
    await this.usuarioService.remove(id);
    return {
      success: true,
      message: 'Usuario eliminado exitosamente'
    };
  }

  @Post(':id/cambiar-password')
  @ApiOperation({ summary: 'Cambiar contraseña de un usuario' })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada exitosamente' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    await this.usuarioService.changePassword(id, changePasswordDto);
    return {
      success: true,
      message: 'Contraseña cambiada exitosamente'
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada exitosamente' })
  @ApiResponse({ status: 404, description: 'Email no encontrado' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      const result = await this.usuarioService.forgotPassword(forgotPasswordDto);
      
      if (result.userFound) {
        return {
          success: true,
          message: 'Se ha enviado un enlace de restablecimiento de contraseña a tu email'
        };
      } else {
        return {
          success: false,
          message: 'No se encontró una cuenta asociada a este email'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error procesando la solicitud. Intenta nuevamente.'
      };
    }
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida exitosamente' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.usuarioService.resetPassword(resetPasswordDto);
    return {
      success: true,
      message: 'Contraseña restablecida exitosamente'
    };
  }

  @Get('debug-email/:email')
  @ApiOperation({ summary: 'Debug: Verificar email en base de datos' })
  async debugEmail(@Param('email') email: string) {
    return await this.usuarioService.debugEmail(email);
  }

  @Post(':id/foto')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir foto de perfil' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Foto de perfil subida exitosamente' })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async uploadProfilePhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const result = await this.usuarioService.uploadProfilePhoto(id, file);
    return {
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      data: result
    };
  }

  @Get('foto/default')
  @ApiOperation({ summary: 'Obtener imagen por defecto' })
  @ApiResponse({ status: 200, description: 'Imagen por defecto obtenida exitosamente' })
  async getDefaultPhoto() {
    const baseUrl = process.env.BASE_URL;
    
    if (!baseUrl) {
      throw new Error('BASE_URL no está configurada en las variables de entorno');
    }
    
    return {
      success: true,
      message: 'Imagen por defecto obtenida exitosamente',
      data: {
        foto_url: `${baseUrl}/profiles/no-image.png`
      }
    };
  }

  @Get(':id/foto')
  @ApiOperation({ summary: 'Obtener foto de perfil' })
  @ApiResponse({ status: 200, description: 'Foto de perfil obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getProfilePhoto(@Param('id') id: string) {
    const usuario = await this.usuarioService.findOne(id);
    return {
      success: true,
      message: 'Foto de perfil obtenida exitosamente',
      data: {
        foto_url: usuario.profile_image
      }
    };
  }

  @Delete(':id/foto')
  @ApiOperation({ summary: 'Eliminar foto de perfil' })
  @ApiResponse({ status: 200, description: 'Foto de perfil eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'Usuario no tiene foto personalizada' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async deleteProfilePhoto(@Param('id') id: string) {
    await this.usuarioService.deleteProfilePhoto(id);
    return {
      success: true,
      message: 'Foto de perfil eliminada exitosamente'
    };
  }

}
