import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auxiliar } from './auxiliar.entity';
import { AuxiliarService } from './auxiliar.service';
import { AuxiliarRepository } from './domain/repository/auxiliar.repository';
import { AuxiliarController } from './auxiliar.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Auxiliar])],
  providers: [AuxiliarService, AuxiliarRepository],
  controllers: [AuxiliarController],
  exports: [AuxiliarService, AuxiliarRepository], 
})
export class AuxiliarModule {}
