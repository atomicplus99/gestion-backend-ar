import { Injectable, Inject } from '@nestjs/common';
import { APODERADO_REPOSITORY_PORT, ApoderadoRepositoryPort } from '../../outbound/ApoderadoRepository.interface';
import { Apoderado } from '../../../entities/Apoderado';

export interface GetApoderadoByDniPort {
  execute(dni: string): Promise<Apoderado | null>;
}

@Injectable()
export class GetApoderadoByDniUseCase implements GetApoderadoByDniPort {
  constructor(
    @Inject(APODERADO_REPOSITORY_PORT)
    private readonly apoderadoRepository: ApoderadoRepositoryPort,
  ) {}

  async execute(dni: string): Promise<Apoderado | null> {
    return await this.apoderadoRepository.findByDni(dni);
  }
}
