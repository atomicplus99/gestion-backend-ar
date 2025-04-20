import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from '../usuario.entity';


@Injectable()
export class UsuarioTypeOrmRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repositoryTurno: Repository<Usuario>
  ) {}

  save(usuario: Usuario): Promise<Usuario> {
    return this.repositoryTurno.save(usuario);
  }

  findById(id_user:string): Promise<Usuario | null>{
    return this.repositoryTurno.findOne({ where: { id_user } });
  }

}
