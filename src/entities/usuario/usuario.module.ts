import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsuarioService } from './services/usuario.service';
import { UsuarioFotoService } from './services/usuario-foto.service';
import { UsuarioController } from './controllers/usuario.controller';
import { Usuario } from './usuario.entity';
import { EmailModule } from '../../common/modules/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    ConfigModule,
    EmailModule,
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService, UsuarioFotoService],
  exports: [UsuarioService, UsuarioFotoService],
})
export class UsuarioModule {}