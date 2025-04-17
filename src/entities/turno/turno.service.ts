import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno } from './turno.entity';

@Injectable()
export class TurnoService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,
  ) {}

  async findAll(): Promise<Turno[]> {
    return this.turnoRepo.find();
  }
}
