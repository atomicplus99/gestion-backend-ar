// src/entities/asistencia/domain/cases/update-asistencia.usecase.ts

import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { ActualizacionesAsistencia } from 'src/entities/actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { UpdateAsistenciaDto } from '../infraestructure/dto/UpdateAsistencia.dto';


@Injectable()
export class UpdateAsistenciaUseCase {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,

    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,

    @InjectRepository(ActualizacionesAsistencia)
    private readonly actualizacionesRepository: Repository<ActualizacionesAsistencia>,
  ) {}

  async execute(updateDto: UpdateAsistenciaDto) {
    try {
      // 1. Buscar al alumno por código o DNI
      const alumno = await this.alumnoRepository.findOne({
        where: updateDto.codigo_alumno
          ? { codigo: updateDto.codigo_alumno }
          : { dni_alumno: updateDto.dni_alumno },
      });

      if (!alumno) {
        throw new NotFoundException('Alumno no encontrado.');
      }

      // 2. Buscar asistencia del alumno (última asistencia registrada)
      const asistencia = await this.asistenciaRepository.findOne({
        where: { alumno: { id_alumno: alumno.id_alumno } },
        order: { fecha: 'DESC' },
        relations: ['alumno'],
      });

      if (!asistencia) {
        throw new NotFoundException('No se encontró asistencia registrada para este alumno.');
      }

      // 3. Registrar historial de actualización antes de modificar
      const historial = this.actualizacionesRepository.create({
        asistencia: asistencia,
        alumno: asistencia.alumno,
        auxiliar: { id_auxiliar: updateDto.id_auxiliar } as any,
        motivo: updateDto.motivo_actualizacion,
      });

      await this.actualizacionesRepository.save(historial);

      // 4. Actualizar asistencia
      if (updateDto.hora_de_llegada !== undefined) {
        asistencia.hora_de_llegada = updateDto.hora_de_llegada;
      }
      if (updateDto.hora_salida !== undefined) {
        asistencia.hora_salida = updateDto.hora_salida;
      }
      if (updateDto.estado_asistencia !== undefined) {
        asistencia.estado_asistencia = updateDto.estado_asistencia;
      }

      await this.asistenciaRepository.save(asistencia);

      return asistencia;

    } catch (error) {
      console.error('[UpdateAsistenciaUseCase Error]', error);
      throw new InternalServerErrorException('Error actualizando asistencia.');
    }
  }
}
