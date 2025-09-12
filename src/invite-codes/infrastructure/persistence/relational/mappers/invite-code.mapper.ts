import { InviteCode } from '../../../../domain/invite-code';
import { InviteCodeEntity } from '../entities/invite-code.entity';

export class InviteCodeMapper {
  static toDomain(raw: InviteCodeEntity): InviteCode {
    const domainEntity = new InviteCode();
    domainEntity.id = raw.id;
    domainEntity.code = raw.code;
    domainEntity.createdById = raw.createdById;
    domainEntity.usedById = raw.usedById;
    domainEntity.usedAt = raw.usedAt;
    domainEntity.expiresAt = raw.expiresAt;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: InviteCode): InviteCodeEntity {
    const persistenceEntity = new InviteCodeEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.code = domainEntity.code;
    persistenceEntity.createdById = Number(domainEntity.createdById);
    persistenceEntity.usedById = domainEntity.usedById
      ? Number(domainEntity.usedById)
      : null;
    persistenceEntity.usedAt = domainEntity.usedAt;
    persistenceEntity.expiresAt = domainEntity.expiresAt;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
