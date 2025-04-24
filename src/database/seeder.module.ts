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


@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Turno, Alumno, Auxiliar, Asistencia])],
  providers: [SeederService, UserSeeder, TurnoSeeder, AlumnoSeeder, AuxiliarSeeder],
  exports: [SeederService]
})
export class SeederModule {}
