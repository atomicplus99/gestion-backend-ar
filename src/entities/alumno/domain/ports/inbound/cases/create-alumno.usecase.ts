import { Injectable, BadRequestException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { AlumnoTypeOrmRepository } from '../../../../infraestructure/adapters/outbounds/repository/alumno.repository';
import { TurnoTypeOrmRepository } from 'src/entities/turno/repository/turno.repository';
import { UsuarioTypeOrmRepository } from 'src/entities/usuario/repository/usuario.repository';
import { AlumnoMapper } from '../../../../infraestructure/mappers/alumno.mapper';
import { UsuarioMapper } from 'src/entities/usuario/usuario.mapper';
import { RegisterAlumnoDto } from 'src/auth/dto/alumno/registers/alumno-create.dto';
import { EstadoAlumno } from 'src/entities/estado-alumnos/entities/estado-alumno.entity';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CreateAlumnoUseCase {
  private readonly logger = new Logger(CreateAlumnoUseCase.name);

  constructor(
    private readonly alumnoRepo:  AlumnoTypeOrmRepository,
    private readonly turnoRepo:   TurnoTypeOrmRepository,
    private readonly usuarioRepo: UsuarioTypeOrmRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(dto: RegisterAlumnoDto) {
    try {
      
      // Validar si ya existe un código duplicado
      const alumnoExistente = await this.alumnoRepo.findByCodigoAlumno(dto.codigo);
      if (alumnoExistente) {
        throw new BadRequestException(`Código '${dto.codigo}' ya está registrado.`);
      }
      
      // Validar si ya existe un DNI duplicado
      const alumnoConMismoDNI = await this.alumnoRepo.findByDNIAlumno(dto.dni_alumno);
      if (alumnoConMismoDNI) {
        throw new BadRequestException(`DNI '${dto.dni_alumno}' ya está registrado.`);
      }
      
      // Validar si el turno seleccionado existe
      const turno = await this.turnoRepo.findOne(dto.turno_id);
      if (!turno) {
        throw new NotFoundException(`Turno con ID '${dto.turno_id}' no encontrado.`);
      }

      // Crear y guardar el usuario
      const userEntity = await UsuarioMapper.fromAlumnoDto(dto);
      const user = await this.usuarioRepo.save(userEntity);
      
      // Guardar credenciales en archivo
      this.guardarCredencialesEnArchivo(dto.codigo, user.nombre_usuario, dto.nombre, dto.apellido);

      // Crear y guardar el alumno
      const alumnoEntity = AlumnoMapper.toEntity(dto, turno, user);
      const alumnoGuardado = await this.alumnoRepo.save(alumnoEntity);
      
      // Crear estado activo para el alumno
      const estadoAlumno = new EstadoAlumno();
      estadoAlumno.estado = 'activo';
      estadoAlumno.observacion = 'Alumno registrado exitosamente';
      estadoAlumno.id_alumno = alumnoGuardado.id_alumno;
      estadoAlumno.fecha_actualizacion = new Date();
      
      const estadoRepo = this.dataSource.getRepository(EstadoAlumno);
      await estadoRepo.save(estadoAlumno);
      
      return alumnoGuardado;
      
    } catch (error) {
      
      // Si ya es un error conocido, lo re-lanzamos
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Para errores desconocidos, lanzamos un error interno
      throw new InternalServerErrorException('Error interno al registrar el alumno');
    }
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
      
    } catch (error) {
      // No lanzar error para no detener el proceso de creación del alumno
    }
  }
}
