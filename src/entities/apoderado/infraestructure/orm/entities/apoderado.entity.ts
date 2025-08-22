import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany
} from 'typeorm';
import { TipoRelacion } from '../../../domain/enums/tipo-relacion.enum';
import { Alumno } from '../../../../alumno/infraestructure/orm/entities/alumno.entity';

@Entity('APODERADO')
export class Apoderado {
  @PrimaryGeneratedColumn('uuid')
  id_apoderado: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apellido: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'char', length: 8, nullable: true })
  dni: string | null;

  @Column({ 
    type: 'enum', 
    enum: TipoRelacion,
    default: TipoRelacion.OTRO
  })
  tipo_relacion: TipoRelacion;

  @Column({ type: 'varchar', length: 100, nullable: true })
  relacion_especifica: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @ManyToMany(() => Alumno, alumno => alumno.apoderados, { nullable: true })
  @JoinTable({
    name: 'APODERADO_ALUMNO',
    joinColumn: {
      name: 'id_apoderado',
      referencedColumnName: 'id_apoderado',
    },
    inverseJoinColumn: {
      name: 'id_alumno',
      referencedColumnName: 'id_alumno',
    },
  })
  pupilos: Alumno[];

  @Column({ type: 'json', nullable: true })
  medios_notificacion: any[] | null;
}
