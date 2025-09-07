import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Administrador } from '../../entities/administrador/administrador.entity';
import { Usuario } from '../../entities/usuario/usuario.entity';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdministradorSeeder {
  constructor(
    @InjectRepository(Administrador)
    private readonly administradorRepository: Repository<Administrador>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async run(): Promise<void> {

    try {
      // Verificar si ya existen administradores
      const existingCount = await this.administradorRepository.count();
      if (existingCount > 0) {
        return;
      }

      // Datos de administrador único
      const administradorData = {
        nombres: 'Administrador',
        apellidos: 'Sistema',
        email: 'admin@colegio.com',
        telefono: '987654321',
        direccion: 'Av. Principal 123, Lima',
        nombre_usuario: 'admin',
        password: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123'
      };

      // Verificar si ya existe un usuario con este nombre
      const usuarioExistente = await this.usuarioRepository.findOne({
        where: { nombre_usuario: administradorData.nombre_usuario }
      });

      if (usuarioExistente) {
        return;
      }

      // Crear usuario primero
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(administradorData.password, saltRounds);
      
      const usuario = new Usuario();
      usuario.nombre_usuario = administradorData.nombre_usuario;
      usuario.password_user = hashedPassword;
      usuario.rol_usuario = RolUsuario.ADMINISTRADOR;
      usuario.profile_image = 'no-image.png';
      usuario.activo = true;
      
      const usuarioGuardado = await this.usuarioRepository.save(usuario);
      
      // Crear administrador y vincularlo con el usuario
      const administrador = new Administrador();
      administrador.nombres = administradorData.nombres;
      administrador.apellidos = administradorData.apellidos;
      administrador.email = administradorData.email;
      administrador.telefono = administradorData.telefono;
      administrador.direccion = administradorData.direccion;
      administrador.usuario = usuarioGuardado;
      
      await this.administradorRepository.save(administrador);


    } catch (error) {
      throw error;
    }
  }
}
