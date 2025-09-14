import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JustificacionRepository } from '../justificacion.repository';
import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Asistencia } from '../../asistencia/asistencia.entity';

@Injectable()
export class DeleteJustificacionUseCase {
  private readonly logger = new Logger(DeleteJustificacionUseCase.name);

  constructor(
    private readonly justificacionRepository: JustificacionRepository,
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
  ) {}

  async execute(idJustificacion: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`🚀 INICIANDO DeleteJustificacionUseCase para ID: ${idJustificacion}`);

    // 1. Validar que el ID no esté vacío
    if (!idJustificacion || idJustificacion.trim() === '') {
      this.logger.error(`❌ ID de justificación vacío o inválido`);
      throw new BadRequestException('ID de justificación es requerido');
    }

    // 2. Verificar que la justificación existe
    this.logger.log(`🔍 Buscando justificación con ID: ${idJustificacion}`);
    const justificacionExistente = await this.justificacionRepository.findById(idJustificacion);
    
    if (!justificacionExistente) {
      this.logger.error(`❌ Justificación no encontrada con ID: ${idJustificacion}`);
      throw new NotFoundException(`Justificación con ID ${idJustificacion} no encontrada`);
    }

    this.logger.log(`✅ Justificación encontrada: ${justificacionExistente.id_justificacion}`);
    this.logger.log(`📊 Detalles de la justificación a eliminar:`);
    this.logger.log(`   - ID: ${justificacionExistente.id_justificacion}`);
    this.logger.log(`   - Estado: ${justificacionExistente.estado}`);
    this.logger.log(`   - Tipo: ${justificacionExistente.tipo_justificacion}`);
    this.logger.log(`   - Motivo: ${justificacionExistente.motivo}`);
    this.logger.log(`   - Fechas: ${justificacionExistente.fecha_de_justificacion?.join(', ')}`);

    // 3. Buscar y eliminar asistencias JUSTIFICADAS relacionadas
    this.logger.log(`🔍 Buscando asistencias JUSTIFICADAS relacionadas con esta justificación`);
    
    if (justificacionExistente.fecha_de_justificacion && justificacionExistente.fecha_de_justificacion.length > 0) {
      const fechasJustificacion = justificacionExistente.fecha_de_justificacion;
      this.logger.log(`📅 Fechas de justificación a procesar: ${fechasJustificacion.join(', ')}`);
      
      for (const fechaStr of fechasJustificacion) {
        // Convertir fecha DD-MM-YYYY a YYYY-MM-DD para la consulta
        const [dia, mes, año] = fechaStr.split('-');
        const fechaFormato = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        
        this.logger.log(`🔍 Buscando asistencias JUSTIFICADAS para fecha: ${fechaFormato}`);
        
        // Buscar asistencias JUSTIFICADAS del alumno en esa fecha
        const asistenciasJustificadas = await this.asistenciaRepository
          .createQueryBuilder('asistencia')
          .leftJoinAndSelect('asistencia.alumno', 'alumno')
          .where('alumno.id_alumno = :idAlumno', { idAlumno: justificacionExistente.alumno.id_alumno })
          .andWhere('asistencia.estado_asistencia = :estado', { estado: 'JUSTIFICADO' })
          .andWhere('DATE(asistencia.fecha) = :fecha', { fecha: fechaFormato })
          .getMany();
        
        this.logger.log(`📊 Asistencias JUSTIFICADAS encontradas: ${asistenciasJustificadas.length}`);
        
        if (asistenciasJustificadas.length > 0) {
          for (const asistencia of asistenciasJustificadas) {
            this.logger.log(`🗑️ Eliminando asistencia JUSTIFICADA: ID=${asistencia.id_asistencia}, Fecha=${asistencia.fecha.toISOString()}`);
            await this.asistenciaRepository.remove(asistencia);
            this.logger.log(`✅ Asistencia JUSTIFICADA eliminada: ${asistencia.id_asistencia}`);
          }
        } else {
          this.logger.log(`ℹ️ No se encontraron asistencias JUSTIFICADAS para eliminar en fecha: ${fechaFormato}`);
        }
      }
    } else {
      this.logger.log(`ℹ️ No hay fechas de justificación para procesar`);
    }

    // 4. Eliminar la justificación
    this.logger.log(`🗑️ Eliminando justificación con ID: ${idJustificacion}`);
    const eliminado = await this.justificacionRepository.delete(idJustificacion);

    if (!eliminado) {
      this.logger.error(`❌ Error al eliminar justificación con ID: ${idJustificacion}`);
      throw new BadRequestException('Error al eliminar la justificación');
    }

    this.logger.log(`✅ Justificación eliminada exitosamente con ID: ${idJustificacion}`);
    
    return {
      success: true,
      message: `Justificación eliminada exitosamente`
    };
  }
}
