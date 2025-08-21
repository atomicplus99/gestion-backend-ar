import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AuxiliarRepository } from './domain/repository/auxiliar.repository';
import { Auxiliar } from './auxiliar.entity';

@Controller('auxiliar')
export class AuxiliarController {
  constructor(
    private readonly auxiliarRepository: AuxiliarRepository,
  ) {}

  /**
   * Obtiene la información de un auxiliar basado en el ID del usuario
   * @param idUser ID del usuario asociado al auxiliar
   * @returns Información completa del auxiliar con relaciones cargadas
   */
  @Get('auxiliar-user/:idUser')
  async findByUserId(@Param('idUser') idUser: string): Promise<Auxiliar> {
    const auxiliar = await this.auxiliarRepository.findByUsuarioId(idUser);
    
    if (!auxiliar) {
      throw new NotFoundException(`No se encontró auxiliar con usuario ID: ${idUser}`);
    }
    
    return auxiliar;
  }
}
