import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';

/**
 * Configuración maestra de la Base de Datos.
 * Aquí definimos las reglas de conexión y sincronización del datasource.
 * * @note synchronize: FALSE en producción siempre.
 * @note migrations: Apuntar a DIST en producción.
 */

class DatabaseConfigFactory {
  static createOptions(): DataSourceOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: false,
      logging: false,
      entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
    };
  }
}

export const AppDataSource: DataSource = new DataSource(
  DatabaseConfigFactory.createOptions(),
);
