import { Alumno } from "src/entities/alumno/infraestructure/orm/entities/alumno.entity";
import { UpdateAlumnoDto } from "../../../dtos/UpdateAlumno.dto";


export interface AlumnoRepositoryInterface {
    save(alumno: Alumno): Promise<Alumno>;
    findByCodigoPersonal(codigo: string): Promise<Partial<Alumno> | null>;
    findByCodigo(codigo: string): Promise<Alumno | null>;
    findByCodigoQR(codigo_qr: string): Promise<Alumno | null>;
    findAll(): Promise<Alumno[]>;
    updateAlumno(code: string, updateData: UpdateAlumnoDto): Promise<Alumno>;
  }