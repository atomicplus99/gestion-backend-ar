import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { TurnoService } from './turno.service';
import { Turno } from './turno.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('turno')
@Controller('turno')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) {
    console.log('🎮 [TurnoController] Controlador de turnos inicializado');
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
    console.log('🚀 [TurnoController] Iniciando petición GET /turno');
    try {
      console.log('📞 [TurnoController] Llamando al servicio de turnos...');
      const turnos = await this.turnoService.findAll();
      console.log(`✅ [TurnoController] Turnos obtenidos exitosamente: ${turnos.length} turnos`);
      console.log('📊 [TurnoController] Datos de turnos:', JSON.stringify(turnos, null, 2));
      return turnos;
    } catch (error) {
      console.error('❌ [TurnoController] Error al obtener turnos:', error);
      console.error('❌ [TurnoController] Stack trace:', error.stack);
      throw new HttpException(
        'Error interno al obtener los turnos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


}
