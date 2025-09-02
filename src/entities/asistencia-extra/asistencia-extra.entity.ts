import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { EstadoAsistenciaExtra } from './enums/estado-asistencia-extra.enum';

@Entity('ASISTENCIA_EXTRA')
export class AsistenciaExtra {
  @PrimaryGeneratedColumn('uuid')
  id_asistencia_extra: string;

  @ManyToOne(() => Alumno, { nullable: false })
  @JoinColumn({ name: 'id_alumno' })
  alumno: Alumno;

  @Column({ type: 'time', nullable: true })
  hora_de_llegada: string;

  @Column({ type: 'time', nullable: true })
  hora_salida: string | null;

  @Column({
    type: 'enum',
    enum: EstadoAsistenciaExtra,
    default: EstadoAsistenciaExtra.PUNTUAL_EXTRA,
  })
  estado_asistencia: EstadoAsistenciaExtra;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
