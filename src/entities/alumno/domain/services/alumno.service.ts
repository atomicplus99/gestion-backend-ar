// src/alumno/alumno.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alumno } from '../../infraestructure/orm/entities/alumno.entity';
import { Turno } from '../../../turno/turno.entity';
import { Usuario } from '../../../usuario/usuario.entity';
import { CreateAlumnoDto } from 'src/auth/dto/users/create-alumno.dto';
import { v4 as uuidv4 } from 'uuid';
import { AlumnoDto } from 'src/auth/dto/alumno/alumno.dto';
import { RolUsuario } from 'src/common/enums/rol-usuario.enum';
import * as bcrypt from 'bcrypt';
import { EstadoAlumno } from '../../../estado-alumnos/entities/estado-alumno.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AlumnoService {
  constructor(
    @InjectRepository(Alumno)
    private readonly alumnoRepo: Repository<Alumno>,

    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,

    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(EstadoAlumno)
    private readonly estadoAlumnoRepo: Repository<EstadoAlumno>,
  ) {}

  async create(alumnoDtaRequest: AlumnoDto): Promise<Alumno> {
    
    const turno = await this.loadTurno(alumnoDtaRequest.turno_id);
    const alumno = this.alumnoRepo.create()

    // const alumno = this.alumnoRepo.create({
    //   codigo: alumnoDtaRequest.codigo,
    //   dni_alumno: alumnoDtaRequest.dni_alumno,
    //   nombre: alumnoDtaRequest.nombre,
    //   apellido: alumnoDtaRequest.apellido,
    //   fecha_nacimiento: new Date(alumnoDtaRequest.fecha_nacimiento),
    //   direccion: alumnoDtaRequest.direccion,
    //   codigo_qr: alumnoDtaRequest.codigo_qr,
    //   nivel: alumnoDtaRequest.nivel,
    //   grado: alumnoDtaRequest.grado,
    //   seccion: alumnoDtaRequest.seccion,
    //   id_alumno: alumnoDtaRequest.usuario_id,
    //   turno,
    // });

  
    return this.alumnoRepo.save(alumno);
    
  }




  async findAll(): Promise<Alumno[]> {
    return this.alumnoRepo.find({ relations: ['turno', 'usuario'] });
  }

  async getAllAlumnos(includeApoderado?: boolean): Promise<any[]> {
    try {
      console.log('🔍 [AlumnoService] Obteniendo todos los alumnos');
      console.log('🔍 [AlumnoService] Include apoderado:', includeApoderado);
      
      if (includeApoderado) {
        // Incluir información de apoderado
        const alumnos = await this.alumnoRepo.find({
          relations: ['turno', 'usuario', 'apoderados'],
        });
        
        console.log('✅ [AlumnoService] Alumnos con apoderado obtenidos:', alumnos.length);
        
        return alumnos.map(alumno => ({
          ...alumno,
          apoderado: alumno.apoderados && alumno.apoderados.length > 0 
            ? {
                id_apoderado: alumno.apoderados[0].id_apoderado,
                nombre: alumno.apoderados[0].nombre,
                apellido: alumno.apoderados[0].apellido,
                telefono: alumno.apoderados[0].telefono,
                email: alumno.apoderados[0].email,
                dni: alumno.apoderados[0].dni,
                tipo_relacion: alumno.apoderados[0].tipo_relacion
              }
            : null
        }));
      } else {
        // Sin información de apoderado (comportamiento original)
        const alumnos = await this.alumnoRepo.find({ relations: ['turno', 'usuario'] });
        console.log('✅ [AlumnoService] Alumnos obtenidos (sin apoderado):', alumnos.length);
        return alumnos;
      }
    } catch (error) {
      console.error('❌ [AlumnoService] Error al obtener alumnos:', error);
      throw error;
    }
  }


  async findOne(id: string): Promise<Alumno> {
    const alumno = await this.alumnoRepo.findOne({
      where: { id_alumno: id },
      relations: ['turno', 'usuario'],
    });
    if (!alumno) {
      throw new NotFoundException(`Alumno ${id} no encontrado`);
    }
    return alumno;
  }

  async remove(id: string): Promise<void> {
    const alumno = await this.findOne(id);
    
    // Eliminar estados del alumno primero
    const estados = await this.estadoAlumnoRepo.find({
      where: { id_alumno: id }
    });
    
    if (estados.length > 0) {
      await this.estadoAlumnoRepo.remove(estados);
    }
    
    // Si tiene usuario asociado, también eliminarlo
    if (alumno.usuario) {
      await this.usuarioRepo.remove(alumno.usuario);
    }
    
    // Eliminar el alumno
    await this.alumnoRepo.remove(alumno);
  }

  async update(id: string, dto: CreateAlumnoDto): Promise<Alumno> {
    const alumno = await this.findOne(id);

    if (dto.codigo && dto.codigo !== alumno.codigo) {
      const codeExists = await this.alumnoRepo.findOne({ where: { codigo: dto.codigo } });
      if (codeExists) {
        throw new BadRequestException(`Código '${dto.codigo}' ya registrado.`);
      }
      alumno.codigo = dto.codigo;
    }

    alumno.dni_alumno      = dto.dni_alumno;
    alumno.nombre          = dto.nombre;
    alumno.apellido        = dto.apellido;
    alumno.fecha_nacimiento = new Date(dto.fecha_nacimiento);
    alumno.direccion       = dto.direccion || 'dsad';
    alumno.codigo_qr       = dto.codigo_qr;
    alumno.nivel           = dto.nivel;
    alumno.grado           = dto.grado;
    alumno.seccion         = dto.seccion;
    alumno.turno           = await this.loadTurno(dto.turno_id);

    if (dto.usuario_id) {
      alumno.usuario = await this.loadUsuario(dto.usuario_id);
    }
    // si no viene usuario_id, dejamos el actual sin modificar

    return this.alumnoRepo.save(alumno);
  }

  async importarDesdeExcel(data: Array<Record<string, any>>, turnoId: string, crearUsuarios: boolean = false): Promise<any> {
    // Verificar si hay datos
    if (!data || data.length === 0) {
      throw new BadRequestException('No se proporcionaron datos para importar');
    }

    // Verificar que el turno existe
    const turno = await this.loadTurno(turnoId);
    if (!turno) {
      throw new NotFoundException(`Turno con ID ${turnoId} no encontrado`);
    }
    
    // Extraer los códigos y DNIs para verificar duplicados
    const codigos = data
      .map(d => d.codigo || d.numeroDocumento)
      .filter(Boolean);
    
    const dnis = data
      .map(d => d.dni || d.numeroDocumento)
      .filter(Boolean);
    
    // Verificar códigos duplicados en la base de datos
    if (codigos.length > 0) {
      const dupes = await this.alumnoRepo
        .createQueryBuilder('alumno')
        .where('alumno.codigo IN (:...codigos)', { codigos })
        .getMany();
        
      if (dupes.length) {
        const list = dupes.map(a => a.codigo).join(', ');
        throw new BadRequestException(`Códigos duplicados: ${list}`);
      }
    }
    
    // Verificar DNIs duplicados en la base de datos
    if (dnis.length > 0) {
      const dupesDNI = await this.alumnoRepo
        .createQueryBuilder('alumno')
        .where('alumno.dni_alumno IN (:...dnis)', { dnis })
        .getMany();
        
      if (dupesDNI.length) {
        const list = dupesDNI.map(a => a.dni_alumno).join(', ');
        throw new BadRequestException(`DNIs duplicados: ${list}`);
      }
    }

    // Preparar los alumnos para guardar
    const toSave: Alumno[] = [];
    
    // Crear una lista para almacenar los objetos Usuario que se crearán
    const usersToCreate: { alumno: Alumno, usuario: Usuario }[] = [];

    for (const item of data) {
      // Extraer nombres y apellidos
      let nombre = '';
      let apellido = '';
      
      // Manejar caso donde viene el nombre completo
      if (item.nombre) {
        nombre = item.nombre.toString().trim();
      }
      
      // Manejar caso donde vienen apellidos separados
      if (item.apellidoPaterno || item.apellidoMaterno) {
        apellido = [
          item.apellidoPaterno ? item.apellidoPaterno.toString().trim() : '',
          item.apellidoMaterno ? item.apellidoMaterno.toString().trim() : ''
        ].filter(Boolean).join(' ');
      }

      // Manejar la fecha de nacimiento
      let fechaNacimiento: Date;
      try {
        // Intentar parsear la fecha de nacimiento
        if (item.fechaNacimiento) {
          if (typeof item.fechaNacimiento === 'string') {
            // Si es un string, intentamos parsearlo
            const parts = item.fechaNacimiento.split('/');
            if (parts.length === 3) {
              // Formato dd/mm/yyyy
              fechaNacimiento = new Date(
                parseInt(parts[2]), 
                parseInt(parts[1]) - 1, 
                parseInt(parts[0])
              );
            } else {
              // Intentar como fecha ISO
              fechaNacimiento = new Date(item.fechaNacimiento);
            }
          } else if (item.fechaNacimiento instanceof Date) {
            // Si ya es una fecha, la usamos directamente
            fechaNacimiento = item.fechaNacimiento;
          } else {
            // Valor por defecto
            fechaNacimiento = new Date();
          }
        } else {
          // Valor por defecto si no hay fecha
          fechaNacimiento = new Date();
        }
        
        // Verificar que la fecha sea válida
        if (!fechaNacimiento || isNaN(fechaNacimiento.getTime())) {
          fechaNacimiento = new Date();
        }
      } catch (error) {
        // En caso de error, usar la fecha actual
        fechaNacimiento = new Date();
      }

      // Convertir grado a número (asegurarnos que sea número)
      let grado = 1; // Valor por defecto
      if (item.grado !== undefined && item.grado !== null) {
        if (typeof item.grado === 'number') {
          grado = item.grado;
        } else if (typeof item.grado === 'string') {
          // Intentar extraer dígitos del grado si es un string como "PRIMERO" o "1°"
          if (/PRIMER/i.test(item.grado)) {
            grado = 1;
          } else if (/SEGUND/i.test(item.grado)) {
            grado = 2;
          } else if (/TERCER/i.test(item.grado)) {
            grado = 3;
          } else if (/CUART/i.test(item.grado)) {
            grado = 4;
          } else if (/QUINT/i.test(item.grado)) {
            grado = 5;
          } else if (/SEXT/i.test(item.grado)) {
            grado = 6;
          } else {
            // Intentar extraer números
            const numMatch = item.grado.match(/\d+/);
            if (numMatch) {
              grado = parseInt(numMatch[0]);
            }
          }
        }
      }

      // Obtener un carácter de sección
      let seccion = 'A'; // Valor por defecto
      if (item.seccion) {
        if (typeof item.seccion === 'string' && item.seccion.trim().length > 0) {
          seccion = item.seccion.trim().charAt(0).toUpperCase();
        }
      }

      // Obtener número de documento
      const dni = item.numeroDocumento || item.dni || '00000000';

      // Generar código único si no existe
      const codigo = item.codigo || `A${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Crear el objeto alumno
      const alumno = this.alumnoRepo.create({
        codigo,
        dni_alumno: dni.toString().substring(0, 8), // Aseguramos que sea como máximo 8 caracteres
        nombre: nombre || 'Sin Nombre',
        apellido: apellido || 'Sin Apellido',
        fecha_nacimiento: fechaNacimiento,
        direccion: 'NO DEFINIDO', // Valor predeterminado según requisito
        codigo_qr: uuidv4(),
        nivel: item.nivel || 'Secundaria',
        grado,
        seccion,
        turno,
      });

      toSave.push(alumno);

      // Crear un usuario para cada alumno
      const usuario = new Usuario();
      
      // Extraer primer nombre y primer apellido para generar el nombre de usuario
      const firstName = (nombre || 'Sin').trim().split(' ')[0];
      const firstLast = (apellido || 'Nombre').trim().split(' ')[0];
      
      // Generar un nombre de usuario único
      usuario.nombre_usuario = `${firstName.toUpperCase()}.${firstLast.toUpperCase()}`;
      
      // Generar una contraseña predeterminada
      const year = new Date().getFullYear();
      const plainPassword = `${firstName.toLowerCase()}${firstLast.toLowerCase()}${year}`;
      
      // Hashear la contraseña
      const saltRounds = 10;
      usuario.password_user = await bcrypt.hash(plainPassword, saltRounds);
      
      // Establecer rol y imagen de perfil predeterminada
      usuario.rol_usuario = RolUsuario.ALUMNO;
      usuario.profile_image = 'uploads/profiles/no-image.png';
      
      // Agregar el par alumno-usuario a la lista
      usersToCreate.push({ alumno, usuario });
    }

    // Guardar todos los alumnos primero
    const savedAlumnos = await this.alumnoRepo.save(toSave);
    
    // Crear estados activos para todos los alumnos
    const estadosToCreate = savedAlumnos.map(alumno => {
      const estado = new EstadoAlumno();
      estado.estado = 'activo';
      estado.observacion = 'Alumno importado desde Excel';
      estado.id_alumno = alumno.id_alumno;
      estado.fecha_actualizacion = new Date();
      return estado;
    });
    
    await this.estadoAlumnoRepo.save(estadosToCreate);
    console.log(`✅ Estados activos creados para ${estadosToCreate.length} alumnos`);
    
    let usuariosCreados = 0;
    
    // Solo crear usuarios si se solicita
    if (crearUsuarios) {
      // Ahora guardar los usuarios y asociarlos con los alumnos
      for (let i = 0; i < savedAlumnos.length; i++) {
        if (i < usersToCreate.length) {
          const { alumno, usuario } = usersToCreate[i];
          
          // Verificar si ya existe un usuario con ese nombre de usuario
          const existingUser = await this.usuarioRepo.findOne({
            where: { nombre_usuario: usuario.nombre_usuario }
          });
          
          if (existingUser) {
            // Si ya existe, agregarle un sufijo aleatorio al nombre de usuario
            usuario.nombre_usuario = `${usuario.nombre_usuario}${Math.floor(Math.random() * 1000)}`;
          }
          
          // Guardar el usuario
          const savedUser = await this.usuarioRepo.save(usuario);
          usuariosCreados++;
          
          // Guardar credenciales en archivo
          this.guardarCredencialesEnArchivo(savedAlumnos[i].codigo, savedUser.nombre_usuario, savedAlumnos[i].nombre, savedAlumnos[i].apellido);
          
          // Asociar el usuario con el alumno
          savedAlumnos[i].usuario = savedUser;
          await this.alumnoRepo.save(savedAlumnos[i]);
        }
      }
    }

    // Agregar estadísticas al resultado
    const resultado = {
      alumnos: savedAlumnos,
      estadisticas: {
        totalImportados: savedAlumnos.length,
        usuariosCreados: usuariosCreados,
        porcentajeUsuariosCreados: crearUsuarios ? Math.round((usuariosCreados / savedAlumnos.length) * 100) : 0,
        timestamp: new Date().toISOString()
      }
    };

    return resultado;
  }


  // async importarDesdeExcel(data: any[]): Promise<Alumno[]> {
  //   const codigos = data.map(d => d.codigo);
  //   const dupes = await this.alumnoRepo
  //     .createQueryBuilder('alumno')
  //     .where('alumno.codigo IN (:...codigos)', { codigos })
  //     .getMany();
  //   if (dupes.length) {
  //     const list = dupes.map(a => a.codigo).join(', ');
  //     throw new BadRequestException(`Códigos duplicados: ${list}`);
  //   }

  //   const toSave = data.map(item =>
  //     this.alumnoRepo.create({
  //       codigo: item.codigo,
  //       dni_alumno: item.dni || '00000000',
  //       nombre: item.nombre,
  //       apellido: item.apellido,
  //       fecha_nacimiento: new Date(item.fechaNacimiento),
  //       direccion: item.direccion || 'sin dirección',
  //       codigo_qr: uuidv4(),
  //       nivel: item.nivel,
  //       grado: Number(item.grado),
  //       seccion: item.seccion,
  //       turno: undefined,
  //     }),
  //   );

  //   return this.alumnoRepo.save(toSave);
  // }

  /** Helpers **/

  private async loadTurno(id: string): Promise<Turno> {
    const turno = await this.turnoRepo.findOne({ where: { id_turno: id } });
    if (!turno) throw new NotFoundException('Turno no encontrado');
    return turno;
  }

  private async loadUsuario(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOne({ where: { id_user: id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const assigned = await this.alumnoRepo.findOne({
      where: { usuario: { id_user: id } },
    });
    if (assigned) {
      throw new BadRequestException('Usuario ya asignado a otro alumno');
    }

    return usuario;
  }

  private guardarCredencialesEnArchivo(codigo: string, username: string, nombre: string, apellido: string): void {
    try {
      const archivoPath = path.join(process.cwd(), 'password-alumnos.txt');
      
      // Generar contraseña por defecto
      const firstName = nombre.trim().split(' ')[0];
      const firstLast = apellido.trim().split(' ')[0];
      const year = new Date().getFullYear();
      const password = `${firstName.toLowerCase()}${firstLast.toLowerCase()}${year}`;
      
      // Crear línea de credenciales
      const lineaCredenciales = `${codigo}|${username}|${password}|${nombre} ${apellido}\n`;
      
      // Verificar si el archivo existe
      if (!fs.existsSync(archivoPath)) {
        // Si no existe, crear con encabezado
        const encabezado = '# Archivo para almacenar contraseñas de alumnos por defecto\n# Formato: codigo_alumno|username|contraseña_por_defecto|nombre_completo\n# Ejemplo: 1234567890|JUAN.PEREZ|juanperez2025|Juan Pérez\n\n';
        fs.writeFileSync(archivoPath, encabezado);
      }
      
      // Agregar las credenciales al final del archivo
      fs.appendFileSync(archivoPath, lineaCredenciales);
      
      console.log(`✅ Credenciales guardadas en password-alumnos.txt para alumno: ${codigo}`);
    } catch (error) {
      console.error(`❌ Error al guardar credenciales en archivo: ${error.message}`);
      // No lanzar error para no detener el proceso de creación del alumno
    }
  }
}
