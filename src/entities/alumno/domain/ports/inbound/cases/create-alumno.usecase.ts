import { Injectable, BadRequestException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { AlumnoTypeOrmRepository } from '../../../../infraestructure/adapters/outbounds/repository/alumno.repository';
import { TurnoTypeOrmRepository } from 'src/entities/turno/repository/turno.repository';
import { UsuarioTypeOrmRepository } from 'src/entities/usuario/repository/usuario.repository';
import { AlumnoMapper } from '../../../../infraestructure/mappers/alumno.mapper';
import { UsuarioMapper } from 'src/entities/usuario/usuario.mapper';
import { RegisterAlumnoDto } from 'src/auth/dto/alumno/registers/alumno-create.dto';

@Injectable()
export class CreateAlumnoUseCase {
  private readonly logger = new Logger(CreateAlumnoUseCase.name);

  constructor(
    private readonly alumnoRepo:  AlumnoTypeOrmRepository,
    private readonly turnoRepo:   TurnoTypeOrmRepository,
    private readonly usuarioRepo: UsuarioTypeOrmRepository,
  ) {}

  async execute(dto: RegisterAlumnoDto) {
    try {
      this.logger.log(`Iniciando registro de alumno con código: ${dto.codigo}`);
      
      // Validar si ya existe un código duplicado
      const alumnoExistente = await this.alumnoRepo.findByCodigoAlumno(dto.codigo);
      if (alumnoExistente) {
        this.logger.warn(`Intento de registro con código duplicado: ${dto.codigo}`);
        throw new BadRequestException(`Código '${dto.codigo}' ya está registrado.`);
      }
      
      // Validar si el turno seleccionado existe
      this.logger.log(`Validando turno con ID: ${dto.turno_id}`);
      const turno = await this.turnoRepo.findOne(dto.turno_id);
      if (!turno) {
        this.logger.warn(`Turno no encontrado con ID: ${dto.turno_id}`);
        throw new NotFoundException(`Turno con ID '${dto.turno_id}' no encontrado.`);
      }

      // Crear y guardar el usuario
      this.logger.log('Creando usuario para el alumno');
      const userEntity = UsuarioMapper.fromAlumnoDto(dto);
      const user = await this.usuarioRepo.save(userEntity);
      this.logger.log(`Usuario creado con ID: ${user.id_user}`);

      // Crear y guardar el alumno
      this.logger.log('Creando entidad de alumno');
      const alumnoEntity = AlumnoMapper.toEntity(dto, turno, user);
      const alumnoGuardado = await this.alumnoRepo.save(alumnoEntity);
      
      this.logger.log(`Alumno registrado exitosamente con ID: ${alumnoGuardado.id_alumno}`);
      return alumnoGuardado;
      
    } catch (error) {
      this.logger.error('Error en el caso de uso de creación de alumno:', error);
      
      // Si ya es un error conocido, lo re-lanzamos
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Para errores desconocidos, lanzamos un error interno
      throw new InternalServerErrorException('Error interno al registrar el alumno');
    }
  }
}
