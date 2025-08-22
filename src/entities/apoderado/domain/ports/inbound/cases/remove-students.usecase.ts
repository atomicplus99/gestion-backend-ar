import { Injectable, Inject } from '@nestjs/common';
import { APODERADO_REPOSITORY_PORT, ApoderadoRepositoryPort } from '../../outbound/ApoderadoRepository.interface';
import { AssignStudentsRequestDto } from '../../../dtos/AssignStudentsRequest.dto';

export interface RemoveStudentsPort {
  execute(apoderadoId: string, dto: AssignStudentsRequestDto): Promise<boolean>;
}

@Injectable()
export class RemoveStudentsUseCase implements RemoveStudentsPort {
  constructor(
    @Inject(APODERADO_REPOSITORY_PORT)
    private readonly apoderadoRepository: ApoderadoRepositoryPort,
  ) {}

  async execute(apoderadoId: string, dto: AssignStudentsRequestDto): Promise<boolean> {
    return await this.apoderadoRepository.removeStudents(apoderadoId, dto.estudiante_ids);
  }
}
