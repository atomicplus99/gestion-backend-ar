import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Director } from '../../entities/director/director.entity';
import { Usuario } from '../../entities/usuario/usuario.entity';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DirectorSeeder {
  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async run(): Promise<void> {
    console.log('🌱 Iniciando seeder de Directores...');

    try {
      // Verificar si ya existen directores
      const existingCount = await this.directorRepository.count();
      if (existingCount > 0) {
        console.log(`✅ Ya existen ${existingCount} directores en la base de datos.`);
        return;
      }

      // Datos de directores de prueba
      const directoresData = [
        {
          nombres: 'Ana María',
          apellidos: 'Fernández Torres',
          email: 'director1@colegio.com',
          telefono: '987654324',
          direccion: 'Av. Cuarta 101, Lima',
          nombre_usuario: 'director1',
          password: 'director123'
        },
        {
          nombres: 'Roberto Carlos',
          apellidos: 'Silva Mendoza',
          email: 'director2@colegio.com',
          telefono: '987654325',
          direccion: 'Av. Quinta 202, Lima',
          nombre_usuario: 'director2',
          password: 'director123'
        },
        {
          nombres: 'Patricia Elena',
          apellidos: 'Vargas Ruiz',
          email: 'director3@colegio.com',
          telefono: '987654326',
          direccion: 'Av. Sexta 303, Lima',
          nombre_usuario: 'director3',
          password: 'director123'
        }
      ];

      // Crear directores con sus usuarios
      for (const data of directoresData) {
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
        usuario.rol_usuario = RolUsuario.DIRECTOR;
        usuario.profile_image = 'no-image.png';
        usuario.activo = true;
        
        const usuarioGuardado = await this.usuarioRepository.save(usuario);
        
        // Crear director y vincularlo con el usuario
        const director = new Director();
        director.nombres = data.nombres;
        director.apellidos = data.apellidos;
        director.email = data.email;
        director.telefono = data.telefono;
        director.direccion = data.direccion;
        director.usuario = usuarioGuardado;
        
        await this.directorRepository.save(director);
        
        console.log(`✅ Director creado: ${director.nombres} ${director.apellidos} (${director.email}) - Usuario: ${usuario.nombre_usuario}`);
      }

      console.log(`✅ Se crearon ${directoresData.length} directores con sus usuarios exitosamente`);

    } catch (error) {
      console.error('❌ Error en el seeder de Directores:', error);
      throw error;
    }
  }
}
