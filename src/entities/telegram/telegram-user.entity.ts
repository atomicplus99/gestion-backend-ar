import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TelegramChat } from './telegram-chat.entity';

@Entity('telegram_users')
export class TelegramUser {
  @PrimaryGeneratedColumn('uuid')
  id_telegram_user: string;

  @Column({ type: 'bigint', unique: true })
  telegram_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVO' })
  estado: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'varchar', length: 50, default: 'APODERADO' })
  tipo_usuario: string;

  @CreateDateColumn()
  fecha_registro: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @OneToMany(() => TelegramChat, chat => chat.usuario)
  chats: TelegramChat[];
}
