import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AlumnoTypeOrmRepository } from '../../../../infraestructure/adapters/outbounds/repository/alumno.repository';
import { TurnoTypeOrmRepository } from 'src/entities/turno/repository/turno.repository';
import { UsuarioTypeOrmRepository } from 'src/entities/usuario/repository/usuario.repository';
import { AlumnoMapper } from '../../../../infraestructure/mappers/alumno.mapper';
import { UsuarioMapper } from 'src/entities/usuario/usuario.mapper';

import { CreateAlumnoDto } from 'src/auth/dto/users/create-alumno.dto';
import { RegisterAlumnoDto } from 'src/auth/dto/alumno/registers/alumno-create.dto';

@Injectable()
export class CreateAlumnoUseCase {
  constructor(
    private readonly alumnoRepo:  AlumnoTypeOrmRepository,
    private readonly turnoRepo:   TurnoTypeOrmRepository,
    private readonly usuarioRepo: UsuarioTypeOrmRepository,
  ) {}

  async execute(dto: RegisterAlumnoDto) {
   
    //Valida si en caso existe un codigo duplicado
    if (await this.alumnoRepo.findByCodigoAlumno(dto.codigo)) {
      throw new BadRequestException(`Código '${dto.codigo}' ya registrado.`);
    }
    
    //Valida si en caso el turno seleccionado existe
    const turno = await this.turnoRepo.findOne(dto.turno_id)
    if(!turno){
        throw new NotFoundException('Turno no encontrado');
    }

    const userEntity = UsuarioMapper.fromAlumnoDto(dto);
    const user  = await this.usuarioRepo.save(userEntity);

    const alumnoEntity = AlumnoMapper.toEntity(dto, turno, user);
    return this.alumnoRepo.save(alumnoEntity);
  }
}
