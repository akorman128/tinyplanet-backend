// src/relationships/relationship.entity.ts
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum RelationshipType {
  PendingFirstSecond = 'pending_first_second',
  PendingSecondFirst = 'pending_second_first',
  Friends = 'friends',
  BlockFirstSecond = 'block_first_second',
  BlockSecondFirst = 'block_second_first',
  BlockBoth = 'block_both',
}

@Entity({ name: 'user_relationships' })
@Check(`"user_first_id" < "user_second_id"`)
export class Relationship {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn('bigint', { name: 'user_first_id' })
  userFirstId: number;

  @PrimaryColumn('bigint', { name: 'user_second_id' })
  userSecondId: number;

  @Column({ type: 'enum', enum: RelationshipType })
  type: RelationshipType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
