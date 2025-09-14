import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { Administrador } from 'src/entities/administrador/administrador.entity';
import { Director } from 'src/entities/director/director.entity';
import { ActualizacionesAsistencia } from 'src/entities/actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';
import { AnularAsistenciaRequestDto } from '../infraestructure/dto/AnularAsistenciaRequest.dto';
import { AnularAsistenciaResponseDto } from '../infraestructure/dto/AnularAsistenciaResponse.dto';
import { TelegramNotificationService } from 'src/entities/telegram/services/telegram-notification.service';

@Injectable()
export class AnularAsistenciaUseCase {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,

    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,

    @InjectRepository(Auxiliar)
    private readonly auxiliarRepository: Repository<Auxiliar>,

    @InjectRepository(Administrador)
    private readonly administradorRepository: Repository<Administrador>,

    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,

    @InjectRepository(ActualizacionesAsistencia)
    private readonly actualizacionesRepository: Repository<ActualizacionesAsistencia>,
    
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  async execute(dto: AnularAsistenciaRequestDto): Promise<AnularAsistenciaResponseDto> {
    console.log(`🚀🚀🚀 INICIANDO AnularAsistenciaUseCase 🚀🚀🚀`);
    console.log(`📝 Código estudiante: ${dto.codigo_estudiante}`);
    console.log(`📅 Fecha proporcionada: ${dto.fecha || 'NO PROPORCIONADA'}`);
    console.log(`👤 ID Usuario: ${dto.id_usuario || 'NO PROPORCIONADO'}`);
    console.log(`👨‍💼 ID Auxiliar: ${dto.id_auxiliar || 'NO PROPORCIONADO'}`);
    console.log(`📄 Motivo: ${dto.motivo}`);
    
    // 1. Buscar al alumno por código
    console.log(`🔍 PASO 1: Buscando alumno con código: ${dto.codigo_estudiante}`);
    const alumno = await this.alumnoRepository.findOne({
      where: { codigo: dto.codigo_estudiante }
    });

    if (!alumno) {
      console.log(`❌ PASO 1 FALLIDO: Alumno NO encontrado con código: ${dto.codigo_estudiante}`);
      throw new NotFoundException(`No se encontró ningún alumno con el código: ${dto.codigo_estudiante}`);
    }
    console.log(`✅ PASO 1 EXITOSO: Alumno encontrado: ${alumno.codigo} - ${alumno.nombre} ${alumno.apellido}`);
    console.log(`🆔 ID del alumno: ${alumno.id_alumno}`);

    // 2. Buscar el actor (auxiliar, administrador o director) según el campo enviado
    console.log(`🔍 PASO 2: Buscando actor que realiza la anulación`);
    let actor: any = null;
    let tipoActor: string = '';

    if (dto.id_auxiliar) {
      console.log(`👨‍💼 Buscando auxiliar con ID: ${dto.id_auxiliar}`);
      actor = await this.auxiliarRepository.findOne({
        where: { id_auxiliar: dto.id_auxiliar }
      });
      tipoActor = 'auxiliar';
      if (actor) {
        console.log(`✅ Auxiliar encontrado: ${actor.nombres} ${actor.apellidos}`);
      } else {
        console.log(`❌ Auxiliar NO encontrado con ID: ${dto.id_auxiliar}`);
      }
    } else if (dto.id_usuario) {
      console.log(`👤 Buscando usuario con ID: ${dto.id_usuario}`);
      // Buscar primero en administradores
      console.log(`🔍 Buscando en administradores...`);
      actor = await this.administradorRepository.findOne({
        where: { id_administrador: dto.id_usuario }
      });
      
      if (actor) {
        tipoActor = 'administrador';
        console.log(`✅ Administrador encontrado: ${actor.nombres} ${actor.apellidos}`);
      } else {
        console.log(`❌ No es administrador, buscando en directores...`);
        // Si no es administrador, buscar en directores
        actor = await this.directorRepository.findOne({
          where: { id_director: dto.id_usuario }
        });
        
        if (actor) {
          tipoActor = 'director';
          console.log(`✅ Director encontrado: ${actor.nombres} ${actor.apellidos}`);
        } else {
          console.log(`❌ Director NO encontrado con ID: ${dto.id_usuario}`);
        }
      }
    }

    if (!actor) {
      console.log(`❌ PASO 2 FALLIDO: No se encontró ningún ${tipoActor || 'usuario'} con el ID proporcionado`);
      throw new NotFoundException(`No se encontró ningún ${tipoActor || 'usuario'} con el ID proporcionado`);
    }
    console.log(`✅ PASO 2 EXITOSO: Actor encontrado - Tipo: ${tipoActor}, ID: ${actor.id_administrador || actor.id_director || actor.id_auxiliar}`);

    // 3. Determinar fecha objetivo (YYYY-MM-DD). Si no se envía, usar fecha actual Perú
    console.log(`🔍 PASO 3: Determinando fecha objetivo para búsqueda`);
    let fechaFormato: string;
    if (dto.fecha) {
      console.log(`📅 Usando fecha proporcionada: ${dto.fecha}`);
      const d = new Date(dto.fecha);
      if (isNaN(d.getTime())) {
        console.log(`❌ PASO 3 FALLIDO: La fecha no es válida: ${dto.fecha}`);
        throw new BadRequestException('La fecha no es válida. Use formato YYYY-MM-DD');
      }
      fechaFormato = dto.fecha;
      console.log(`✅ PASO 3 EXITOSO: Fecha validada: ${fechaFormato}`);
    } else {
      console.log(`📅 No se proporcionó fecha, calculando fecha actual de Perú`);
      // Obtener fecha actual en zona horaria de Perú (UTC-5)
      const ahora = new Date();
      console.log(`🕐 Hora UTC actual: ${ahora.toISOString()}`);
      
      // Convertir a hora de Perú usando toLocaleString
      const fechaPeru = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Lima"}));
      console.log(`🕐 Hora Perú: ${fechaPeru.toISOString()}`);
      
      // CORREGIR: Usar la fecha local de Perú, no UTC
      const año = fechaPeru.getFullYear();
      const mes = String(fechaPeru.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaPeru.getDate()).padStart(2, '0');
      fechaFormato = `${año}-${mes}-${dia}`;
      
      console.log(`📅 Fecha formato para búsqueda (corregida): ${fechaFormato}`);
      console.log(`✅ PASO 3 EXITOSO: Fecha calculada: ${fechaFormato}`);
    }

    // 4. Buscar asistencia del alumno para la fecha específica
    console.log(`🔍 PASO 4: Buscando asistencia del alumno para fecha: ${fechaFormato}`);
    
    // Primero buscar TODAS las asistencias del alumno para debuggear
    console.log(`🔍 Buscando TODAS las asistencias del alumno ${dto.codigo_estudiante}...`);
    const todasLasAsistencias = await this.asistenciaRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.alumno', 'alumno')
      .where('alumno.codigo = :codigo', { codigo: dto.codigo_estudiante })
      .orderBy('asistencia.fecha', 'DESC')
      .getMany();
    
    console.log(`📊 Total de asistencias encontradas para el alumno: ${todasLasAsistencias.length}`);
    todasLasAsistencias.forEach((asist, index) => {
      console.log(`  ${index + 1}. Fecha: ${asist.fecha.toISOString()}, Estado: ${asist.estado_asistencia}, ID: ${asist.id_asistencia}`);
    });
    
    // Ahora buscar específicamente para la fecha
    console.log(`🔍 Buscando asistencia específica para fecha: ${fechaFormato}`);
    console.log(`🔍 Usando consulta SQL con rango de fechas para evitar problemas de zona horaria`);
    
    // Crear rango de fechas para evitar problemas de zona horaria
    const fechaInicio = `${fechaFormato} 00:00:00`;
    const fechaFin = `${fechaFormato} 23:59:59`;
    console.log(`📅 Rango de búsqueda: ${fechaInicio} a ${fechaFin}`);
    
    const asistencia = await this.asistenciaRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.alumno', 'alumno')
      .where('alumno.codigo = :codigo', { codigo: dto.codigo_estudiante })
      .andWhere('asistencia.fecha >= :fechaInicio', { fechaInicio })
      .andWhere('asistencia.fecha <= :fechaFin', { fechaFin })
      .orderBy('asistencia.fecha', 'DESC')
      .getOne();
    
    console.log(`🔍 Resultado de búsqueda específica: ${asistencia ? 'ENCONTRADA' : 'NO ENCONTRADA'}`);
    if (asistencia) {
      console.log(`📊 Asistencia encontrada: ID=${asistencia.id_asistencia}, Fecha=${asistencia.fecha.toISOString()}, Estado=${asistencia.estado_asistencia}`);
    }

    if (!asistencia) {
      console.log(`❌ PASO 4 FALLIDO: NO se encontró asistencia para el alumno ${dto.codigo_estudiante} en la fecha ${fechaFormato}`);
      throw new NotFoundException(`No se encontró asistencia registrada para el alumno ${dto.codigo_estudiante} en la fecha ${fechaFormato}`);
    }
    console.log(`✅ PASO 4 EXITOSO: Asistencia encontrada`);
    console.log(`📊 Detalles de la asistencia encontrada:`);
    console.log(`  - ID: ${asistencia.id_asistencia}`);
    console.log(`  - Estado actual: ${asistencia.estado_asistencia}`);
    console.log(`  - Fecha: ${asistencia.fecha.toISOString()}`);
    console.log(`  - Hora llegada: ${asistencia.hora_de_llegada}`);
    console.log(`  - Hora salida: ${asistencia.hora_salida}`);

    // 5. Validar que la asistencia se pueda anular
    console.log(`🔍 PASO 5: Validando si la asistencia se puede anular`);
    if (asistencia.estado_asistencia === EstadoAsistencia.ANULADO) {
      console.log(`❌ PASO 5 FALLIDO: La asistencia ya está anulada`);
      throw new ConflictException(`La asistencia ya está anulada para el alumno ${alumno.nombre} ${alumno.apellido}`);
    }

    if (asistencia.estado_asistencia === EstadoAsistencia.AUSENTE) {
      console.log(`❌ PASO 5 FALLIDO: No se puede anular una ausencia`);
      throw new BadRequestException(`No se puede anular una ausencia. Las ausencias no se anulan, use la interfaz de justificaciones si es necesario.`);
    }

    // Solo se pueden anular PUNTUAL, TARDANZA o estados vacíos/nulos
    if (asistencia.estado_asistencia && 
        asistencia.estado_asistencia !== EstadoAsistencia.PUNTUAL && 
        asistencia.estado_asistencia !== EstadoAsistencia.TARDANZA) {
      console.log(`❌ PASO 5 FALLIDO: Estado no permitido para anulación: ${asistencia.estado_asistencia}`);
      throw new BadRequestException(`No se puede anular una asistencia con estado: ${asistencia.estado_asistencia}. Solo se pueden anular asistencias PUNTUAL, TARDANZA o sin estado definido.`);
    }
    console.log(`✅ PASO 5 EXITOSO: La asistencia se puede anular (estado: ${asistencia.estado_asistencia})`);

    // 6. Cambiar el estado a ANULADO usando save() para evitar problemas de enum
    console.log(`🔍 PASO 6: Cambiando estado de asistencia a ANULADO`);
    console.log(`📝 Estado anterior: ${asistencia.estado_asistencia}`);
    
    // Usar save() en lugar de update() para manejar correctamente los enums
    asistencia.estado_asistencia = EstadoAsistencia.ANULADO;
    console.log(`📝 Estado nuevo: ${asistencia.estado_asistencia}`);
    console.log(`💾 Guardando asistencia actualizada en base de datos...`);
    const asistenciaActualizada = await this.asistenciaRepository.save(asistencia);
    console.log(`✅ PASO 6 EXITOSO: Asistencia guardada con estado ANULADO`);
    console.log(`📊 Asistencia actualizada:`);
    console.log(`  - ID: ${asistenciaActualizada.id_asistencia}`);
    console.log(`  - Estado: ${asistenciaActualizada.estado_asistencia}`);
    console.log(`  - Fecha: ${asistenciaActualizada.fecha.toISOString()}`);

    // 7. Usar la asistencia ya actualizada por save()
    const asistenciaAnulada = asistenciaActualizada;
    
    console.log(`🔍 PASO 7: Verificación final de la asistencia anulada`);
    console.log(`📊 Verificación completa de la asistencia:`, {
      id: asistenciaAnulada.id_asistencia,
      estado: asistenciaAnulada.estado_asistencia,
      fecha: asistenciaAnulada.fecha,
      alumno: asistenciaAnulada.alumno?.nombre
    });

    // 8. Crear registro en la tabla actualizaciones_asistencia
    console.log(`🔍 PASO 8: Creando registro de actualización`);
    const actualizacion = new ActualizacionesAsistencia();
    actualizacion.asistencia = asistenciaAnulada;
    actualizacion.alumno = alumno;
    console.log(`📝 Registro de actualización creado para asistencia: ${asistenciaAnulada.id_asistencia}`);
    
    // Asignar el actor correspondiente según el tipo
    if (tipoActor === 'auxiliar') {
      actualizacion.auxiliar = actor;
      console.log(`👨‍💼 Asignado auxiliar: ${actor.nombres} ${actor.apellidos}`);
    } else if (tipoActor === 'administrador') {
      actualizacion.administrador = actor;
      console.log(`👤 Asignado administrador: ${actor.nombres} ${actor.apellidos}`);
    } else if (tipoActor === 'director') {
      actualizacion.director = actor;
      console.log(`👨‍💼 Asignado director: ${actor.nombres} ${actor.apellidos}`);
    }
    
    actualizacion.motivo = `ANULACIÓN: ${dto.motivo}`;
    console.log(`📄 Motivo de anulación: ${actualizacion.motivo}`);

    console.log(`💾 Guardando registro de actualización en base de datos...`);
    await this.actualizacionesRepository.save(actualizacion);
    console.log(`✅ PASO 8 EXITOSO: Registro de actualización guardado`);

    // 9. Enviar notificación de Telegram al apoderado
    console.log(`🔍 PASO 9: Enviando notificación de Telegram al apoderado`);
    try {
      console.log(`📱 Iniciando notificación de Telegram para anulación...`);
      await this.telegramNotificationService.notificarAsistenciaApoderado(
        asistenciaAnulada, 
        `ANULACIÓN: ${dto.motivo}`, 
        'ANULACION'
      );
      console.log(`✅ PASO 9 EXITOSO: Notificación de Telegram enviada`);
    } catch (telegramError) {
      console.log(`⚠️ PASO 9 ADVERTENCIA: Error en notificación de Telegram: ${telegramError.message}`);
      // No lanzamos error para no afectar la anulación de asistencia
    }

    // 10. Construir la respuesta
    console.log(`🔍 PASO 10: Construyendo respuesta final`);
    const response: AnularAsistenciaResponseDto = {
      message: `Asistencia anulada exitosamente para el alumno ${alumno.nombre} ${alumno.apellido}`,
      codigo_estudiante: alumno.codigo,
      fecha: fechaFormato,
      motivo: dto.motivo,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ PASO 10 EXITOSO: Respuesta construida`);
    console.log(`📊 Respuesta final:`, response);
    console.log(`🎉🎉🎉 ANULAR ASISTENCIA COMPLETADO EXITOSAMENTE 🎉🎉🎉`);

    return response;
  }
}
