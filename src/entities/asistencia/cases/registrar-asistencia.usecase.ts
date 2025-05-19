import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ValidarAlumnoUseCase } from 'src/entities/alumno/domain/ports/inbound/cases/validate-alumno-qr.usecases';
import { Asistencia } from '../asistencia.entity';
import { AsistenciaTypeOrmRepository } from '../domain/repository/asistencia.repository';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';

@Injectable()
export class RegistrarAsistenciaDesdeQRUseCase {
  constructor(
    private readonly validarAlumno: ValidarAlumnoUseCase,
    private readonly asistenciaRepo: AsistenciaTypeOrmRepository,
  ) {}

  async execute(codigo_qr: string): Promise<Asistencia> {
    const alumno = await this.validarAlumno.execute(codigo_qr);
    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }

    
    const ahora = new Date();
    ahora.setHours(13, 5, 0); 

    const fechaActual = new Date(ahora.toDateString()); 
    const horaActual = ahora.toTimeString().split(' ')[0]; 

    const asistencia = await this.asistenciaRepo.findByAlumnoAndDate(alumno.id_alumno, fechaActual);

    
    if (!asistencia) {
      const horaLimite = alumno.turno?.hora_limite;
      const estado =
        horaLimite && horaActual > horaLimite
          ? EstadoAsistencia.TARDANZA
          : EstadoAsistencia.PUNTUAL;

      const nuevaAsistencia = this.asistenciaRepo.create({
        alumno,
        hora_de_llegada: horaActual,
        hora_salida: null,
        estado_asistencia: estado,
        fecha: fechaActual,
      });

      return this.asistenciaRepo.save(nuevaAsistencia);
    }

    // 2️⃣ Ya tiene entrada pero no salida → validar si puede registrar salida
    if (!asistencia.hora_salida) {
      const horaFin = alumno.turno?.hora_fin;
      if (!horaFin) throw new BadRequestException('El turno no tiene hora de fin definida');

      if (horaActual < horaFin) {
        throw new BadRequestException(`La salida solo puede registrarse después de las ${horaFin}`);
      }

      asistencia.hora_salida = horaActual;
      return this.asistenciaRepo.save(asistencia);
    }

    // 3️⃣ Ya tiene entrada y salida → rechazar
    throw new BadRequestException('Ya se registró la entrada y salida de hoy');
  }
}
