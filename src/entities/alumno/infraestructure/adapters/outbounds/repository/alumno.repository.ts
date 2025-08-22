import { ConflictException, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Alumno } from '../../../orm/entities/alumno.entity';
import { AlumnoMapper } from '../../../mappers/alumno.mapper';
import { AlumnoRepositoryInterface } from 'src/entities/alumno/domain/ports/outbound/interfaces/AlumnoRepository.interface';
import { UpdateAlumnoDto } from 'src/entities/alumno/domain/dtos/UpdateAlumno.dto';
import { Turno } from 'src/entities/turno/turno.entity';

@Injectable()
export class AlumnoTypeOrmRepository implements AlumnoRepositoryInterface {
  private readonly logger = new Logger(AlumnoTypeOrmRepository.name);

  constructor(
    @InjectRepository(Alumno)
    private readonly repositoryAlumno: Repository<Alumno>
  ) {}

  save(alumno: Alumno): Promise<Alumno> {
    this.logger.log(`Guardando alumno con código: ${alumno.codigo}`);
    return this.repositoryAlumno.save(alumno);
  }

  async findOne(codigo: string){
    this.logger.log(`Buscando alumno con código: ${codigo}`);
    const result = await this.repositoryAlumno.findOne({ where: { codigo } });
    this.logger.log(`Resultado de findOne para código ${codigo}: ${result ? 'Encontrado' : 'No encontrado'}`);
    return result;
  }

  async findByCodigoPersonal(codigo: string): Promise<Partial<Alumno> | null> {
    this.logger.log(`Buscando alumno personal con código: ${codigo}`);
    const orm = await this.repositoryAlumno.findOne({
      where: { codigo },
      select: [
        'id_alumno',
        'codigo',
        'dni_alumno',
        'nombre',
        'apellido',
        'fecha_nacimiento',
        'direccion',
        'nivel',
        'grado',
        'seccion'
      ],
    });

    this.logger.log(`Resultado de findByCodigoPersonal para código ${codigo}: ${orm ? 'Encontrado' : 'No encontrado'}`);
    if (!orm) return null;
    
    const mappedResult = AlumnoMapper.toDomain(orm);
    this.logger.log(`Resultado mapeado para código ${codigo}: ${JSON.stringify(mappedResult, null, 2)}`);
    return mappedResult;
  }

