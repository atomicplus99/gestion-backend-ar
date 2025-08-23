import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TelegramUser } from './telegram-user.entity';

@Entity('telegram_chats')
export class TelegramChat {
  @PrimaryGeneratedColumn('uuid')
  id_chat: string;

  @Column({ type: 'bigint', unique: true })
  chat_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  chat_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  chat_title: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVO' })
  estado: string;

  @CreateDateColumn()
  fecha_registro: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @ManyToOne(() => TelegramUser, usuario => usuario.chats)
  @JoinColumn({ name: 'id_telegram_user' })
  usuario: TelegramUser;

  @Column({ type: 'uuid' })
  id_telegram_user: string;
}
