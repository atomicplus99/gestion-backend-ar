import { Injectable, Inject } from '@nestjs/common';
import { APODERADO_REPOSITORY_PORT, ApoderadoRepositoryPort, AssignStudentsResult } from '../../outbound/ApoderadoRepository.interface';
import { AssignStudentsRequestDto } from '../../../dtos/AssignStudentsRequest.dto';

export interface AssignStudentsPort {
  execute(apoderadoId: string, dto: AssignStudentsRequestDto): Promise<AssignStudentsResult>;
}

@Injectable()
export class AssignStudentsUseCase implements AssignStudentsPort {
  constructor(
    @Inject(APODERADO_REPOSITORY_PORT)
    private readonly apoderadoRepository: ApoderadoRepositoryPort,
  ) {}

  async execute(apoderadoId: string, dto: AssignStudentsRequestDto): Promise<AssignStudentsResult> {
    return await this.apoderadoRepository.assignStudents(apoderadoId, dto.estudiante_ids);
  }
}
