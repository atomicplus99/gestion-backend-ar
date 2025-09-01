import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuario/usuario.entity';

@Entity('ausencias_masivas_programadas')
export class AusenciasMasivasProgramadas {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  fecha_ejecucion: Date;

  @Column({ type: 'time' })
  hora_programada: string;

  @Column({ type: 'varchar', length: 100 })
  turnos_procesar: string;

  @Column({ type: 'varchar', length: 20, default: 'PROGRAMADA' })
  estado: string; // PROGRAMADA, EJECUTADA, CANCELADA

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'uuid' })
  usuario_id: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id', referencedColumnName: 'id_user' })
  usuario: Usuario;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
