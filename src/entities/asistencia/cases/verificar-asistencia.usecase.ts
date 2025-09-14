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
      console.log(`🚀🚀🚀 INICIANDO VerificarAsistenciaUseCase 🚀🚀🚀`);
      console.log(`📝 Código recibido: ${codigo}`);
      console.log(`📅 Fecha recibida: ${fecha.toISOString()}`);

      // 1. Buscar el alumno por código, incluyendo el turno asignado
      console.log(`🔍 Buscando alumno con código: ${codigo}`);
      const alumno = await this.alumnoRepository.findByCodigoAlumno(codigo);
      
      if (!alumno) {
        console.log(`❌ Alumno NO encontrado con código: ${codigo}`);
        return {
          tiene_asistencia: false,
          mensaje: `No se encontró ningún alumno con el código: ${codigo}`,
        };
      }
      console.log(`✅ Alumno encontrado: ${alumno.codigo} - ${alumno.nombre} ${alumno.apellido}`);


      // 2. Verificar si ya tiene asistencia para esa fecha (buscar la MÁS RECIENTE)
      console.log(`🔍 Buscando asistencia existente para alumno ID: ${alumno.id_alumno} y fecha: ${fecha.toISOString()}`);
      
      // Buscar la asistencia más reciente para esa fecha
      const asistenciaExistente = await this.asistenciaRepository.findByAlumnoAndDate(
        alumno.id_alumno,
        fecha
      );
      console.log(`🔍 Resultado búsqueda asistencia: ${asistenciaExistente ? 'ENCONTRADA' : 'NO ENCONTRADA'}`);

      if (asistenciaExistente) {
        console.log(`📊 Asistencia encontrada - Estado: "${asistenciaExistente.estado_asistencia}"`);
        // Si la asistencia está anulada, permitir crear nueva asistencia
        if (asistenciaExistente.estado_asistencia === 'ANULADO') {
          console.log(`✅ Asistencia está ANULADA - PERMITIENDO crear nueva asistencia`);
          // Construir respuesta del alumno para permitir registro
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
            mensaje: `El alumno ${alumno.nombre} ${alumno.apellido} tiene una asistencia ANULADA para el ${fecha.toISOString().split('T')[0]}. Se puede crear nueva asistencia.`,
            alumno: alumnoInfo,
          };
        }
        
        // Si NO está anulada (PUNTUAL, TARDANZA, AUSENTE, JUSTIFICADO), bloquear el registro
        console.log(`❌ Asistencia NO está anulada - BLOQUEANDO registro`);
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
      console.log(`✅ No hay asistencia existente - PERMITIENDO crear nueva asistencia`);
      
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
      throw error;
    }
  }
}
