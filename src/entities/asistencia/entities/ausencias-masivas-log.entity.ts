import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ausencias_masivas_log')
export class AusenciasMasivasLog {
  @PrimaryGeneratedColumn('uuid')
  id_log: string;

  @Column({ type: 'date' })
  fecha_ejecucion: Date;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time', nullable: true })
  hora_programada: string;

  @Column({ type: 'time', nullable: true })
  hora_fin: string;

  @Column({ type: 'int' })
  total_alumnos: number;

  @Column({ type: 'int' })
  ausencias_creadas: number;

  @Column({ type: 'int' })
  alumnos_con_asistencia: number;

  @Column({ type: 'varchar', length: 100 })
  turnos_procesados: string;

  @Column({ type: 'varchar', length: 20, default: 'COMPLETADO' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'int', nullable: true })
  duracion_segundos: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
