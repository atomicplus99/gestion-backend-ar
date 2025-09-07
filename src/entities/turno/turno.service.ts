import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno } from './turno.entity';

@Injectable()
export class TurnoService {
  private readonly logger = new Logger(TurnoService.name);

  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,
  ) {
  }

  async findAll(): Promise<Turno[]> {
    try {
      
      const turnos = await this.turnoRepo.find();
      
      
      if (turnos.length > 0) {
      } else {
      }
      
      return turnos;
    } catch (error) {
      throw error;
    }
  }
}