  async findByCodigoAlumno(codigo: string): Promise<Alumno | null> {
    this.logger.log(`🔍 [Repository] Iniciando búsqueda de alumno con código: ${codigo}`);
    
    // Validar que el código tenga 14 dígitos
    if (!codigo || codigo.length !== 14) {
      this.logger.error(`❌ [Repository] Código inválido: ${codigo} (longitud: ${codigo?.length || 0})`);
      throw new BadRequestException('El código del alumno debe tener exactamente 14 dígitos');
    }

    this.logger.log(`✅ [Repository] Código válido, procediendo con búsqueda en BD`);
    
    try {
      const alumno = await this.repositoryAlumno.findOne({ 
        where: { codigo }, 
        relations: ['turno','usuario'] 
      });
      
      this.logger.log(`📊 [Repository] Resultado de búsqueda en BD: ${alumno ? 'Encontrado' : 'No encontrado'}`);
      
      if (alumno) {
        this.logger.log(`✅ [Repository] Alumno encontrado:`);
        this.logger.log(`   - ID: ${alumno.id_alumno}`);
        this.logger.log(`   - Código: ${alumno.codigo}`);
        this.logger.log(`   - Nombre: ${alumno.nombre} ${alumno.apellido}`);
        this.logger.log(`   - Turno: ${alumno.turno ? `ID: ${alumno.turno.id_turno}` : 'No asignado'}`);
        this.logger.log(`   - Usuario: ${alumno.usuario ? `ID: ${alumno.usuario.id_user}` : 'No asignado'}`);
      } else {
        this.logger.warn(`⚠️ [Repository] No se encontró alumno con código: ${codigo}`);
      }
      
      return alumno;
    } catch (error) {
      this.logger.error(`❌ [Repository] Error en búsqueda de alumno: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }

  
  async findAll(): Promise<Alumno[]> {
    this.logger.log(`🔍 [Repository] Buscando todos los alumnos`);
    try {
      const alumnos = await this.repositoryAlumno.find({
        relations: ['turno', 'usuario']
      });
      
      this.logger.log(`✅ [Repository] Encontrados ${alumnos.length} alumnos`);
      return alumnos;
    } catch (error) {
      this.logger.error(`❌ [Repository] Error al buscar todos los alumnos: ${error.message}`);
      throw error;
    }
  }

  async findByCodigoQR(codigo_qr: string): Promise<Alumno | null> {
    this.logger.log(`🔍 [Repository] Buscando alumno por código QR: ${codigo_qr}`);
    try {
      const alumno = await this.repositoryAlumno.findOne({
        where: { codigo_qr },
        relations: ['turno', 'usuario']
      });
      
      this.logger.log(`📊 [Repository] Resultado de búsqueda por QR: ${alumno ? 'Encontrado' : 'No encontrado'}`);
      return alumno;
    } catch (error) {
      this.logger.error(`❌ [Repository] Error en búsqueda por QR: ${error.message}`);
      throw error;
    }
  }

  async updateAlumno(code: string, updateData: UpdateAlumnoDto): Promise<Alumno> {
    this.logger.log(`🔄 [Repository] Iniciando actualización de alumno con código: ${code}`);
    
    // Validar que el código tenga 14 dígitos
    if (!code || code.length !== 14) {
      this.logger.error(`❌ [Repository] Código inválido para actualización: ${code} (longitud: ${code?.length || 0})`);
      throw new BadRequestException('El código del alumno debe tener exactamente 14 dígitos');
    }

    try {
      const alumno = await this.repositoryAlumno.findOne({ 
        where: { codigo: code }, 
        relations: ['turno', 'usuario'] 
      });
      
      if (!alumno) {
        this.logger.error(`❌ [Repository] Alumno no encontrado para actualización: ${code}`);
        throw new NotFoundException(`Alumno con código '${code}' no encontrado`);
      }

      this.logger.log(`✅ [Repository] Alumno encontrado para actualización, validando datos de entrada`);

      // Validar datos de entrada
      if (updateData.dni_alumno && updateData.dni_alumno.length !== 8) {
        this.logger.error(`❌ [Repository] DNI inválido: ${updateData.dni_alumno} (longitud: ${updateData.dni_alumno.length})`);
        throw new BadRequestException('El DNI debe tener exactamente 8 dígitos');
      }

      if (updateData.grado && (updateData.grado < 1 || updateData.grado > 12)) {
        this.logger.error(`❌ [Repository] Grado inválido: ${updateData.grado}`);
        throw new BadRequestException('El grado debe estar entre 1 y 12');
      }

      if (updateData.seccion && !/^[A-Z]$/.test(updateData.seccion)) {
        this.logger.error(`❌ [Repository] Sección inválida: ${updateData.seccion}`);
        throw new BadRequestException('La sección debe ser una letra mayúscula');
      }

      // Si se proporciona id_turno, validar que el turno existe
      if (updateData.id_turno) {
        this.logger.log(`🔄 [Repository] Validando existencia del turno: ${updateData.id_turno}`);
        const turno = await this.repositoryAlumno.manager.findOne(Turno, { 
          where: { id_turno: updateData.id_turno } 
        });
        
        if (!turno) {
          this.logger.error(`❌ [Repository] Turno no encontrado: ${updateData.id_turno}`);
          throw new BadRequestException(`Turno con ID '${updateData.id_turno}' no encontrado`);
        }
        
        this.logger.log(`✅ [Repository] Turno validado: ${turno.turno}`);
        // Asignar el turno al alumno
        alumno.turno = turno;
      }

      this.logger.log(`✅ [Repository] Validaciones pasadas, procediendo con actualización`);
      
      // Aplicar las actualizaciones del DTO
      const alumnoActualizado = AlumnoMapper.updateAlumnoMapper(alumno, updateData);
      
      // Guardar el alumno actualizado
      const resultado = await this.repositoryAlumno.save(alumnoActualizado);
      
      this.logger.log(`✅ [Repository] Alumno actualizado exitosamente: ${resultado.codigo}`);
      return resultado;
    } catch (error) {
      this.logger.error(`❌ [Repository] Error en actualización de alumno: ${error.message}`);
      throw error;
    }
  }
}
