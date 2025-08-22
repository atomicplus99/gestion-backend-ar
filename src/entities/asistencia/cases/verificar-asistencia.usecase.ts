import { Injectable } from '@nestjs/common';
import { AsistenciaTypeOrmRepository } from '../domain/repository/asistencia.repository';
import { AlumnoTypeOrmRepository } from '../../alumno/infraestructure/adapters/outbounds/repository/alumno.repository';
import { VerificarAsistenciaResponse, AlumnoInfoAsistenciaManual, AsistenciaExistenteManual } from '../infraestructure/dto/VerificarAsistenciaResponse.dto';

export interface VerificarAsistenciaPort {
  execute(codigo: string, fecha: Date): Promise<VerificarAsistenciaResponse>;
}

@Injectable()
export class VerificarAsistenciaUseCase implements VerificarAsistenciaPort {
  constructor(
    private readonly asistenciaRepository: AsistenciaTypeOrmRepository,
    private readonly alumnoRepository: AlumnoTypeOrmRepository,
  ) {}

  async execute(codigo: string, fecha: Date): Promise<VerificarAsistenciaResponse> {
    try {
      console.log('🔍 [VerificarAsistenciaUseCase] Verificando asistencia para código:', codigo, 'fecha:', fecha);

      // 1. Buscar el alumno por código
      const alumno = await this.alumnoRepository.findOne(codigo);
      
      if (!alumno) {
        console.log('❌ [VerificarAsistenciaUseCase] Alumno no encontrado con código:', codigo);
        return {
          tiene_asistencia: false,
          mensaje: `No se encontró ningún alumno con el código: ${codigo}`,
        };
      }

      console.log('✅ [VerificarAsistenciaUseCase] Alumno encontrado:', alumno.nombre, alumno.apellido);

      // 2. Verificar si ya tiene asistencia para esa fecha
      const asistenciaExistente = await this.asistenciaRepository.findByAlumnoAndDate(
        alumno.id_alumno,
        fecha
      );

      if (asistenciaExistente) {
        console.log('✅ [VerificarAsistenciaUseCase] Asistencia encontrada para la fecha');
        
        // Construir respuesta con asistencia existente
        const asistenciaInfo: AsistenciaExistenteManual = {
          id_asistencia: asistenciaExistente.id_asistencia,
          hora_de_llegada: asistenciaExistente.hora_de_llegada,
          hora_salida: asistenciaExistente.hora_salida || undefined,
          estado_asistencia: asistenciaExistente.estado_asistencia,
          fecha: asistenciaExistente.fecha,
        };

        return {
          tiene_asistencia: true,
          mensaje: `El alumno ${alumno.nombre} ${alumno.apellido} ya tiene asistencia registrada para el ${fecha.toISOString().split('T')[0]}`,
          asistencia: asistenciaInfo,
        };
      }

      // 3. Si no tiene asistencia, devolver información del alumno para registro manual
      console.log('ℹ️ [VerificarAsistenciaUseCase] No hay asistencia registrada, devolviendo info del alumno');
      
      const alumnoInfo: AlumnoInfoAsistenciaManual = {
        id_alumno: alumno.id_alumno,
        codigo: alumno.codigo,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        seccion: alumno.seccion,
        grado: alumno.grado,
        nivel: alumno.nivel,
        turno: alumno.turno?.turno || undefined,
      };

      return {
        tiene_asistencia: false,
        mensaje: `El alumno ${alumno.nombre} ${alumno.apellido} no tiene asistencia registrada para el ${fecha.toISOString().split('T')[0]}. Puede proceder con el registro manual.`,
        alumno: alumnoInfo,
      };

    } catch (error) {
      console.error('❌ [VerificarAsistenciaUseCase] Error al verificar asistencia:', error);
      throw error;
    }
  }
}
