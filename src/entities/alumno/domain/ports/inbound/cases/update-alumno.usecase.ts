import { Injectable } from '@nestjs/common';

import { AlumnoTypeOrmRepository } from 'src/entities/alumno/infraestructure/adapters/outbounds/repository/alumno.repository';
import { UpdateAlumnoDto } from '../../../dtos/UpdateAlumno.dto';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { AlumnoUpdateResponseDto } from '../../../dtos/response/SuccessResponse.dto';

@Injectable()
export class ActualizarAlumnoCase {
  constructor(
    private readonly alumnoRepository: AlumnoTypeOrmRepository
  ) {}

  async execute(codigo: string, updateData: UpdateAlumnoDto): Promise<AlumnoUpdateResponseDto> {
    const alumnoActualizado = await this.alumnoRepository.updateAlumno(codigo, updateData);
    
    return {
      success: true,
      message: "Alumno actualizado exitosamente",
      alumno: alumnoActualizado,
      timestamp: new Date().toISOString()
    };
  }
}