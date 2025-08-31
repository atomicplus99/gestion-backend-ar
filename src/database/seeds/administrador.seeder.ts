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
    console.log('🌱 Iniciando seeder de Administradores...');

    try {
      // Verificar si ya existen administradores
      const existingCount = await this.administradorRepository.count();
      if (existingCount > 0) {
        console.log(`✅ Ya existen ${existingCount} administradores en la base de datos.`);
        return;
      }

      // Datos de administradores de prueba
      const administradoresData = [
        {
          nombres: 'María Elena',
          apellidos: 'Rodríguez López',
          email: 'admin2@colegio.com',
          telefono: '987654322',
          direccion: 'Av. Secundaria 456, Lima',
          nombre_usuario: 'admin2',
          password: 'admin123'
        },
        {
          nombres: 'Carlos Alberto',
          apellidos: 'González Martínez',
          email: 'admin3@colegio.com',
          telefono: '987654323',
          direccion: 'Av. Terciaria 789, Lima',
          nombre_usuario: 'admin3',
          password: 'admin123'
        }
      ];

      // Crear administradores con sus usuarios
      for (const data of administradoresData) {
        // Verificar si ya existe un usuario con este nombre
        const usuarioExistente = await this.usuarioRepository.findOne({
          where: { nombre_usuario: data.nombre_usuario }
        });

        if (usuarioExistente) {
          console.log(`⚠️ Usuario '${data.nombre_usuario}' ya existe, omitiendo...`);
          continue;
        }

        // Crear usuario primero
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        
        const usuario = new Usuario();
        usuario.nombre_usuario = data.nombre_usuario;
        usuario.password_user = hashedPassword;
        usuario.rol_usuario = RolUsuario.ADMINISTRADOR;
        usuario.profile_image = 'no-image.png';
        usuario.activo = true;
        
        const usuarioGuardado = await this.usuarioRepository.save(usuario);
        
        // Crear administrador y vincularlo con el usuario
        const administrador = new Administrador();
        administrador.nombres = data.nombres;
        administrador.apellidos = data.apellidos;
        administrador.email = data.email;
        administrador.telefono = data.telefono;
        administrador.direccion = data.direccion;
        administrador.usuario = usuarioGuardado;
        
        await this.administradorRepository.save(administrador);
        
        console.log(`✅ Administrador creado: ${administrador.nombres} ${administrador.apellidos} (${administrador.email}) - Usuario: ${usuario.nombre_usuario}`);
      }

      console.log(`✅ Se crearon ${administradoresData.length} administradores con sus usuarios exitosamente`);

    } catch (error) {
      console.error('❌ Error en el seeder de Administradores:', error);
      throw error;
    }
  }
}
