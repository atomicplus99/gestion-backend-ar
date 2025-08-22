import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from '../asistencia.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';
import { CrearAusenciaAlumnoDto } from '../infraestructure/dto/CrearAusenciaAlumno.dto';
import { ResponseAusenciaAlumno } from '../infraestructure/dto/ResponseAusenciaAlumno.dto';

@Injectable()
export class CrearAusenciaAlumnoUseCase {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
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
           console.log('📅 [CrearAusenciaAlumnoUseCase] Fecha proporcionada:', dto.fecha);
           console.log('📅 [CrearAusenciaAlumnoUseCase] Fecha procesada:', fechaAusencia.toISOString());
         } else {
           fechaAusencia = new Date();
           console.log('📅 [CrearAusenciaAlumnoUseCase] Usando fecha actual:', fechaAusencia.toISOString());
         }
    
    // 3. Verificar que no exista asistencia para ese alumno en esa fecha
    // Usar la MISMA lógica que funciona en CreateAsistenciaManual
    let asistenciaExistente: any = null;
             if (dto.fecha) {
           const fechaFormato = dto.fecha; // "2025-08-22"
           console.log('🔍 [CrearAusenciaAlumnoUseCase] Validando duplicados...');
           console.log('🔍 [CrearAusenciaAlumnoUseCase] Alumno ID:', alumno.id_alumno);
           console.log('🔍 [CrearAusenciaAlumnoUseCase] Fecha formato:', fechaFormato);
           console.log('📅 [CrearAusenciaAlumnoUseCase] Fecha procesada para validación:', fechaAusencia.toISOString());
      
      // Mostrar TODOS los registros de ese alumno PRIMERO
      console.log('🔍 [CrearAusenciaAlumnoUseCase] === MOSTRANDO TODOS LOS REGISTROS DEL ALUMNO ===');
      const todasLasAsistencias = await this.asistenciaRepository
        .createQueryBuilder('asistencia')
        .leftJoinAndSelect('asistencia.alumno', 'alumno')
        .where('alumno.id_alumno = :alumnoId', { alumnoId: alumno.id_alumno })
        .getMany();
        
      console.log('🔍 [CrearAusenciaAlumnoUseCase] Total de registros del alumno:', todasLasAsistencias.length);
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
      console.log('🔍 [CrearAusenciaAlumnoUseCase] Buscando manualmente en los registros obtenidos...');
      asistenciaExistente = todasLasAsistencias.find(asist => {
        const fechaRegistro = asist.fecha.toISOString().split('T')[0];
        console.log(`🔍 [CrearAusenciaAlumnoUseCase] Comparando: "${fechaRegistro}" === "${fechaFormato}"`);
        return fechaRegistro === fechaFormato;
      });
        
      console.log('🔍 [CrearAusenciaAlumnoUseCase] Asistencia existente (búsqueda manual):', asistenciaExistente ? 'ENCONTRADA' : 'NO ENCONTRADA');
      
      if (asistenciaExistente) {
        console.log('🔍 [CrearAusenciaAlumnoUseCase] Estado existente:', asistenciaExistente.estado_asistencia);
        console.log('🔍 [CrearAusenciaAlumnoUseCase] ID existente:', asistenciaExistente.id_asistencia);
      }
    } else {
      // Si no se proporciona fecha, validar con fecha actual
      const fechaFormato = fechaAusencia.toISOString().split('T')[0];
      console.log('🔍 [CrearAusenciaAlumnoUseCase] Validando duplicados con fecha actual...');
      console.log('🔍 [CrearAusenciaAlumnoUseCase] Alumno ID:', alumno.id_alumno);
      console.log('🔍 [CrearAusenciaAlumnoUseCase] Fecha formato:', fechaFormato);
      console.log('📅 [CrearAusenciaAlumnoUseCase] Fecha procesada para validación:', fechaAusencia.toISOString());
      
      // Obtener todos los registros y buscar manualmente
      const todasLasAsistencias = await this.asistenciaRepository
        .createQueryBuilder('asistencia')
        .leftJoinAndSelect('asistencia.alumno', 'alumno')
        .where('alumno.id_alumno = :alumnoId', { alumnoId: alumno.id_alumno })
        .getMany();
        
      console.log('🔍 [CrearAusenciaAlumnoUseCase] Total de registros del alumno:', todasLasAsistencias.length);
      
      // Buscar manualmente
      asistenciaExistente = todasLasAsistencias.find(asist => {
        const fechaRegistro = asist.fecha.toISOString().split('T')[0];
        return fechaRegistro === fechaFormato;
      });
        
      console.log('🔍 [CrearAusenciaAlumnoUseCase] Asistencia existente:', asistenciaExistente ? 'ENCONTRADA' : 'NO ENCONTRADA');
      
      if (asistenciaExistente) {
        console.log('🔍 [CrearAusenciaAlumnoUseCase] Estado existente:', asistenciaExistente.estado_asistencia);
        console.log('🔍 [CrearAusenciaAlumnoUseCase] ID existente:', asistenciaExistente.id_asistencia);
      }
    }

    if (asistenciaExistente) {
      // Verificar si ya existe específicamente una AUSENCIA
      if (asistenciaExistente.estado_asistencia === EstadoAsistencia.AUSENTE) {
        console.log('❌ [CrearAusenciaAlumnoUseCase] Ya existe AUSENCIA, lanzando error');
        throw new ConflictException(
          `Ya existe un registro de AUSENCIA para el alumno ${alumno.nombre} ${alumno.apellido} en la fecha ${dto.fecha || fechaAusencia.toISOString().split('T')[0]}`
        );
      } else {
        // Si existe otro tipo de asistencia (PUNTUAL, TARDANZA), también impedir
        console.log('❌ [CrearAusenciaAlumnoUseCase] Ya existe otro tipo de asistencia, lanzando error');
        throw new ConflictException(
          `Ya existe un registro de asistencia (${asistenciaExistente.estado_asistencia}) para el alumno ${alumno.nombre} ${alumno.apellido} en la fecha ${dto.fecha || fechaAusencia.toISOString().split('T')[0]}`
        );
      }
    } else {
      console.log('✅ [CrearAusenciaAlumnoUseCase] No hay duplicados, procediendo a crear ausencia');
    }

    // 4. Crear el registro de ausencia
    const ausencia = this.asistenciaRepository.create({
      alumno: alumno,
      fecha: fechaAusencia,
      estado_asistencia: EstadoAsistencia.AUSENTE,
      hora_de_llegada: '', // Ausente no tiene hora de llegada
      hora_salida: null,   // Ausente no tiene hora de salida
    });

    const ausenciaGuardada = await this.asistenciaRepository.save(ausencia);

    // 5. Construir la respuesta
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
