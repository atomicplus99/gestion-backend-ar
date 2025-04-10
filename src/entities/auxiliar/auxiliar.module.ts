import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auxiliar } from './auxiliar.entity';
import { AuxiliarService } from './auxiliar.service';

@Module({
  imports: [TypeOrmModule.forFeature([Auxiliar])],
  providers: [AuxiliarService],
  exports: [AuxiliarService], 
})
export class AuxiliarModule {}
