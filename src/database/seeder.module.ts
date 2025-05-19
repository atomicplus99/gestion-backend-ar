import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { UserSeeder } from './seeds/user.seeder';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario/usuario.entity';
import { TurnoSeeder } from './seeds/turno.seeder';
import { Turno } from 'src/entities/turno/turno.entity';
import { AlumnoSeeder } from './seeds/alumno.seeder';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { AuxiliarSeeder } from './seeds/auxiliar.seeder';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { Asistencia } from 'src/entities/asistencia/asistencia.entity';
import { EstadoAlumno } from 'src/entities/estado-alumnos/entities/estado-alumno.entity';
import { EstadoAlumnoSeeder } from './seeds/estado-alumnos.seeder';
import { ActualizacionesAsistencia } from 'src/entities/actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Turno, Alumno, Auxiliar, Asistencia, EstadoAlumno, ActualizacionesAsistencia])],
  providers: [SeederService, UserSeeder, TurnoSeeder, AlumnoSeeder, AuxiliarSeeder, EstadoAlumnoSeeder],
  exports: [SeederService]
})
export class SeederModule {}
