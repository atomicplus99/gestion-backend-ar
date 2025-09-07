import { Injectable, Inject } from '@nestjs/common';
import { APODERADO_REPOSITORY_PORT, ApoderadoRepositoryPort } from '../../outbound/ApoderadoRepository.interface';
import { Apoderado } from '../../../entities/Apoderado';
import { CreateApoderadoDto } from '../../../dtos/CreateApoderado.dto';

export interface CreateApoderadoPort {
  execute(dto: CreateApoderadoDto): Promise<Apoderado>;
}

@Injectable()
export class CreateApoderadoUseCase implements CreateApoderadoPort {
  constructor(
    @Inject(APODERADO_REPOSITORY_PORT)
    private readonly apoderadoRepository: ApoderadoRepositoryPort,
  ) {}

  async execute(dto: CreateApoderadoDto): Promise<Apoderado> {
    try {
      
      const apoderado = new Apoderado(
        undefined, // id se generará automáticamente
        dto.nombre,
        dto.tipo_relacion,
        dto.apellido,
        dto.telefono,
        dto.email,
        dto.dni,
        dto.relacion_especifica,
        dto.activo ?? true,
        new Date(),
        new Date(),
        dto.pupilos,
        undefined
      );


      const result = await this.apoderadoRepository.create(apoderado);
      
      
      return result;
    } catch (error) {
      throw error;
    }
  }
}
