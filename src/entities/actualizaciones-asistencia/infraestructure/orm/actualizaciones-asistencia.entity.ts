

import { Alumno } from '../../../alumno/infraestructure/orm/entities/alumno.entity';
import { Asistencia } from '../../../asistencia/asistencia.entity';
import { Auxiliar } from '../../../auxiliar/auxiliar.entity';
import { Administrador } from '../../../administrador/administrador.entity';
import { Director } from '../../../director/director.entity';
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

  @ManyToOne(() => Auxiliar, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_auxiliar' })
  auxiliar: Auxiliar;

  @ManyToOne(() => Administrador, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_administrador' })
  administrador?: Administrador | null;

  @ManyToOne(() => Director, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_director' })
  director?: Director | null;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  accion_realizada: string;

  @CreateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
