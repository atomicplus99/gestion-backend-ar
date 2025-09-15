// src/entities/asistencia/domain/cases/crear-asistencia-manual.usecase.ts

import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { ActualizacionesAsistencia } from 'src/entities/actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { Administrador } from 'src/entities/administrador/administrador.entity';
import { Director } from 'src/entities/director/director.entity';
import { TelegramNotificationService } from 'src/entities/telegram/services/telegram-notification.service';
import { CreateAsistenciaManualDto } from '../infraestructure/dto/CreateAsistencia.dto';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';


@Injectable()
export class CrearAsistenciaManualUseCase {
  private readonly logger = new Logger(CrearAsistenciaManualUseCase.name);

  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,

    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,

    @InjectRepository(Auxiliar)
    private readonly auxiliarRepository: Repository<Auxiliar>,
    @InjectRepository(Administrador)
    private readonly adminRepository: Repository<Administrador>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,

    @InjectRepository(ActualizacionesAsistencia)
    private readonly actualizacionesRepository: Repository<ActualizacionesAsistencia>,
    
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  async execute(createDto: CreateAsistenciaManualDto) {
    try {
      this.logger.log(`🚀 INICIANDO CrearAsistenciaManualUseCase para alumno ID: ${createDto.id_alumno}`);
      
      // 1. Buscar al alumno
      this.logger.log(`🔍 Buscando alumno con ID: ${createDto.id_alumno}`);
      const alumno = await this.alumnoRepository.findOne({
        where: { id_alumno: createDto.id_alumno },
      });

      if (!alumno) {
        this.logger.log(`❌ Alumno NO encontrado con ID: ${createDto.id_alumno}`);
        throw new NotFoundException('Alumno no encontrado.');
      }
      this.logger.log(`✅ Alumno encontrado: ${alumno.codigo} - ${alumno.nombre} ${alumno.apellido}`);

      // 2. Identificar actor (auxiliar/administrador/director) por id_auxiliar o id_usuario
      let actorAuxiliar: Auxiliar | null = null;
      let actorAdmin: Administrador | null = null;
      let actorDirector: Director | null = null;

      if (createDto.id_auxiliar) {
        actorAuxiliar = await this.auxiliarRepository.findOne({ where: { id_auxiliar: createDto.id_auxiliar } });
        if (!actorAuxiliar) {
          throw new NotFoundException('Auxiliar no encontrado.');
        }
      } else if (createDto.id_usuario) {
        actorAdmin = await this.adminRepository.findOne({ where: { id_administrador: createDto.id_usuario as any } });
        if (!actorAdmin) {
          actorDirector = await this.directorRepository.findOne({ where: { id_director: createDto.id_usuario as any } });
          if (!actorDirector) {
            throw new NotFoundException('No se encontró un administrador o director con ese id.');
          }
        }
      } else {
        throw new BadRequestException('Debe enviarse id_auxiliar o id_usuario.');
      }

      // 3. Validar que no exista asistencia duplicada para el mismo alumno y fecha
      let fechaAsistencia: Date;
      if (createDto.fecha) {
        // Interpretar la fecha recibida (YYYY-MM-DD) como medianoche en zona horaria de Perú (UTC-5)
        const parts = String(createDto.fecha).split('-');
        if (parts.length !== 3) {
          throw new BadRequestException('El formato de fecha no es válido. Use YYYY-MM-DD');
        }
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);
        if (!year || !month || !day) {
          throw new BadRequestException('El formato de fecha no es válido. Use YYYY-MM-DD');
        }
        // Medianoche Perú equivale a 05:00:00Z
        const utcMillis = Date.UTC(year, month - 1, day, 5, 0, 0, 0);
        fechaAsistencia = new Date(utcMillis);
      } else {
        // Crear fecha actual en zona horaria de Perú (UTC-5) con la hora actual
        const ahora = new Date();
        
        // Convertir a hora de Perú usando toLocaleString
        const fechaPeru = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Lima"}));
        
        this.logger.log(`🕐 Hora UTC: ${ahora.toISOString()}`);
        this.logger.log(`🕐 Hora Perú: ${fechaPeru.toISOString()}`);
        
        // Usar la fecha y hora actual de Perú
        fechaAsistencia = fechaPeru;
      }
      
      // Buscar asistencia existente usando query builder para evitar problemas de zona horaria
      this.logger.log(`🔍 INICIANDO BÚSQUEDA DE ASISTENCIA EXISTENTE`);
      let asistenciaExistente: any = null;
      if (createDto.fecha) {
        const fechaFormato = createDto.fecha; // "2025-08-22"
        this.logger.log(`🔍 Buscando asistencia existente para fecha específica: ${fechaFormato}`);
        asistenciaExistente = await this.asistenciaRepository
          .createQueryBuilder('asistencia')
          .leftJoinAndSelect('asistencia.alumno', 'alumno')
          .where('alumno.id_alumno = :alumnoId', { alumnoId: createDto.id_alumno })
          .andWhere('DATE(asistencia.fecha) = :fecha', { fecha: fechaFormato })
          .getOne();
        this.logger.log(`🔍 Resultado búsqueda fecha específica: ${asistenciaExistente ? 'ENCONTRADA' : 'NO ENCONTRADA'}`);
      } else {
        // Si no se proporciona fecha, buscar para la fecha actual
        const fechaActual = fechaAsistencia.toISOString().split('T')[0]; // "2025-01-XX"
        this.logger.log(`🔍 Buscando asistencia existente para fecha actual: ${fechaActual}`);
        this.logger.log(`🔍 ID del alumno: ${createDto.id_alumno}`);
        
        // Primero buscar TODAS las asistencias del alumno para debug
        const todasLasAsistencias = await this.asistenciaRepository
          .createQueryBuilder('asistencia')
          .leftJoinAndSelect('asistencia.alumno', 'alumno')
          .where('alumno.id_alumno = :alumnoId', { alumnoId: createDto.id_alumno })
          .orderBy('asistencia.fecha', 'DESC')
          .getMany();
        
        this.logger.log(`📊 Total de asistencias encontradas para el alumno: ${todasLasAsistencias.length}`);
        todasLasAsistencias.forEach((asist, index) => {
          this.logger.log(`📅 Asistencia ${index + 1}: Fecha=${asist.fecha.toISOString().split('T')[0]}, Estado=${asist.estado_asistencia}`);
        });
        
        // Ahora buscar específicamente para la fecha
        asistenciaExistente = await this.asistenciaRepository
          .createQueryBuilder('asistencia')
          .leftJoinAndSelect('asistencia.alumno', 'alumno')
          .where('alumno.id_alumno = :alumnoId', { alumnoId: createDto.id_alumno })
          .andWhere('DATE(asistencia.fecha) = :fecha', { fecha: fechaActual })
          .getOne();
      }

      if (asistenciaExistente) {
        this.logger.log(`🔍 Asistencia existente encontrada para ${alumno.codigo}`);
        this.logger.log(`📊 Estado actual: "${asistenciaExistente.estado_asistencia}"`);
        this.logger.log(`🔍 Comparando con EstadoAsistencia.ANULADO: "${EstadoAsistencia.ANULADO}"`);
        
        // Verificar si la asistencia existente está anulada
        if (asistenciaExistente.estado_asistencia !== EstadoAsistencia.ANULADO) {
          this.logger.log(`❌ Asistencia NO está anulada, bloqueando registro`);
          throw new NotFoundException(
            `Ya existe una asistencia registrada para el alumno ${alumno.nombre} ${alumno.apellido} en la fecha ${createDto.fecha || fechaAsistencia.toISOString().split('T')[0]}`
          );
        }
        // Si está anulada, permitir crear nueva asistencia
        this.logger.log(`✅ Asistencia existente está ANULADA, permitiendo crear nueva asistencia para ${alumno.codigo}`);
      } else {
        this.logger.log(`ℹ️ No se encontró asistencia existente para ${alumno.codigo}, procediendo con registro normal`);
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
        // No lanzamos error para no afectar el registro de asistencia
      }

      // 6. Registrar historial de creación
      const historial = new ActualizacionesAsistencia();
      historial.asistencia = nuevaAsistencia;
      historial.alumno = alumno;
      if (actorAuxiliar) historial.auxiliar = actorAuxiliar as any;
      if (actorAdmin) historial.administrador = actorAdmin as any;
      if (actorDirector) historial.director = actorDirector as any;
      historial.motivo = createDto.motivo;
      historial.accion_realizada = 'CREAR_ASISTENCIA_MANUAL';

      await this.actualizacionesRepository.save(historial);

      return nuevaAsistencia;

    } catch (error) {
      
      // Si ya es una excepción HTTP, la re-lanzamos tal como es
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Solo convertimos a InternalServerErrorException si no es una excepción HTTP conocida
      throw new InternalServerErrorException('Error al registrar asistencia manual.');
    }
  }
}
