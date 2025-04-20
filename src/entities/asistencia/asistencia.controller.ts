import { Controller, Post, Body } from '@nestjs/common';
import { RegistrarAsistenciaUseCase } from './cases/registrar-asistencia.usecase';


@Controller('asistencia')
export class AsistenciaController {
  constructor(
    private readonly registrarAsistencia: RegistrarAsistenciaUseCase,
  ) {}

  @Post('registrar')
  async registrar(@Body() body: { codigo_qr:string }) {
    const alumno = await this.registrarAsistencia.execute(body.codigo_qr);
    return {
      mensaje: 'Alumno válido',
      alumno,
    };
  }
}
