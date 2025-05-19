import { Alumno } from "src/entities/alumno/infraestructure/orm/entities/alumno.entity";

export interface AlumnoUpdateResponse{
    alumno: Alumno,
    message: string
} 