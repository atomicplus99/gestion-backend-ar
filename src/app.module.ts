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
import { join } from 'path';



dotenv.config();


@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UsuarioModule,
    AlumnoModule,
    TurnoModule, 
    AsistenciaModule,
    SeederModule,
  ],
  controllers: [AppController], 
  providers: [AppService],       
})
export class AppModule {}
