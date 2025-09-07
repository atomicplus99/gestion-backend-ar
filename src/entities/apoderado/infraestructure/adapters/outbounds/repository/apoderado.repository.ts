import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { Apoderado as ApoderadoORM } from '../../../orm/entities/apoderado.entity';
import { ApoderadoRepositoryPort } from '../../../../domain/ports/outbound/ApoderadoRepository.interface';
import { Apoderado } from '../../../../domain/entities/Apoderado';
import { ApoderadoMapper } from '../../../mappers/apoderado.mapper';
import { Alumno } from '../../../../../alumno/infraestructure/orm/entities/alumno.entity';

@Injectable()
export class ApoderadoTypeOrmRepository implements ApoderadoRepositoryPort {
  constructor(
    @InjectRepository(ApoderadoORM)
    private readonly apoderadoRepository: Repository<ApoderadoORM>,
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
  ) {}

  async create(apoderado: Apoderado): Promise<Apoderado> {
    try {
      
      // Validación: DNI obligatorio (opcional según modelo) y único
      const dni = (apoderado.dni || '').toString().trim();
      if (dni) {
        if (dni.length !== 8 || !/^\d{8}$/.test(dni)) {
          throw new BadRequestException('El DNI debe tener exactamente 8 dígitos');
        }
        const existente = await this.apoderadoRepository.findOne({ where: { dni } });
        if (existente) {
          throw new ConflictException(`El DNI '${dni}' ya está registrado para otro apoderado`);
        }
      }
      
      const orm = ApoderadoMapper.toORM(apoderado);
      
      const saved = await this.apoderadoRepository.save(orm);
      
      const result = ApoderadoMapper.toDomain(saved);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  async findAll(): Promise<Apoderado[]> {
    const orms = await this.apoderadoRepository.find({
      relations: ['pupilos'],
    });
    return orms.map(orm => ApoderadoMapper.toDomain(orm));
  }

  async findById(id: string): Promise<Apoderado | null> {
    
    const orm = await this.apoderadoRepository.findOne({
      where: { id_apoderado: id },
      relations: ['pupilos'],
    });
    
    if (orm) {
    }
    
    return orm ? ApoderadoMapper.toDomain(orm) : null;
  }

  async findByDni(dni: string): Promise<Apoderado | null> {
    
    const orm = await this.apoderadoRepository.findOne({
      where: { dni },
      relations: ['pupilos'],
    });
    
    if (orm) {
    }
    
    return orm ? ApoderadoMapper.toDomain(orm) : null;
  }

  async update(id: string, apoderado: Partial<Apoderado>): Promise<Apoderado | null> {
    const existing = await this.apoderadoRepository.findOne({
      where: { id_apoderado: id },
    });
    
    if (!existing) return null;

    // Validación DNI en actualización: formato y unicidad
    if (apoderado.dni !== undefined && apoderado.dni !== null && apoderado.dni !== '') {
      const dni = apoderado.dni.toString().trim();
      if (dni.length !== 8 || !/^\d{8}$/.test(dni)) {
        throw new BadRequestException('El DNI debe tener exactamente 8 dígitos');
      }
      const conflict = await this.apoderadoRepository.findOne({ where: { dni } });
      if (conflict && conflict.id_apoderado !== id) {
        throw new ConflictException(`El DNI '${dni}' ya está registrado para otro apoderado`);
      }
    }

    // Actualizar usando el método update de TypeORM
    await this.apoderadoRepository.update(id, {
      nombre: apoderado.nombre,
      apellido: apoderado.apellido || null,
      telefono: apoderado.telefono || null,
      email: apoderado.email || null,
      dni: apoderado.dni || null,
      tipo_relacion: apoderado.tipo_relacion as any,
      relacion_especifica: apoderado.relacion_especifica || null,
      activo: apoderado.activo,
      fecha_actualizacion: new Date(),
      medios_notificacion: apoderado.medios_notificacion || null,
    });

    // Obtener el registro actualizado
    const updated = await this.apoderadoRepository.findOne({
      where: { id_apoderado: id },
      relations: ['pupilos'],
    });

    return updated ? ApoderadoMapper.toDomain(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.apoderadoRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async findByIdWithPupilos(id: string): Promise<Apoderado | null> {
    const orm = await this.apoderadoRepository.findOne({
      where: { id_apoderado: id },
      relations: ['pupilos'],
    });
    return orm ? ApoderadoMapper.toDomain(orm) : null;
  }

  async assignStudents(apoderadoId: string, studentIds: string[]): Promise<{ success: boolean; error?: string; alumnosConApoderado?: string[] }> {
    try {
      
      const apoderado = await this.apoderadoRepository.findOne({
        where: { id_apoderado: apoderadoId },
        relations: ['pupilos'],
      });

      if (!apoderado) {
        return { success: false, error: 'Apoderado no encontrado' };
      }

      // Verificar si los alumnos ya tienen apoderado asignado
      const alumnosConApoderado: string[] = [];
      
      for (const studentId of studentIds) {
        // Buscar si el alumno ya está asignado a algún apoderado
        const [relacionesExistentes] = await this.apoderadoRepository.query(
          'SELECT id_apoderado FROM APODERADO_ALUMNO WHERE id_alumno = ?',
          [studentId]
        );
        
        
        // CORRECCIÓN: MySQL retorna [rows, fields] - necesitamos solo rows
        const rows = relacionesExistentes;
        
        // CORRECCIÓN: Verificar si hay relaciones existentes (puede ser objeto o array)
        if (rows && (Array.isArray(rows) ? rows.length > 0 : Object.keys(rows).length > 0)) {
          
          // Convertir a array si es objeto
          const rowsArray = Array.isArray(rows) ? rows : [rows];
          
          // Verificar si ya está asignado a este apoderado específico
          const yaAsignadoAEste = rowsArray.some(
            (rel: any) => rel.id_apoderado === apoderadoId
          );
          
          
          if (!yaAsignadoAEste) {
            // El alumno ya tiene otro apoderado - CONFLICTO!
            const alumno = await this.alumnoRepository.findOne({ where: { id_alumno: studentId } });
            if (alumno) {
              const nombreAlumno = `${alumno.nombre} ${alumno.apellido} (${alumno.codigo})`;
              alumnosConApoderado.push(nombreAlumno);
            }
          } else {
          }
        } else {
        }
      }

      // Si hay alumnos que ya tienen apoderado, retornar error
      if (alumnosConApoderado.length > 0) {
        return { 
          success: false, 
          error: 'Algunos alumnos ya tienen apoderado asignado',
          alumnosConApoderado 
        };
      }

      // Si no hay conflictos, proceder con la asignación
      // Usar IN(...) para múltiples IDs y evitar pasar un array a una igualdad
      const alumnos = await this.alumnoRepository.find({
        where: { id_alumno: In(studentIds) }
      });
      
      // Filtrar solo los alumnos que no están ya asignados a este apoderado
      const alumnosNuevos = alumnos.filter(alumno => 
        !apoderado.pupilos?.some(pupilo => pupilo.id_alumno === alumno.id_alumno)
      );
      
      if (alumnosNuevos.length === 0) {
        return { success: false, error: 'Todos los alumnos ya están asignados a este apoderado' };
      }

      // VALIDACIÓN FINAL: Verificar que no haya duplicados en la base de datos
      for (const alumno of alumnosNuevos) {
        const [duplicados] = await this.apoderadoRepository.query(
          'SELECT COUNT(*) as total FROM APODERADO_ALUMNO WHERE id_alumno = ?',
          [alumno.id_alumno]
        );
        
        if (duplicados && duplicados[0] && duplicados[0].total > 0) {
          const nombreAlumno = `${alumno.nombre} ${alumno.apellido} (${alumno.codigo})`;
          return { 
            success: false, 
            error: `Alumno ${nombreAlumno} ya tiene apoderado asignado`,
            alumnosConApoderado: [nombreAlumno]
          };
        }
      }

      // Agregar solo los alumnos nuevos
      apoderado.pupilos = [...(apoderado.pupilos || []), ...alumnosNuevos];
      
      await this.apoderadoRepository.save(apoderado);
      
      return { success: true };
      
    } catch (error) {
      return { success: false, error: 'Error interno al asignar estudiantes' };
    }
  }

  async removeStudents(apoderadoId: string, studentIds: string[]): Promise<boolean> {
    try {
      const apoderado = await this.apoderadoRepository.findOne({
        where: { id_apoderado: apoderadoId },
        relations: ['pupilos'],
      });

      if (!apoderado) return false;

      apoderado.pupilos = apoderado.pupilos?.filter(
        pupilo => !studentIds.includes(pupilo.id_alumno)
      ) || [];
      
      await this.apoderadoRepository.save(apoderado);
      return true;
    } catch (error) {
      return false;
    }
  }

  async findByFilters(filters: {
    dni?: string;
    nombre?: string;
    tipo_relacion?: string;
    activo?: boolean;
  }): Promise<Apoderado[]> {
    const queryBuilder = this.apoderadoRepository.createQueryBuilder('apoderado')
      .leftJoinAndSelect('apoderado.pupilos', 'pupilos');

    if (filters.dni) {
      queryBuilder.andWhere('apoderado.dni = :dni', { dni: filters.dni });
    }

    if (filters.nombre) {
      queryBuilder.andWhere(
        '(apoderado.nombre LIKE :nombre OR apoderado.apellido LIKE :nombre)',
        { nombre: `%${filters.nombre}%` }
      );
    }

    if (filters.tipo_relacion) {
      queryBuilder.andWhere('apoderado.tipo_relacion = :tipo_relacion', {
        tipo_relacion: filters.tipo_relacion,
      });
    }

    if (filters.activo !== undefined) {
      queryBuilder.andWhere('apoderado.activo = :activo', { activo: filters.activo });
    }

    const orms = await queryBuilder.getMany();
    return orms.map(orm => ApoderadoMapper.toDomain(orm));
  }
}
