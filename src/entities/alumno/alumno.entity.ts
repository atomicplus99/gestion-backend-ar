import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToOne,
    JoinColumn,
    OneToMany,
  } from 'typeorm';
import { Turno } from '../turno/turno.entity';
import { Usuario } from '../usuario/usuario.entity';

  @Entity('ALUMNO')
  export class Alumno {
    @PrimaryGeneratedColumn('uuid')
    id_alumno: string;
  
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

    @ManyToOne(() => Turno)
    @JoinColumn({name: 'id_turno'})
    turno: Turno;

    @OneToOne(()=> Usuario)
    @JoinColumn({name: 'id_user'})
    usuario: Usuario;

  }
  