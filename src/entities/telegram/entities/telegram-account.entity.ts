import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Apoderado } from '../../apoderado/infraestructure/orm/entities/apoderado.entity';

@Entity('telegram_accounts')
export class TelegramAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ name: 'apoderado_id' })
  apoderadoId: string;

  @ManyToOne(() => Apoderado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'apoderado_id' })
  apoderado: Apoderado;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
