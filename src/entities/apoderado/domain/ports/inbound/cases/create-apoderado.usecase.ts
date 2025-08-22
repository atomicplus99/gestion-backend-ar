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
      console.log('🔧 [CreateApoderadoUseCase] Ejecutando caso de uso con DTO:', JSON.stringify(dto, null, 2));
      
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

      console.log('🔧 [CreateApoderadoUseCase] Entidad de dominio creada:', JSON.stringify(apoderado, null, 2));

      const result = await this.apoderadoRepository.create(apoderado);
      
      console.log('✅ [CreateApoderadoUseCase] Apoderado guardado en repositorio:', result.id_apoderado);
      
      return result;
    } catch (error) {
      console.error('❌ [CreateApoderadoUseCase] Error en caso de uso:', error);
      throw error;
    }
  }
}
