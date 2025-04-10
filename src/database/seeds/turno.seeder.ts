import { Injectable } from '@nestjs/common';
import { Turno } from 'src/entities/turno/turno.entity';
import { DataSource } from 'typeorm';


@Injectable()
export class TurnoSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async run() {
    const turnoRepo = this.dataSource.getRepository(Turno);
    const count = await turnoRepo.count();

    if (count > 0) {
      console.warn('Ya existen registros en TURNOS, no se insertarán nuevos.');
      return;
    }

    const turnos: Turno[] = [
      turnoRepo.create({
        hora_inicio: '07:30',
        hora_fin: '12:44',
        hora_limite: '07:31',
        turno: 'mañana',
      }),
      turnoRepo.create({
        hora_inicio: '13:05',
        hora_fin: '18:19',
        hora_limite: '13:06',
        turno: 'tarde',
      }),
    ];

    await turnoRepo.save(turnos);
    console.log('Turnos insertados correctamente ✅');
  }
}
