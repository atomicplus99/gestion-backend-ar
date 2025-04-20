import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Turno } from '../turno.entity';


@Injectable()
export class TurnoTypeOrmRepository {
  constructor(
    @InjectRepository(Turno)
    private readonly repositoryTurno: Repository<Turno>
  ) {}

  save(turno: Turno): Promise<Turno> {
    return this.repositoryTurno.save(turno);
  }

  findOne(id_turno: string): Promise<Turno | null> {
    return this.repositoryTurno.findOne({ where: { id_turno }});
  }

}
