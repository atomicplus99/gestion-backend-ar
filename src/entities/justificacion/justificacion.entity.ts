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
import { Auxiliar } from '../auxiliar/auxiliar.entity';

import { Administrador } from '../administrador/administrador.entity';
import { Director } from '../director/director.entity';

export enum TipoJustificacion {
  MEDICA = 'MEDICA',
  FAMILIAR = 'FAMILIAR',
  ACADEMICA = 'ACADEMICA',
  PERSONAL = 'PERSONAL',
  EMERGENCIA = 'EMERGENCIA',
}

export enum EstadoJustificacion {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  EN_REVISION = 'EN_REVISION',
}

@Entity('JUSTIFICACIONES')
export class Justificacion {
  @PrimaryGeneratedColumn('uuid')
  id_justificacion: string;

  @ManyToOne(() => Alumno, { nullable: false })
  @JoinColumn({ name: 'id_alumno' })
  alumno: Alumno;

  @ManyToOne(() => Auxiliar, { nullable: true })
  @JoinColumn({ name: 'id_auxiliar' })
  auxiliar?: Auxiliar;

  @ManyToOne(() => Administrador, { nullable: true })
  @JoinColumn({ name: 'id_administrador' })
  administrador?: Administrador;

  @ManyToOne(() => Director, { nullable: true })
  @JoinColumn({ name: 'id_director' })
  director?: Director;

  @Column({
    type: 'enum',
    enum: TipoJustificacion,
    nullable: false,
  })
  tipo_justificacion: TipoJustificacion;

  @Column({
    type: 'text',
    nullable: false,
  })
  motivo: string;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  fecha_de_justificacion: string[];

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  documentos_adjuntos: string[];

  @Column({
    type: 'enum',
    enum: EstadoJustificacion,
    default: EstadoJustificacion.PENDIENTE,
  })
  estado: EstadoJustificacion;

  @Column({
    type: 'text',
    nullable: true,
  })
  observaciones_admin?: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_creacion: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  fecha_actualizacion: Date;
}
