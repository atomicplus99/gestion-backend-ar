import { Injectable, Inject } from '@nestjs/common';
import { APODERADO_REPOSITORY_PORT, ApoderadoRepositoryPort } from '../../outbound/ApoderadoRepository.interface';

export interface DeleteApoderadoPort {
  execute(id: string): Promise<boolean>;
}

@Injectable()
export class DeleteApoderadoUseCase implements DeleteApoderadoPort {
  constructor(
    @Inject(APODERADO_REPOSITORY_PORT)
    private readonly apoderadoRepository: ApoderadoRepositoryPort,
  ) {}

  async execute(id: string): Promise<boolean> {
    return await this.apoderadoRepository.delete(id);
  }
}
