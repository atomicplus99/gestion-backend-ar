import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { Repository, FindOneOptions  } from 'typeorm';

@Injectable()
export class UsuarioService {

    constructor(
        @InjectRepository(Usuario)
        private readonly usersRepository: Repository<Usuario>
    ){}

    async findOneByUsername(nombre_usuario: string): Promise<Usuario | null>{
        return this.usersRepository.findOne({ where: { nombre_usuario } })
    }

    async findByIdWithRelations(id: string): Promise<Usuario | null> {
      const options: FindOneOptions<Usuario> = {
        where: { id_user: id },
        relations: ['alumno', 'auxiliar'],
      };
    
      return this.usersRepository.findOne(options);
    }
    

 

}
