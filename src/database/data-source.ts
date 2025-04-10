// src/database/data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Alumno } from '../entities/alumno/alumno.entity';
import { Usuario } from '../entities/usuario/usuario.entity';
import { Turno } from '../entities/turno/turno.entity';
import { Auxiliar } from '../entities/auxiliar/auxiliar.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Usuario, Turno, Alumno, Auxiliar],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
