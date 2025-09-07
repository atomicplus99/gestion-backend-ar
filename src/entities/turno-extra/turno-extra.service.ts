import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TurnoExtra, EstadoTurnoExtra } from './turno-extra.entity';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { Turno } from '../turno/turno.entity';
import { Usuario } from '../usuario/usuario.entity';

export interface CreateTurnoExtraDto {
  alumno_id: string;
  fecha_turno: Date;
  fecha_limite: Date;
  hora_entrada: string;
  hora_salida: string;
  hora_limite: string;
  observaciones: string;
  usuario_id: string;
}

export interface UpdateTurnoExtraDto {
  fecha_turno?: Date;
  fecha_limite?: Date;
  hora_entrada?: string;
  hora_salida?: string;
  hora_limite?: string;
  estado?: EstadoTurnoExtra;
}

@Injectable()
export class TurnoExtraService {
  private readonly logger = new Logger(TurnoExtraService.name);

  constructor(
    @InjectRepository(TurnoExtra)
    private readonly turnoExtraRepository: Repository<TurnoExtra>,
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  /**
   * Crear un nuevo turno extra
   */
  async create(createDto: CreateTurnoExtraDto): Promise<TurnoExtra> {
    try {

      // 1. Validar que el alumno existe
      const alumno = await this.alumnoRepository.findOne({
        where: { id_alumno: createDto.alumno_id }
      });

      if (!alumno) {
        throw new NotFoundException(`Alumno con ID ${createDto.alumno_id} no encontrado`);
      }

      // 2. Validar que se proporcione un motivo
      if (!createDto.observaciones || createDto.observaciones.trim() === '') {
        throw new BadRequestException('El motivo/observaciones es obligatorio para crear un turno extra');
      }

      // 3. Validar que no choque con turnos existentes
      await this.validarHorariosNoChoquen(
        createDto.fecha_turno,
        createDto.hora_entrada,
        createDto.hora_salida,
        createDto.alumno_id
      );

      // 4. Validar que no existan turnos extra duplicados o superpuestos
      await this.validarTurnosExtraDuplicados(
        createDto.fecha_turno,
        createDto.fecha_limite,
        createDto.hora_entrada,
        createDto.hora_salida,
        createDto.alumno_id
      );

      // 5. Validar que el usuario existe
      const usuario = await this.usuarioRepository.findOne({
        where: { id_user: createDto.usuario_id }
      });

      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${createDto.usuario_id} no encontrado`);
      }

      // 5. Crear el turno extra
      const turnoExtra = this.turnoExtraRepository.create({
        alumno,
        fecha_turno: createDto.fecha_turno,
        fecha_limite: createDto.fecha_limite,
        hora_entrada: createDto.hora_entrada,
        hora_salida: createDto.hora_salida,
        hora_limite: createDto.hora_limite,
        observaciones: createDto.observaciones.trim(),
        usuario,
        estado: EstadoTurnoExtra.ACTIVO
      });

      const savedTurnoExtra = await this.turnoExtraRepository.save(turnoExtra);
      
      return savedTurnoExtra;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todos los turnos extra con información del alumno
   */
  async findAll(): Promise<TurnoExtra[]> {
    try {

      const turnosExtra = await this.turnoExtraRepository.find({
        relations: ['alumno', 'usuario'],
        order: { fecha_creacion: 'DESC' }
      });

      return turnosExtra;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener turnos extra de un alumno específico
   */
  async findByAlumno(alumno_id: string): Promise<TurnoExtra[]> {
    try {

      // Validar que el alumno existe
      const alumno = await this.alumnoRepository.findOne({
        where: { id_alumno: alumno_id }
      });

      if (!alumno) {
        throw new NotFoundException(`Alumno con ID ${alumno_id} no encontrado`);
      }

      const turnosExtra = await this.turnoExtraRepository.find({
        where: { alumno: { id_alumno: alumno_id } },
        relations: ['alumno', 'usuario'],
        order: { fecha_creacion: 'DESC' }
      });

      return turnosExtra;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener un turno extra por ID
   */
  async findOne(id: string): Promise<TurnoExtra> {
    try {

      const turnoExtra = await this.turnoExtraRepository.findOne({
        where: { id },
        relations: ['alumno', 'usuario']
      });

      if (!turnoExtra) {
        throw new NotFoundException(`Turno extra con ID ${id} no encontrado`);
      }

      return turnoExtra;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar un turno extra
   */
  async update(id: string, updateDto: UpdateTurnoExtraDto): Promise<TurnoExtra> {
    try {

      // 1. Verificar que el turno extra existe
      const turnoExtra = await this.findOne(id);

      // 2. Si se van a actualizar horas o fechas, validar que no choquen
      if (updateDto.hora_entrada || updateDto.hora_salida || updateDto.fecha_turno || updateDto.fecha_limite) {
        const fechaTurno = updateDto.fecha_turno || turnoExtra.fecha_turno;
        const fechaLimite = updateDto.fecha_limite || turnoExtra.fecha_limite;
        const horaEntrada = updateDto.hora_entrada || turnoExtra.hora_entrada;
        const horaSalida = updateDto.hora_salida || turnoExtra.hora_salida;

        await this.validarHorariosNoChoquen(
          fechaTurno,
          horaEntrada,
          horaSalida,
          turnoExtra.alumno.id_alumno,
          id // Excluir el turno actual de la validación
        );

        await this.validarTurnosExtraDuplicados(
          fechaTurno,
          fechaLimite,
          horaEntrada,
          horaSalida,
          turnoExtra.alumno.id_alumno,
          id // Excluir el turno actual de la validación
        );
      }

      // 3. Actualizar el turno extra
      const updatedTurnoExtra = await this.turnoExtraRepository.save({
        ...turnoExtra,
        ...updateDto
      });

      return updatedTurnoExtra;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar un turno extra (solo si está expirado)
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {

      const turnoExtra = await this.findOne(id);

      // Solo permitir eliminar si está expirado
      if (turnoExtra.estado !== EstadoTurnoExtra.EXPIRADO) {
        throw new BadRequestException(
          `Solo se pueden eliminar turnos extra con estado EXPIRADO. Estado actual: ${turnoExtra.estado}`
        );
      }

      await this.turnoExtraRepository.remove(turnoExtra);

      return {
        success: true,
        message: 'Turno extra eliminado exitosamente'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Validar que los horarios no choquen con turnos existentes
   */
  private async validarHorariosNoChoquen(
    fecha: Date,
    horaEntrada: string,
    horaSalida: string,
    alumnoId: string,
    excludeId?: string
  ): Promise<void> {
    try {
      // Obtener el turno del alumno
      const alumno = await this.alumnoRepository.findOne({
        where: { id_alumno: alumnoId },
        relations: ['turno']
      });

      if (!alumno || !alumno.turno) {
        throw new BadRequestException('El alumno no tiene un turno asignado');
      }

      // Convertir horas completas (HH:MM:SS) a minutos totales para comparación precisa
      const convertirHoraAMinutos = (hora: string): number => {
        const [horas, minutos, segundos] = hora.split(':').map(Number);
        return horas * 60 + minutos + (segundos / 60);
      };

      const horaEntradaMinutos = convertirHoraAMinutos(horaEntrada);
      const horaSalidaMinutos = convertirHoraAMinutos(horaSalida);

      // Obtener horarios del turno del alumno
      const turnoAlumno = alumno.turno;
      const horaInicioTurno = convertirHoraAMinutos(turnoAlumno.hora_inicio);
      const horaFinTurno = convertirHoraAMinutos(turnoAlumno.hora_fin);

      // Verificar que el turno extra NO esté antes o durante el turno regular del alumno
      // Un turno extra solo puede ser DESPUÉS del horario del turno regular
      const turnoExtraEnHorarioPermitido = (
        // El turno extra debe estar DESPUÉS del turno regular (hora_entrada >= hora_fin_turno)
        horaEntradaMinutos >= horaFinTurno
      );

      // Si NO está en el horario permitido, hay conflicto
      const haySolapamiento = !turnoExtraEnHorarioPermitido;

      // Logs detallados para debugging

      if (haySolapamiento) {
        const mensajeError = `El turno extra no puede estar antes o durante el turno regular del alumno (${turnoAlumno.turno}). ` +
          `Horario del turno: ${turnoAlumno.hora_inicio} - ${turnoAlumno.hora_fin}. ` +
          `Horario del turno extra: ${horaEntrada} - ${horaSalida}. ` +
          `El turno extra debe ser DESPUÉS de las ${turnoAlumno.hora_fin}`;
        
        throw new BadRequestException(mensajeError);
      }


    } catch (error) {
      throw error;
    }
  }

  /**
   * Validar que no existan turnos extra duplicados o superpuestos
   */
  private async validarTurnosExtraDuplicados(
    fechaTurno: Date | string,
    fechaLimite: Date | string,
    horaEntrada: string,
    horaSalida: string,
    alumnoId: string,
    excludeId?: string
  ): Promise<void> {
    try {

      // Convertir fechas a objetos Date si son strings
      const fechaTurnoDate = fechaTurno instanceof Date ? fechaTurno : new Date(fechaTurno);
      const fechaLimiteDate = fechaLimite instanceof Date ? fechaLimite : new Date(fechaLimite);

      // Convertir fechas a formato YYYY-MM-DD para comparación
      const fechaTurnoStr = fechaTurnoDate.toISOString().split('T')[0];
      const fechaLimiteStr = fechaLimiteDate.toISOString().split('T')[0];

      // Convertir horas a minutos para comparación numérica
      const convertirHoraAMinutos = (hora: string): number => {
        const [horas, minutos, segundos] = hora.split(':').map(Number);
        return horas * 60 + minutos + (segundos / 60);
      };

      const horaEntradaMinutos = convertirHoraAMinutos(horaEntrada);
      const horaSalidaMinutos = convertirHoraAMinutos(horaSalida);

      // Buscar turnos extra activos del mismo alumno
      const turnosExtraExistentes = await this.turnoExtraRepository.find({
        where: {
          alumno: { id_alumno: alumnoId },
          estado: EstadoTurnoExtra.ACTIVO
        }
      });

      // Si hay un excludeId, filtrar ese turno extra
      const turnosExtraFiltrados = excludeId 
        ? turnosExtraExistentes.filter(t => t.id !== excludeId)
        : turnosExtraExistentes;

             // Verificar superposición con cada turno extra existente
       for (const turnoExtraExistente of turnosExtraFiltrados) {
         // Asegurar que las fechas sean objetos Date
         const fechaTurnoExistente = turnoExtraExistente.fecha_turno instanceof Date 
           ? turnoExtraExistente.fecha_turno 
           : new Date(turnoExtraExistente.fecha_turno);
         const fechaLimiteExistente = turnoExtraExistente.fecha_limite instanceof Date 
           ? turnoExtraExistente.fecha_limite 
           : new Date(turnoExtraExistente.fecha_limite);
         
         const fechaTurnoExistenteStr = fechaTurnoExistente.toISOString().split('T')[0];
         const fechaLimiteExistenteStr = fechaLimiteExistente.toISOString().split('T')[0];
        
        const horaEntradaExistenteMinutos = convertirHoraAMinutos(turnoExtraExistente.hora_entrada);
        const horaSalidaExistenteMinutos = convertirHoraAMinutos(turnoExtraExistente.hora_salida);

        // Verificar si hay superposición de fechas
        const haySuperposicionFechas = (
          // El nuevo turno extra se superpone con el existente
          (fechaTurnoStr <= fechaLimiteExistenteStr && fechaLimiteStr >= fechaTurnoExistenteStr)
        );

        if (haySuperposicionFechas) {
          // Verificar si hay superposición de horas en las fechas superpuestas
          const haySuperposicionHoras = (
            // Los horarios se superponen
            (horaEntradaMinutos < horaSalidaExistenteMinutos && horaSalidaMinutos > horaEntradaExistenteMinutos)
          );

                     if (haySuperposicionHoras) {
             const mensajeError = `Ya existe un turno extra activo que se superpone con el horario solicitado. ` +
               `Turno extra existente: ${fechaTurnoExistenteStr} - ${fechaLimiteExistenteStr} ` +
               `(${turnoExtraExistente.hora_entrada} - ${turnoExtraExistente.hora_salida}). ` +
               `Motivo: ${turnoExtraExistente.observaciones}. ` +
               `Nuevo turno extra: ${fechaTurnoStr} - ${fechaLimiteStr} (${horaEntrada} - ${horaSalida})`;

             throw new BadRequestException(mensajeError);
           }
        }
      }


    } catch (error) {
      throw error;
    }
  }

  /**
   * Marcar turnos extra como expirados (para scheduler)
   */
  async marcarTurnosExpirados(): Promise<number> {
    try {

      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);

      const resultado = await this.turnoExtraRepository.update(
        {
          estado: EstadoTurnoExtra.ACTIVO,
          fecha_limite: fechaActual
        },
        {
          estado: EstadoTurnoExtra.EXPIRADO
        }
      );

      const turnosExpirados = resultado.affected || 0;

      return turnosExpirados;

    } catch (error) {
      throw error;
    }
  }
}
