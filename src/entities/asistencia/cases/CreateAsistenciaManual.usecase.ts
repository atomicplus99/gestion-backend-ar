// src/entities/asistencia/domain/cases/crear-asistencia-manual.usecase.ts

import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { ActualizacionesAsistencia } from 'src/entities/actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { CreateAsistenciaManualDto } from '../infraestructure/dto/CreateAsistencia.dto';


@Injectable()
export class CrearAsistenciaManualUseCase {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,

    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,

    @InjectRepository(Auxiliar)
    private readonly auxiliarRepository: Repository<Auxiliar>,

    @InjectRepository(ActualizacionesAsistencia)
    private readonly actualizacionesRepository: Repository<ActualizacionesAsistencia>,
  ) {}

  async execute(createDto: CreateAsistenciaManualDto) {
    try {
      // 1. Buscar al alumno
      const alumno = await this.alumnoRepository.findOne({
        where: { id_alumno: createDto.id_alumno },
      });

      if (!alumno) {
        throw new NotFoundException('Alumno no encontrado.');
      }

      // 2. Buscar al auxiliar
      const auxiliar = await this.auxiliarRepository.findOne({
        where: { usuario: { id_user: createDto.id_auxiliar } }, 
        relations: ['usuario'],
      });

      if (!auxiliar) {
        throw new NotFoundException('Auxiliar no encontrado.');
      }

      // 3. Crear asistencia
      const asistencia = this.asistenciaRepository.create({
        hora_de_llegada: createDto.hora_de_llegada,
        hora_salida: createDto.hora_salida || null,
        estado_asistencia: createDto.estado_asistencia,
        alumno: alumno,
        fecha: new Date(), // Se registra la fecha actual
      });

      const nuevaAsistencia = await this.asistenciaRepository.save(asistencia);

      // 4. Registrar historial de creación
      const historial = this.actualizacionesRepository.create({
        asistencia: nuevaAsistencia,
        alumno: alumno,
        auxiliar: auxiliar,
        motivo: createDto.motivo,
      });

      await this.actualizacionesRepository.save(historial);

      return nuevaAsistencia;

    } catch (error) {
      console.error('[CrearAsistenciaManualUseCase Error]', error);
      throw new InternalServerErrorException('Error al registrar asistencia manual.');
    }
  }
}
