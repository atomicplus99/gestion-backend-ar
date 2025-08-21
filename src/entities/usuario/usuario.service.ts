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

    /**
     * Encuentra un usuario por ID incluyendo sus relaciones con alumno y auxiliar
     * @param id ID del usuario
     * @returns Usuario con sus relaciones cargadas o null si no existe
     */
    async findByIdWithRelations(id: string): Promise<Usuario | null> {
      return this.usersRepository.findOne({
        where: { id_user: id },
        relations: {
          alumno: true,
          auxiliar: {
            usuario: true
          }
        }
      });
    }

    /**
     * Encuentra un auxiliar por ID de usuario
     * @param userId ID del usuario
     * @returns Auxiliar o null si no existe
     */
    async findAuxiliarByUserId(userId: string): Promise<any | null> {
      const usuario = await this.usersRepository.findOne({
        where: { id_user: userId },
        relations: { auxiliar: true }
      });
      return usuario?.auxiliar || null;
    }

    /**
     * Encuentra un alumno por ID de usuario
     * @param userId ID del usuario
     * @returns Alumno o null si no existe
     */
    async findAlumnoByUserId(userId: string): Promise<any | null> {
      const usuario = await this.usersRepository.findOne({
        where: { id_user: userId },
        relations: { alumno: true }
      });
      return usuario?.alumno || null;
    }
    

 

}
