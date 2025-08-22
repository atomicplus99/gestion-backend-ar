import { Injectable, Inject } from '@nestjs/common';
import { APODERADO_REPOSITORY_PORT, ApoderadoRepositoryPort } from '../../outbound/ApoderadoRepository.interface';
import { Apoderado } from '../../../entities/Apoderado';
import { UpdateApoderadoDto } from '../../../dtos/UpdateApoderado.dto';

export interface UpdateApoderadoPort {
  execute(id: string, dto: UpdateApoderadoDto): Promise<Apoderado | null>;
}

@Injectable()
export class UpdateApoderadoUseCase implements UpdateApoderadoPort {
  constructor(
    @Inject(APODERADO_REPOSITORY_PORT)
    private readonly apoderadoRepository: ApoderadoRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateApoderadoDto): Promise<Apoderado | null> {
    const updateData = {
      ...dto,
      fecha_actualizacion: new Date(),
    };

    return await this.apoderadoRepository.update(id, updateData);
  }
}
