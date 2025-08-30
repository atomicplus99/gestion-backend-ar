import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';

@Entity('DIRECTOR')
export class Director {
  @PrimaryGeneratedColumn('uuid')
  id_director: string;

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion?: string;

  @OneToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_user' })
  usuario?: Usuario;
}
