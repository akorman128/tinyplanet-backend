import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'invite_code',
})
export class InviteCodeEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: String, unique: true })
  code: string;

  @Index()
  @Column({ type: Number, name: 'created_by_id' })
  createdById: number;

  @Index()
  @Column({ type: Number, name: 'used_by_id', nullable: true })
  usedById?: number | null;

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date | null;

  @Index()
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
