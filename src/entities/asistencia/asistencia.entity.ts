// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
// import { Alumno } from '../alumno/alumno.entity';

// @Entity('ASISTENCIA')
// export class Asistencia {
//   @PrimaryGeneratedColumn('uuid')
//   id_asistencia: string;

//   @ManyToOne(() => Alumno, (alumno) => alumno.asistencias, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'id_alumno' })
//   alumno: Alumno;

//   @Column({ type: 'time', nullable: true })
//   hora_llegada: string;

//   @Column({ type: 'time', nullable: true })
//   hora_salida: string;

//   @Column({ type: 'date' })
//   fecha: Date;

//   @Column({ type: 'varchar', length: 15 })
//   estado_asistencia: string;
// }
