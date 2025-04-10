import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';


@Entity('TURNOS')
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id_turno: string;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @Column({ type: 'time' })
  hora_limite: string;

  @Column({ type: 'varchar', length: 20 })
  turno: string;


}
