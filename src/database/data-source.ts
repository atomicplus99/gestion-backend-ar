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
import { Justificacion } from '../entities/justificacion/justificacion.entity';
import { AusenciasMasivasLog } from '../entities/asistencia/entities/ausencias-masivas-log.entity';
import { TelegramUser } from '../entities/telegram/telegram-user.entity';
import { TelegramChat } from '../entities/telegram/telegram-chat.entity';
import { Administrador } from '../entities/administrador/administrador.entity';
import { Director } from '../entities/director/director.entity';
import { Notificacion } from '../entities/notificacion/notificacion.entity';
import { AusenciasMasivasProgramadas } from '../entities/asistencia/entities/ausencias-masivas-programadas.entity';
import { TurnoExtra } from '../entities/turno-extra/turno-extra.entity';
import { AsistenciaExtra } from '../entities/asistencia-extra/asistencia-extra.entity';


dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Usuario, Turno, Alumno, Auxiliar, Asistencia, EstadoAlumno, ActualizacionesAsistencia, Apoderado, Justificacion, AusenciasMasivasLog, TelegramUser, TelegramChat, Administrador, Director, Notificacion, AusenciasMasivasProgramadas, TurnoExtra, AsistenciaExtra],
  migrations: ['dist/database/migrations/*.ts'],
  synchronize: false,
});
