import { Relation } from '../../../../domain/relation';
import { RelationEntity } from '../entities/relation.entity';

export class RelationMapper {
  static toDomain(raw: RelationEntity): Relation {
    const domainEntity = new Relation();
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Relation): RelationEntity {
    const persistenceEntity = new RelationEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
