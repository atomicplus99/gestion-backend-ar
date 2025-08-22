import { Injectable, Inject } from '@nestjs/common';
import { APODERADO_REPOSITORY_PORT, ApoderadoRepositoryPort } from '../../outbound/ApoderadoRepository.interface';
import { Apoderado } from '../../../entities/Apoderado';

export interface GetApoderadosPort {
  execute(): Promise<Apoderado[]>;
}

@Injectable()
export class GetApoderadosUseCase implements GetApoderadosPort {
  constructor(
    @Inject(APODERADO_REPOSITORY_PORT)
    private readonly apoderadoRepository: ApoderadoRepositoryPort,
  ) {}

  async execute(): Promise<Apoderado[]> {
    return await this.apoderadoRepository.findAll();
  }
}
