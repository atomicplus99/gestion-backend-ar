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
    return this.repositoryAlumno.save(alumno);
  }

  async findOne(codigo: string){
    const result = await this.repositoryAlumno.findOne({ where: { codigo } });
    return result;
  }

  async findByCodigoPersonal(codigo: string): Promise<Partial<Alumno> | null> {
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

    if (!orm) return null;
    
    const mappedResult = AlumnoMapper.toDomain(orm);
    return mappedResult;
  }

  async findByCodigoAlumno(codigo: string): Promise<Alumno | null> {
    
    // Validar que el código tenga entre 10 y 14 dígitos
    if (!codigo || codigo.length < 10 || codigo.length > 14) {
      throw new BadRequestException('El código del alumno debe tener entre 10 y 14 dígitos');
    }

    
    try {
      const alumno = await this.repositoryAlumno.findOne({ 
        where: { codigo }, 
        relations: ['turno','usuario'] 
      });
      
      
      if (alumno) {
      } else {
      }
      
      return alumno;
    } catch (error) {
      throw error;
    }
  }

  async findByDNIAlumno(dni: string): Promise<Alumno | null> {
    
    // Validar que el DNI tenga exactamente 8 dígitos
    if (!dni || dni.length !== 8) {
      throw new BadRequestException('El DNI del alumno debe tener exactamente 8 dígitos');
    }

    
    try {
      const alumno = await this.repositoryAlumno.findOne({ 
        where: { dni_alumno: dni }, 
        relations: ['turno','usuario'] 
      });
      
      
      if (alumno) {
      } else {
      }
      
      return alumno;
    } catch (error) {
      throw error;
    }
  }

  
  async findAll(): Promise<Alumno[]> {
    try {
      const alumnos = await this.repositoryAlumno.find({
        relations: ['turno', 'usuario']
      });
      
      return alumnos;
    } catch (error) {
      throw error;
    }
  }

  async findByCodigoQR(codigo_qr: string): Promise<Alumno | null> {
    try {
      const alumno = await this.repositoryAlumno.findOne({
        where: { codigo_qr },
        relations: ['turno', 'usuario']
      });
      
      return alumno;
    } catch (error) {
      throw error;
    }
  }

  async updateAlumno(code: string, updateData: UpdateAlumnoDto): Promise<Alumno> {
    
    // Validar que el código tenga entre 10 y 14 dígitos
    if (!code || code.length < 10 || code.length > 14) {
      throw new BadRequestException('El código del alumno debe tener entre 10 y 14 dígitos');
    }

    try {
      const alumno = await this.repositoryAlumno.findOne({ 
        where: { codigo: code }, 
        relations: ['turno', 'usuario'] 
      });
      
      if (!alumno) {
        throw new NotFoundException(`Alumno con código '${code}' no encontrado`);
      }


      // Validar datos de entrada
      if (updateData.dni_alumno && updateData.dni_alumno.length !== 8) {
        throw new BadRequestException('El DNI debe tener exactamente 8 dígitos');
      }

      if (updateData.grado && (updateData.grado < 1 || updateData.grado > 12)) {
        throw new BadRequestException('El grado debe estar entre 1 y 12');
      }

      if (updateData.seccion && !/^[A-Z]$/.test(updateData.seccion)) {
        throw new BadRequestException('La sección debe ser una letra mayúscula');
      }

      // Si se proporciona id_turno, validar que el turno existe
      if (updateData.id_turno) {
        const turno = await this.repositoryAlumno.manager.findOne(Turno, { 
          where: { id_turno: updateData.id_turno } 
        });
        
        if (!turno) {
          throw new BadRequestException(`Turno con ID '${updateData.id_turno}' no encontrado`);
        }
        
        // Asignar el turno al alumno
        alumno.turno = turno;
      }

      
      // Aplicar las actualizaciones del DTO
      const alumnoActualizado = AlumnoMapper.updateAlumnoMapper(alumno, updateData);
      
      // Guardar el alumno actualizado
      const resultado = await this.repositoryAlumno.save(alumnoActualizado);
      
      return resultado;
    } catch (error) {
      throw error;
    }
  }

  async updateAlumnoById(id: string, updateData: UpdateAlumnoDto): Promise<Alumno> {
    
    // Validar que el ID no esté vacío
    if (!id) {
      throw new BadRequestException('El ID del alumno es requerido');
    }

    try {
      const alumno = await this.repositoryAlumno.findOne({ 
        where: { id_alumno: id },
        relations: ['turno', 'usuario']
      });

      if (!alumno) {
        throw new NotFoundException(`Alumno con ID ${id} no encontrado`);
      }

      
      // Mapear los datos de actualización
      const alumnoActualizado = AlumnoMapper.updateAlumnoMapper(alumno, updateData);
      
      // Guardar el alumno actualizado
      const resultado = await this.repositoryAlumno.save(alumnoActualizado);
      
      return resultado;
    } catch (error) {
      throw error;
    }
  }
}
