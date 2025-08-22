import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from '../usuario.entity';


@Injectable()
export class UsuarioTypeOrmRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repositoryUsuario: Repository<Usuario>
  ) {}

  save(usuario: Usuario): Promise<Usuario> {
    return this.repositoryUsuario.save(usuario);
  }

  findById(id_user:string): Promise<Usuario | null>{
    return this.repositoryUsuario.findOne({ where: { id_user } });
  }

  findByUsername(nombre_usuario: string): Promise<Usuario | null> {
    return this.repositoryUsuario.findOne({ where: { nombre_usuario } });
  }

}
