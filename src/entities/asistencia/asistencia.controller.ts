import { Controller, Post, Body, Get } from '@nestjs/common';
import { RegistrarAsistenciaDesdeQRUseCase } from './cases/registrar-asistencia.usecase';
import { GetAsistenciasUseCase } from './cases/GetAsistencia.usecase';




@Controller('asistencia')
export class AsistenciaController {
  constructor(
    private readonly registrarAsistencia: RegistrarAsistenciaDesdeQRUseCase,
    private readonly listAsistencia: GetAsistenciasUseCase,
  ) {}

  @Post('scan')
  async escanearQr(@Body('codigo_qr') codigo_qr: string) {
    const asistencia = await this.registrarAsistencia.execute(codigo_qr);

    const mensaje = asistencia.hora_salida
      ? 'Salida registrada correctamente ✅'
      : 'Entrada registrada correctamente ✅';

    return {
      mensaje,
      asistencia,
    };
  }

  @Get('list')
  list() {
    return this.listAsistencia.execute();    
  }
}
