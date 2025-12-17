import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

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
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: !isProduction,
      logging: !isProduction,
      entities: [path.join(__dirname, '**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
    };
  }
}

export const AppDataSource: DataSource = new DataSource(
  DatabaseConfigFactory.createOptions(),
);
