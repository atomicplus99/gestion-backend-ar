// src/entities/asistencia/domain/cases/crear-asistencia-manual.usecase.ts

import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { ActualizacionesAsistencia } from 'src/entities/actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { TelegramNotificationService } from 'src/entities/telegram/services/telegram-notification.service';
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
    
    private readonly telegramNotificationService: TelegramNotificationService,
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
        where: { id_auxiliar: createDto.id_auxiliar },
      });

      if (!auxiliar) {
        throw new NotFoundException('Auxiliar no encontrado.');
      }

      // 3. Validar que no exista asistencia duplicada para el mismo alumno y fecha
      let fechaAsistencia: Date;
      if (createDto.fecha) {
        fechaAsistencia = new Date(createDto.fecha);
      } else {
        // Crear fecha actual en zona horaria de Perú (UTC-5)
        const ahora = new Date();
        const offsetPeru = -5 * 60; // UTC-5 en minutos
        const fechaPeru = new Date(ahora.getTime() + (offsetPeru * 60 * 1000));
        
        // Construir fecha a las 00:00:00 en hora local de Perú
        fechaAsistencia = new Date(fechaPeru.getFullYear(), fechaPeru.getMonth(), fechaPeru.getDate(), 0, 0, 0, 0);
      }
      
      // Buscar asistencia existente usando query builder para evitar problemas de zona horaria
      let asistenciaExistente: any = null;
      if (createDto.fecha) {
        const fechaFormato = createDto.fecha; // "2025-08-22"
        asistenciaExistente = await this.asistenciaRepository
          .createQueryBuilder('asistencia')
          .leftJoinAndSelect('asistencia.alumno', 'alumno')
          .where('alumno.id_alumno = :alumnoId', { alumnoId: createDto.id_alumno })
          .andWhere('DATE(asistencia.fecha) = :fecha', { fecha: fechaFormato })
          .getOne();
      }

      if (asistenciaExistente) {
        throw new NotFoundException(
          `Ya existe una asistencia registrada para el alumno ${alumno.nombre} ${alumno.apellido} en la fecha ${createDto.fecha || fechaAsistencia.toISOString().split('T')[0]}`
        );
      }
      
      // 4. Crear asistencia
      const asistencia = this.asistenciaRepository.create({
        hora_de_llegada: createDto.hora_de_llegada,
        hora_salida: createDto.hora_salida || null,
        estado_asistencia: createDto.estado_asistencia,
        alumno: alumno,
        fecha: fechaAsistencia,
      });

      const nuevaAsistencia = await this.asistenciaRepository.save(asistencia);

      // 5. Enviar notificación de Telegram al apoderado
      try {
        await this.telegramNotificationService.notificarAsistenciaApoderado(nuevaAsistencia);
      } catch (telegramError) {
        console.error('[CrearAsistenciaManualUseCase] Error enviando notificación Telegram:', telegramError);
        // No lanzamos error para no afectar el registro de asistencia
      }

      // 6. Registrar historial de creación
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
      
      // Si ya es una excepción HTTP, la re-lanzamos tal como es
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Solo convertimos a InternalServerErrorException si no es una excepción HTTP conocida
      throw new InternalServerErrorException('Error al registrar asistencia manual.');
    }
  }
}
