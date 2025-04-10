import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auxiliar } from './auxiliar.entity';

@Injectable()
export class AuxiliarService {
  constructor(
    @InjectRepository(Auxiliar)
    private readonly auxiliarRepo: Repository<Auxiliar>,
  ) {}

  async findByUsuarioId(id: string): Promise<Auxiliar | null> {
    return this.auxiliarRepo.findOne({
      where: {
        usuario: { id_user: id },
      },
      relations: ['usuario'],
    });
  }
}
