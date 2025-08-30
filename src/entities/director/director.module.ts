import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Director } from './director.entity';
import { DirectorService } from './services/director.service';
import { DirectorController } from './controllers/director.controller';
import { UsuarioModule } from '../usuario/usuario.module';
import { Administrador } from '../administrador/administrador.entity';
import { Auxiliar } from '../auxiliar/auxiliar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Director, Administrador, Auxiliar]),
    UsuarioModule
  ],
  controllers: [DirectorController],
  providers: [DirectorService],
  exports: [DirectorService]
})
export class DirectorModule {}
