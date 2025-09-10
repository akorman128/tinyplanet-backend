import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { InviteCode } from '../../../../domain/invite-code';
import { InviteCodeEntity } from '../entities/invite-code.entity';

export class InviteCodeMapper {
  static toDomain(raw: InviteCodeEntity): InviteCode {
    const domainEntity = new InviteCode();
    domainEntity.id = raw.id;
    domainEntity.code = raw.code;
    domainEntity.createdBy = UserMapper.toDomain(raw.createdBy);
    if (raw.usedBy) {
      domainEntity.usedBy = UserMapper.toDomain(raw.usedBy);
    }
    domainEntity.usedAt = raw.usedAt;
    domainEntity.expiresAt = raw.expiresAt;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: InviteCode): InviteCodeEntity {
    let createdBy: UserEntity | undefined = undefined;

    if (domainEntity.createdBy) {
      createdBy = new UserEntity();
      createdBy.id = Number(domainEntity.createdBy.id);
    }

    let usedBy: UserEntity | undefined | null = undefined;

    if (domainEntity.usedBy) {
      usedBy = new UserEntity();
      usedBy.id = Number(domainEntity.usedBy.id);
    } else if (domainEntity.usedBy === null) {
      usedBy = null;
    }

    const persistenceEntity = new InviteCodeEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.code = domainEntity.code;
    persistenceEntity.createdBy = createdBy!;
    persistenceEntity.usedBy = usedBy;
    persistenceEntity.usedAt = domainEntity.usedAt;
    persistenceEntity.expiresAt = domainEntity.expiresAt;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
