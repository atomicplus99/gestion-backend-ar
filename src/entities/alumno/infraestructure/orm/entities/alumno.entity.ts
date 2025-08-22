import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToMany
} from 'typeorm';
import { Turno } from '../../../../turno/turno.entity';
import { Usuario } from '../../../../usuario/usuario.entity';
import { Apoderado } from '../../../../apoderado/infraestructure/orm/entities/apoderado.entity';

@Entity('ALUMNO')
export class Alumno {
  @PrimaryGeneratedColumn('uuid')
  id_alumno: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  codigo: string;

  @Column({ type: 'char', length: 8, default: 'xxxxxxxx' })
  dni_alumno: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellido: string;

  @Column({ type: 'date' })
  fecha_nacimiento: Date;

  @Column({ type: 'varchar', length: 100, default: 'xxxxxxxx' })
  direccion: string;

  @Column({ type: 'varchar', length: 100 })
  codigo_qr: string;

  @Column({ type: 'varchar', length: 20 })
  nivel: string;

  @Column({ type: 'int' })
  grado: number;

  @Column({ type: 'char', length: 1 })
  seccion: string;

  @ManyToOne(() => Turno, { nullable: true })
  @JoinColumn({ name: 'id_turno' })
  turno: Turno;

  @OneToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_user' })
  usuario: Usuario;

  // Relación inversa con Apoderado
  @ManyToMany(() => Apoderado, apoderado => apoderado.pupilos)
  apoderados: Apoderado[];
}
