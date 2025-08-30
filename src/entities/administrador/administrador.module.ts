import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Administrador } from './administrador.entity';
import { AdministradorService } from './services/administrador.service';
import { AdministradorController } from './controllers/administrador.controller';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Administrador]),
    UsuarioModule
  ],
  controllers: [AdministradorController],
  providers: [AdministradorService],
  exports: [AdministradorService]
})
export class AdministradorModule {}
