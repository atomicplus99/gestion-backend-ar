import { Controller, Get } from '@nestjs/common';
import { TurnoService } from './turno.service';
import { Turno } from './turno.entity';

@Controller('turno')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) {}

  @Get()
  findAll(): Promise<Turno[]> {
    return this.turnoService.findAll();
  }
}
