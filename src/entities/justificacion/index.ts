// Entidades
export { Justificacion } from './justificacion.entity';
export { TipoJustificacion, EstadoJustificacion } from './justificacion.entity';

// DTOs
export { CreateJustificacionDto } from './dto/create-justificacion.dto';
export { JustificacionResponseDto, CreateJustificacionResponseDto } from './dto/justificacion-response.dto';
export { FiltroJustificacionesDto, ListJustificacionesQueryDto } from './dto/list-justificaciones.dto';
export { JustificacionListResponseDto, PaginacionResponseDto, JustificacionesResponseDto, AlumnoSolicitanteDto, AuxiliarEncargadoDto } from './dto/list-justificaciones-response.dto';
export { UpdateEstadoJustificacionDto } from './dto/update-estado-justificacion.dto';
export { UpdateEstadoJustificacionResponseDto } from './dto/update-estado-response.dto';

// Use Cases
export { CreateJustificacionUseCase } from './use-cases/create-justificacion.usecase';
export { ListJustificacionesUseCase } from './use-cases/list-justificaciones.usecase';
export { GetJustificacionesByAlumnoUseCase } from './use-cases/get-justificaciones-by-alumno.usecase';
export { UpdateEstadoJustificacionUseCase } from './use-cases/update-estado-justificacion.usecase';

// Servicios
export { JustificacionAsistenciaService } from './services/justificacion-asistencia.service';

// Repositorio
export { JustificacionRepository } from './justificacion.repository';

// Controlador
export { JustificacionController } from './justificacion.controller';

// Módulo
export { JustificacionModule } from './justificacion.module';
