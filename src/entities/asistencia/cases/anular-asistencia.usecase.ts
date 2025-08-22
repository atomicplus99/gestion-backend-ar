import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { ActualizacionesAsistencia } from 'src/entities/actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';
import { AnularAsistenciaRequestDto } from '../infraestructure/dto/AnularAsistenciaRequest.dto';
import { AnularAsistenciaResponseDto } from '../infraestructure/dto/AnularAsistenciaResponse.dto';

@Injectable()
export class AnularAsistenciaUseCase {
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

  async execute(dto: AnularAsistenciaRequestDto): Promise<AnularAsistenciaResponseDto> {
    // 1. Buscar al alumno por código
    const alumno = await this.alumnoRepository.findOne({
      where: { codigo: dto.codigo_estudiante }
    });

    if (!alumno) {
      throw new NotFoundException(`No se encontró ningún alumno con el código: ${dto.codigo_estudiante}`);
    }

    // 2. Buscar el auxiliar por ID
    const auxiliar = await this.auxiliarRepository.findOne({
      where: { id_auxiliar: dto.id_auxiliar }
    });

    if (!auxiliar) {
      throw new NotFoundException(`No se encontró ningún auxiliar con el ID: ${dto.id_auxiliar}`);
    }

    // 3. Buscar la asistencia del día actual del alumno
    const fechaHoy = new Date();
    const fechaFormato = fechaHoy.toISOString().split('T')[0];

    const asistencia = await this.asistenciaRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.alumno', 'alumno')
      .where('alumno.codigo = :codigo', { codigo: dto.codigo_estudiante })
      .andWhere('DATE(asistencia.fecha) = :fecha', { fecha: fechaFormato })
      .orderBy('asistencia.fecha', 'DESC')
      .getOne();

    if (!asistencia) {
      throw new NotFoundException(`No se encontró asistencia registrada para el alumno ${dto.codigo_estudiante} en la fecha ${fechaFormato}`);
    }

    // 4. Validar que la asistencia se pueda anular
    if (asistencia.estado_asistencia === EstadoAsistencia.ANULADO) {
      throw new ConflictException(`La asistencia ya está anulada para el alumno ${alumno.nombre} ${alumno.apellido}`);
    }

    if (asistencia.estado_asistencia === EstadoAsistencia.AUSENTE) {
      throw new BadRequestException(`No se puede anular una ausencia. Las ausencias no se anulan, use la interfaz de justificaciones si es necesario.`);
    }

    // Solo se pueden anular PUNTUAL, TARDANZA o estados vacíos/nulos
    if (asistencia.estado_asistencia && 
        asistencia.estado_asistencia !== EstadoAsistencia.PUNTUAL && 
        asistencia.estado_asistencia !== EstadoAsistencia.TARDANZA) {
      throw new BadRequestException(`No se puede anular una asistencia con estado: ${asistencia.estado_asistencia}. Solo se pueden anular asistencias PUNTUAL, TARDANZA o sin estado definido.`);
    }

    // 5. Cambiar el estado a ANULADO usando save() para evitar problemas de enum
    console.log(`🔍 [DEBUG] Antes de actualizar - Estado actual: "${asistencia.estado_asistencia}"`);
    console.log(`🔍 [DEBUG] ID de asistencia a actualizar: ${asistencia.id_asistencia}`);
    console.log(`🔍 [DEBUG] Nuevo estado a asignar: ${EstadoAsistencia.ANULADO}`);
    
    // Usar save() en lugar de update() para manejar correctamente los enums
    asistencia.estado_asistencia = EstadoAsistencia.ANULADO;
    const asistenciaActualizada = await this.asistenciaRepository.save(asistencia);
    
    console.log(`🔍 [DEBUG] Resultado del save:`, asistenciaActualizada.estado_asistencia);

    // 6. Usar la asistencia ya actualizada por save()
    const asistenciaAnulada = asistenciaActualizada;
    
    console.log(`🔍 [DEBUG] Asistencia actualizada - Nuevo estado: "${asistenciaAnulada.estado_asistencia}"`);
    console.log(`🔍 [DEBUG] Verificación completa de la asistencia:`, {
      id: asistenciaAnulada.id_asistencia,
      estado: asistenciaAnulada.estado_asistencia,
      fecha: asistenciaAnulada.fecha,
      alumno: asistenciaAnulada.alumno?.nombre
    });

    // 7. Crear registro en la tabla actualizaciones_asistencia
    const actualizacion = new ActualizacionesAsistencia();
    actualizacion.asistencia = asistenciaAnulada;
    actualizacion.alumno = alumno;
    actualizacion.auxiliar = auxiliar;
    actualizacion.motivo = `ANULACIÓN: ${dto.motivo}`;

    await this.actualizacionesRepository.save(actualizacion);

    // 8. Construir la respuesta
    const response: AnularAsistenciaResponseDto = {
      message: `Asistencia anulada exitosamente para el alumno ${alumno.nombre} ${alumno.apellido}`,
      codigo_estudiante: alumno.codigo,
      fecha: fechaFormato,
      motivo: dto.motivo,
      timestamp: new Date().toISOString(),
    };

    return response;
  }
}
