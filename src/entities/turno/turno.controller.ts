import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { TurnoService } from './turno.service';
import { Turno } from './turno.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('turno')
@Controller('turno')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) {
  }

  /**
   * Obtiene todos los turnos disponibles
   * @returns Lista de turnos
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los turnos disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de turnos obtenida exitosamente', type: [Turno] })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findAll(): Promise<Turno[]> {
    try {
      const turnos = await this.turnoService.findAll();
      return turnos;
    } catch (error) {
      throw new HttpException(
        'Error interno al obtener los turnos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


}
