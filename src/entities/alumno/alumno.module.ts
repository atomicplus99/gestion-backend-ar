import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alumno } from './alumno.entity';
import { AlumnoService } from './alumno.service';
import { Turno } from '../turno/turno.entity';
import { Usuario } from '../usuario/usuario.entity';
import { AlumnoController } from './alumno.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Alumno, Turno, Usuario])],
  controllers: [AlumnoController],
  providers: [AlumnoService],
  exports: [AlumnoService], 
})
export class AlumnoModule {}
