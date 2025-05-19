

import { Alumno } from '../../../alumno/infraestructure/orm/entities/alumno.entity';
import { Asistencia } from '../../../asistencia/asistencia.entity';
import { Auxiliar } from '../../../auxiliar/auxiliar.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('actualizaciones_asistencia')
export class ActualizacionesAsistencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asistencia, { eager: true })
  @JoinColumn({ name: 'id_asistencia' })
  asistencia: Asistencia;

  @ManyToOne(() => Alumno, { eager: true })
  @JoinColumn({ name: 'id_alumno' })
  alumno: Alumno;

  @ManyToOne(() => Auxiliar, { eager: true })
  @JoinColumn({ name: 'id_auxiliar' })
  auxiliar: Auxiliar;

  @Column({ type: 'text' })
  motivo: string;

  @CreateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
