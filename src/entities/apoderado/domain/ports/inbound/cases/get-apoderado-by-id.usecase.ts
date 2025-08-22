import { Injectable, Inject } from '@nestjs/common';
import { APODERADO_REPOSITORY_PORT, ApoderadoRepositoryPort } from '../../outbound/ApoderadoRepository.interface';
import { Apoderado } from '../../../entities/Apoderado';

export interface GetApoderadoByIdPort {
  execute(id: string): Promise<Apoderado | null>;
}

@Injectable()
export class GetApoderadoByIdUseCase implements GetApoderadoByIdPort {
  constructor(
    @Inject(APODERADO_REPOSITORY_PORT)
    private readonly apoderadoRepository: ApoderadoRepositoryPort,
  ) {}

  async execute(id: string): Promise<Apoderado | null> {
    return await this.apoderadoRepository.findById(id);
  }
}
