import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuarioModule } from './entities/usuario/usuario.module';
import { AlumnoModule } from './entities/alumno/alumno.module';
import { TurnoService } from './entities/turno/turno.service';
import { TurnoController } from './entities/turno/turno.controller';
import { TurnoModule } from './entities/turno/turno.module';
import { AsistenciaModule } from './entities/asistencia/asistencia.module';
import * as dotenv from 'dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { SeederModule } from './database/seeder.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { EstadoAlumnoModule } from './entities/estado-alumnos/estado-alumno.module';
import { ActualizacionesAsistenciaModule } from './entities/actualizaciones-asistencia/actualizaciones-asistencia.module';
import { AuxiliarModule } from './entities/auxiliar/auxiliar.module';
import { ApoderadoModule } from './entities/apoderado/apoderado.module';
import { JustificacionModule } from './entities/justificacion/justificacion.module';
import { TelegramModule } from './entities/telegram/telegram.module';
import { AdministradorModule } from './entities/administrador/administrador.module';
import { DirectorModule } from './entities/director/director.module';
import { NotificacionModule } from './entities/notificacion/notificacion.module';




dotenv.config();


@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public/profiles'),
      serveRoot: '/profiles',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot(),
    AuthModule,
    UsuarioModule,
    AlumnoModule,
    AuxiliarModule,
    TurnoModule, 
    AsistenciaModule,
    SeederModule,
    EstadoAlumnoModule,
    ActualizacionesAsistenciaModule,
    ApoderadoModule,
    JustificacionModule,
    TelegramModule,
    AdministradorModule,
    DirectorModule,
    NotificacionModule
  ],
  controllers: [AppController], 
  providers: [AppService],       
})
export class AppModule {}
