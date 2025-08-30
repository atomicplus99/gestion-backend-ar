import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { EstadoAsistencia } from './enums/estado-asistencia.enum';

@Entity('ASISTENCIA')
export class Asistencia {
  @PrimaryGeneratedColumn('uuid')
  id_asistencia: string;

  @Column({ type: 'time', nullable: true })
  hora_de_llegada: string | null;

  @Column({ type: 'time', nullable: true })
  hora_salida: string | null;

  @Column({
    type: 'enum',
    enum: EstadoAsistencia,
  })
  estado_asistencia: EstadoAsistencia;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha: Date;

  @ManyToOne(() => Alumno, { nullable: false })
  @JoinColumn({ name: 'id_alumno' })
  alumno: Alumno;
}
