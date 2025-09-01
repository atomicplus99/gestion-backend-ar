import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';

export enum TipoNotificacion {
  SCHEDULER = 'scheduler',
  JUSTIFICACION = 'justificacion',
  USUARIO = 'usuario',
  ASISTENCIA = 'asistencia',
  ALUMNO = 'alumno'
}

export enum PrioridadNotificacion {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica'
}

export enum EstadoNotificacion {
  NO_LEIDA = 'no_leida',
  LEIDA = 'leida',
  ARCHIVADA = 'archivada'
}

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TipoNotificacion,
    default: TipoNotificacion.SCHEDULER
  })
  tipo: TipoNotificacion;

  @Column({
    type: 'enum',
    enum: PrioridadNotificacion,
    default: PrioridadNotificacion.MEDIA
  })
  prioridad: PrioridadNotificacion;

  @Column({
    type: 'enum',
    enum: EstadoNotificacion,
    default: EstadoNotificacion.NO_LEIDA
  })
  estado: EstadoNotificacion;

  @Column({ length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ length: 50, nullable: true })
  icono: string;

  @Column({ type: 'json', nullable: true })
  detalles: any;

  @Column({ name: 'fecha_creacion', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @Column({ name: 'fecha_lectura', type: 'timestamp', nullable: true })
  fecha_lectura: Date;

  @Column({ name: 'fecha_archivado', type: 'timestamp', nullable: true })
  fecha_archivado: Date;

  // Relación con Usuario (opcional - para notificaciones específicas de usuario)
  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuario_id: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  // Campos para auditoría
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
