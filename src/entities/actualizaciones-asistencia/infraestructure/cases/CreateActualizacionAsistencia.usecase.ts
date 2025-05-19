import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActualizacionAsistenciaDto } from '../../domain/dto/ActualizacionAsistencia.dto';
import { ActualizacionesAsistencia } from '../orm/actualizaciones-asistencia.entity';
import { ActualizacionAsistenciaMapper } from '../mappers/ActualizacionAsistencia.mapper';



export class CreateActualizacionAsistenciaCase {
  constructor(
    @InjectRepository(ActualizacionesAsistencia)
    private readonly actualizacionRepo: Repository<ActualizacionesAsistencia>,
  ) {}

  async execute(dto: CreateActualizacionAsistenciaDto): Promise<ActualizacionesAsistencia> {
    const nuevaActualizacion = ActualizacionAsistenciaMapper.toEntity(dto);
    return await this.actualizacionRepo.save(nuevaActualizacion);
  }
}
