import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';
import { CrearAusenciaAlumnoDto } from '../infraestructure/dto/CrearAusenciaAlumno.dto';
import { ResponseAusenciaAlumno } from '../infraestructure/dto/ResponseAusenciaAlumno.dto';
import { TelegramNotificationService } from 'src/entities/telegram/services/telegram-notification.service';

@Injectable()
export class CrearAusenciaAlumnoUseCase {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
    
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  async execute(dto: CrearAusenciaAlumnoDto): Promise<ResponseAusenciaAlumno> {
    // 1. Buscar al alumno por código
    const alumno = await this.alumnoRepository.findOne({
      where: { codigo: dto.codigo }
    });

    if (!alumno) {
      throw new NotFoundException(`No se encontró ningún alumno con el código: ${dto.codigo}`);
    }

             // 2. Determinar la fecha (usar la proporcionada o fecha actual)
         let fechaAusencia: Date;
         if (dto.fecha) {
           // Si se proporciona fecha, crear una fecha a las 00:00:00 en hora local
           const [year, month, day] = dto.fecha.split('-').map(Number);
           fechaAusencia = new Date(year, month - 1, day, 0, 0, 0, 0);
                 } else {
          // Crear fecha actual en zona horaria de Perú (UTC-5)
          const ahora = new Date();
          const offsetPeru = -5 * 60; // UTC-5 en minutos
          const fechaPeru = new Date(ahora.getTime() + (offsetPeru * 60 * 1000));
          
          // Construir fecha a las 00:00:00 en hora local de Perú
          fechaAusencia = new Date(fechaPeru.getFullYear(), fechaPeru.getMonth(), fechaPeru.getDate(), 0, 0, 0, 0);
          
        }
    
    // 3. Verificar que no exista asistencia para ese alumno en esa fecha
    // Usar la MISMA lógica que funciona en CreateAsistenciaManual
    let asistenciaExistente: any = null;
             if (dto.fecha) {
           const fechaFormato = dto.fecha; // "2025-08-22"
      
      // Mostrar TODOS los registros de ese alumno PRIMERO
      const todasLasAsistencias = await this.asistenciaRepository
        .createQueryBuilder('asistencia')
        .leftJoinAndSelect('asistencia.alumno', 'alumno')
        .where('alumno.id_alumno = :alumnoId', { alumnoId: alumno.id_alumno })
        .getMany();
        
      todasLasAsistencias.forEach((asist, index) => {
        console.log(`🔍 [CrearAusenciaAlumnoUseCase] Registro ${index + 1}:`, {
          id: asist.id_asistencia,
          fecha: asist.fecha,
          fechaISO: asist.fecha.toISOString(),
          fechaSplit: asist.fecha.toISOString().split('T')[0],
          estado: asist.estado_asistencia
        });
      });
      
      // Buscar manualmente en los registros ya obtenidos (función DATE() no funciona)
      asistenciaExistente = todasLasAsistencias.find(asist => {
        const fechaRegistro = asist.fecha.toISOString().split('T')[0];
        return fechaRegistro === fechaFormato;
      });
        
      
      if (asistenciaExistente) {
      }
    } else {
      // Si no se proporciona fecha, validar con fecha actual
      const fechaFormato = fechaAusencia.toISOString().split('T')[0];
      
      // Obtener todos los registros y buscar manualmente
      const todasLasAsistencias = await this.asistenciaRepository
        .createQueryBuilder('asistencia')
        .leftJoinAndSelect('asistencia.alumno', 'alumno')
        .where('alumno.id_alumno = :alumnoId', { alumnoId: alumno.id_alumno })
        .getMany();
        
      
      // Buscar manualmente
      asistenciaExistente = todasLasAsistencias.find(asist => {
        const fechaRegistro = asist.fecha.toISOString().split('T')[0];
        return fechaRegistro === fechaFormato;
      });
        
      
      if (asistenciaExistente) {
      }
    }

    if (asistenciaExistente) {
      console.log(`🔍 [CrearAusenciaAlumnoUseCase] Asistencia existente encontrada para ${alumno.codigo}`);
      console.log(`📊 Estado actual: "${asistenciaExistente.estado_asistencia}"`);
      console.log(`🔍 Comparando con EstadoAsistencia.ANULADO: "${EstadoAsistencia.ANULADO}"`);
      
      // Verificar si la asistencia existente está anulada
      if (asistenciaExistente.estado_asistencia === EstadoAsistencia.ANULADO) {
        console.log(`✅ Asistencia existente está ANULADA, permitiendo registrar ausencia para ${alumno.codigo}`);
        // Si está anulada, permitir registrar ausencia
      } else if (asistenciaExistente.estado_asistencia === EstadoAsistencia.AUSENTE) {
        console.log(`❌ Ya existe una AUSENCIA registrada, bloqueando registro`);
        throw new ConflictException(
          `Ya existe un registro de AUSENCIA para el alumno ${alumno.nombre} ${alumno.apellido} en la fecha ${dto.fecha || fechaAusencia.toISOString().split('T')[0]}`
        );
      } else {
        console.log(`❌ Asistencia NO está anulada, bloqueando registro de ausencia`);
        // Si existe otro tipo de asistencia (PUNTUAL, TARDANZA, JUSTIFICADO), impedir
        throw new ConflictException(
          `Ya existe un registro de asistencia (${asistenciaExistente.estado_asistencia}) para el alumno ${alumno.nombre} ${alumno.apellido} en la fecha ${dto.fecha || fechaAusencia.toISOString().split('T')[0]}. Solo se puede registrar ausencia si la asistencia está anulada.`
        );
      }
    } else {
      console.log(`ℹ️ No se encontró asistencia existente para ${alumno.codigo}, procediendo con registro de ausencia`);
    }

    // 4. Crear el registro de ausencia
    // Obtener fecha y hora actual de Perú para el registro
    const ahora = new Date();
    const fechaHoraRegistro = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Lima"}));
    
    const ausencia = this.asistenciaRepository.create({
      alumno: alumno,
      fecha: fechaHoraRegistro, // Usar fecha y hora real de registro
      estado_asistencia: EstadoAsistencia.AUSENTE,
      hora_de_llegada: '', // Ausente no tiene hora de llegada
      hora_salida: null,   // Ausente no tiene hora de salida
    });

    const ausenciaGuardada = await this.asistenciaRepository.save(ausencia);

    // 5. Enviar notificación de Telegram al apoderado
    try {
      await this.telegramNotificationService.notificarAsistenciaApoderado(ausenciaGuardada);
    } catch (telegramError) {
      // No lanzamos error para no afectar el registro de ausencia
    }

    // 6. Construir la respuesta
    const response: ResponseAusenciaAlumno = {
      message: 'Ausencia registrada exitosamente',
      id: ausenciaGuardada.id_asistencia,
      alumno: `${alumno.nombre} ${alumno.apellido}`,
      codigo: alumno.codigo,
      fecha: dto.fecha || fechaAusencia.toISOString().split('T')[0],
      estado: EstadoAsistencia.AUSENTE,
    };

    return response;
  }
}
