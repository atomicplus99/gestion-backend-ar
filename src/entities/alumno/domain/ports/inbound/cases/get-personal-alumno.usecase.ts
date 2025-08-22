// src/application/use-cases/get-alumno-by-codigo.usecase.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Alumno } from '../../../../infraestructure/orm/entities/alumno.entity';
import { AlumnoTypeOrmRepository } from '../../../../infraestructure/adapters/outbounds/repository/alumno.repository';
import { EstadoAlumno } from 'src/entities/estado-alumnos/entities/estado-alumno.entity';
import { AlumnoSearchResponseDto } from 'src/entities/alumno/domain/dtos/response/AlumnoSearchResponse.dto';

@Injectable()
export class GetAlumnoByCodigoUseCase {
  private readonly logger = new Logger(GetAlumnoByCodigoUseCase.name);

  constructor(
    private readonly alumnoTypeOrmRepository: AlumnoTypeOrmRepository,
    private readonly dataSource: DataSource
  ) {}

  async execute(codigo: string): Promise<AlumnoSearchResponseDto> {
    this.logger.log(`🚀 [UseCase] Iniciando ejecución para código: ${codigo}`);
    
    try {
      this.logger.log(`📞 [UseCase] Llamando al repositorio para buscar alumno`);
      const alumno = await this.alumnoTypeOrmRepository.findByCodigoAlumno(codigo);
      
      this.logger.log(`📊 [UseCase] Resultado del repositorio: ${alumno ? 'Encontrado' : 'No encontrado'}`);
      
      if (!alumno) {
        this.logger.warn(`⚠️ [UseCase] No se encontró alumno con código: ${codigo}`);
        throw new NotFoundException(`No se encontró ningún alumno con el código ${codigo}`);
      }
      
      this.logger.log(`✅ [UseCase] Alumno encontrado exitosamente, buscando estado actual`);
      
      // Buscar el estado actual del alumno
      const estadoRepo = this.dataSource.getRepository(EstadoAlumno);
      const ultimoEstado = await estadoRepo.findOne({
        where: { id_alumno: alumno.id_alumno },
        order: { fecha_actualizacion: 'DESC' },
      });

      if (ultimoEstado) {
        this.logger.log(`📊 [UseCase] Estado encontrado: ${ultimoEstado.estado}`);
      } else {
        this.logger.log(`ℹ️ [UseCase] No se encontró estado para el alumno, será opcional`);
      }
      
      // Construir la respuesta con el estado incluido
      const respuesta: AlumnoSearchResponseDto = {
        id_alumno: alumno.id_alumno,
        codigo: alumno.codigo,
        dni_alumno: alumno.dni_alumno,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        fecha_nacimiento: alumno.fecha_nacimiento,
        direccion: alumno.direccion,
        codigo_qr: alumno.codigo_qr,
        nivel: alumno.nivel,
        grado: alumno.grado,
        seccion: alumno.seccion,
        turno: alumno.turno ? {
          id_turno: alumno.turno.id_turno,
          hora_inicio: alumno.turno.hora_inicio,
          hora_fin: alumno.turno.hora_fin,
          hora_limite: alumno.turno.hora_limite,
          turno: alumno.turno.turno,
        } : null,
        usuario: alumno.usuario ? {
          id_user: alumno.usuario.id_user,
          nombre_usuario: alumno.usuario.nombre_usuario,
          password_user: alumno.usuario.password_user,
          rol_usuario: alumno.usuario.rol_usuario,
          profile_image: alumno.usuario.profile_image,
        } : null,
        estado_actual: ultimoEstado ? {
          estado: ultimoEstado.estado,
          observacion: ultimoEstado.observacion,
          fecha_actualizacion: ultimoEstado.fecha_actualizacion,
        } : undefined,
      };
      
      this.logger.log(`✅ [UseCase] Respuesta construida exitosamente con estado incluido`);
      this.logger.log(`   - ID: ${respuesta.id_alumno}`);
      this.logger.log(`   - Código: ${respuesta.codigo}`);
      this.logger.log(`   - Nombre: ${respuesta.nombre} ${respuesta.apellido}`);
      this.logger.log(`   - Turno: ${respuesta.turno ? `ID: ${respuesta.turno.id_turno}` : 'No asignado'}`);
      this.logger.log(`   - Usuario: ${respuesta.usuario ? `ID: ${respuesta.usuario.id_user}` : 'No asignado'}`);
      this.logger.log(`   - Estado: ${respuesta.estado_actual ? respuesta.estado_actual.estado : 'No asignado'}`);
      
      return respuesta;
    } catch (error) {
      this.logger.error(`❌ [UseCase] Error en ejecución: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error; // Re-lanzar NotFoundException sin modificar
      }
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }
}
