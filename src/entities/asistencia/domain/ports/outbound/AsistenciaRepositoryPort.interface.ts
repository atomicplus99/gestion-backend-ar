import { Asistencia } from "src/entities/asistencia/asistencia.entity";

export interface AsistenciaRepositoryPort {
    findAll(): Promise<Asistencia[]>;
}

export const ASISTENCIA_REPOSITORY = 'ASISTENCIA_REPOSITORY';
