import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn, Index } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  tel?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ default: '' })
  permissions: string;

  @Column({ name: 'created_time' })
  createdTime: Date;

  @Column({ name: 'updated_time' })
  updatedTime: Date;

  @Column({ name: 'last_login_time' })
  lastLoginTime: Date;

  @Column({ default: true })
  enabled: boolean;
}
