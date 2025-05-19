import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auxiliar } from './auxiliar.entity';
import { AuxiliarService } from './auxiliar.service';
import { AuxiliarRepository } from './domain/repository/auxiliar.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Auxiliar])],
  providers: [AuxiliarService, AuxiliarRepository],
  exports: [AuxiliarService,AuxiliarRepository], 
})
export class AuxiliarModule {}
