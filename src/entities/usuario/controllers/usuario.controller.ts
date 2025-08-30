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
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.usuarioService.forgotPassword(forgotPasswordDto);
    return {
      success: true,
      message: 'Si el email existe, se enviará un enlace de restablecimiento'
    };
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
    return {
      success: true,
      message: 'Imagen por defecto obtenida exitosamente',
      data: {
        foto_url: 'http://localhost:3000/profiles/no-image.png'
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
