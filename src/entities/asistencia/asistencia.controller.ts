import { Controller, Post, Body } from '@nestjs/common';
import { RegistrarAsistenciaDesdeQRUseCase } from './cases/registrar-asistencia.usecase';




@Controller('asistencia')
export class AsistenciaController {
  constructor(
    private readonly registrarAsistencia: RegistrarAsistenciaDesdeQRUseCase,
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
}
