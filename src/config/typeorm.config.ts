import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config(); 

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'colegio_db',
  autoLoadEntities: true,
  synchronize: false,
  logging: false,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  subscribers: ['dist/**/*.subscriber{.ts,.js}'],
  charset: 'utf8mb4',
  extra: {
    connectionLimit: 10,
    acquireTimeoutMillis: 60000,
    timeoutMillis: 60000,
  },
};