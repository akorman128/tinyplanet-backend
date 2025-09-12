import { Module } from '@nestjs/common';
import { RelationRepository } from '../relation.repository';
import { RelationRelationalRepository } from './repositories/relation.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelationEntity } from './entities/relation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RelationEntity])],
  providers: [
    {
      provide: RelationRepository,
      useClass: RelationRelationalRepository,
    },
  ],
  exports: [RelationRepository],
})
export class RelationalRelationPersistenceModule {}
