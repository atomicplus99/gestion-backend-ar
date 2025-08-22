import { Apoderado } from '../../entities/Apoderado';

export const APODERADO_REPOSITORY_PORT = 'APODERADO_REPOSITORY_PORT';

export interface AssignStudentsResult {
  success: boolean;
  error?: string;
  alumnosConApoderado?: string[];
}

export interface ApoderadoRepositoryPort {
  create(apoderado: Apoderado): Promise<Apoderado>;
  findAll(): Promise<Apoderado[]>;
  findById(id: string): Promise<Apoderado | null>;
  findByDni(dni: string): Promise<Apoderado | null>;
  update(id: string, apoderado: Partial<Apoderado>): Promise<Apoderado | null>;
  delete(id: string): Promise<boolean>;
  findByIdWithPupilos(id: string): Promise<Apoderado | null>;
  assignStudents(apoderadoId: string, studentIds: string[]): Promise<AssignStudentsResult>;
  removeStudents(apoderadoId: string, studentIds: string[]): Promise<boolean>;
  findByFilters(filters: {
    dni?: string;
    nombre?: string;
    tipo_relacion?: string;
    activo?: boolean;
  }): Promise<Apoderado[]>;
}
