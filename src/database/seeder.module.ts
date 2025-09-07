import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario/usuario.entity';
import { AdministradorSeeder } from './seeds/administrador.seeder';
import { Administrador } from 'src/entities/administrador/administrador.entity';



@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Administrador])],
  providers: [SeederService, AdministradorSeeder],
  exports: [SeederService]
})
export class SeederModule {}
