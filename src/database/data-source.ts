// src/database/data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Alumno } from '../entities/alumno/infraestructure/orm/entities/alumno.entity';
import { Usuario } from '../entities/usuario/usuario.entity';
import { Turno } from '../entities/turno/turno.entity';
import { Auxiliar } from '../entities/auxiliar/auxiliar.entity';
import { Asistencia } from '../entities/asistencia/asistencia.entity';
import { EstadoAlumno } from '../entities/estado-alumnos/entities/estado-alumno.entity';
import { ActualizacionesAsistencia } from '../entities/actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { Apoderado } from '../entities/apoderado/infraestructure/orm/entities/apoderado.entity';


dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Usuario, Turno, Alumno, Auxiliar, Asistencia, EstadoAlumno, ActualizacionesAsistencia, Apoderado],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
