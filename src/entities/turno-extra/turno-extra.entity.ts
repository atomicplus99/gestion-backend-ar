import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { Usuario } from '../usuario/usuario.entity';

export enum EstadoTurnoExtra {
  ACTIVO = 'ACTIVO',
  EXPIRADO = 'EXPIRADO',
}

@Entity('TURNOS_EXTRA')
export class TurnoExtra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Alumno, { nullable: false })
  @JoinColumn({ name: 'alumno_id' })
  alumno: Alumno;

  @Column({ type: 'date' })
  fecha_turno: Date;

  @Column({ type: 'date' })
  fecha_limite: Date;

  @Column({ type: 'time' })
  hora_entrada: string;

  @Column({ type: 'time' })
  hora_salida: string;

  @Column({ type: 'time' })
  hora_limite: string;

  @Column({
    type: 'enum',
    enum: EstadoTurnoExtra,
    default: EstadoTurnoExtra.ACTIVO,
  })
  estado: EstadoTurnoExtra;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
