import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
  } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';

  
  
  @Entity('AUXILIAR')
  export class Auxiliar {
    @PrimaryGeneratedColumn('uuid')
    id_auxiliar: string;
  
    @OneToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_user' })
    usuario: Usuario;
  
    @Column({ type: 'char', length: 8 })
    dni_auxiliar: string;
  
    @Column({ type: 'varchar', length: 100 })
    nombre: string;
  
    @Column({ type: 'varchar', length: 100 })
    apellido: string;
  
    @Column({ type: 'date' })
    fecha_nacimiento: Date;
  
    @Column({ type: 'varchar', length: 100 })
    correo_electronico: string;
  
    @Column({ type: 'varchar', length: 15 })
    telefono: string;
  }
  