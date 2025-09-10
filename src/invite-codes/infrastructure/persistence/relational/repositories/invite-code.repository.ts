import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteCodeEntity } from '../entities/invite-code.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InviteCode } from '../../../../domain/invite-code';
import { InviteCodeRepository } from '../../invite-code.repository';
import { InviteCodeMapper } from '../mappers/invite-code.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';

@Injectable()
export class InviteCodeRelationalRepository implements InviteCodeRepository {
  constructor(
    @InjectRepository(InviteCodeEntity)
    private readonly inviteCodeRepository: Repository<InviteCodeEntity>,
  ) {}

  async create(
    data: Omit<InviteCode, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<InviteCode> {
    const persistenceModel = InviteCodeMapper.toPersistence(data as InviteCode);
    const newEntity = await this.inviteCodeRepository.save(
      this.inviteCodeRepository.create(persistenceModel),
    );
    return InviteCodeMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<InviteCode[]> {
    const entities = await this.inviteCodeRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      relations: ['createdBy', 'usedBy'],
    });

    return entities.map((entity) => InviteCodeMapper.toDomain(entity));
  }

  async findById(id: InviteCode['id']): Promise<NullableType<InviteCode>> {
    const entity = await this.inviteCodeRepository.findOne({
      where: { id: Number(id) },
      relations: ['createdBy', 'usedBy'],
    });

    return entity ? InviteCodeMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<NullableType<InviteCode>> {
    const entity = await this.inviteCodeRepository.findOne({
      where: { code: code.toUpperCase() },
      relations: ['createdBy', 'usedBy'],
    });

    return entity ? InviteCodeMapper.toDomain(entity) : null;
  }

  async findByCreatedBy(userId: number): Promise<InviteCode[]> {
    const entities = await this.inviteCodeRepository.find({
      where: { createdBy: { id: userId } },
      relations: ['createdBy', 'usedBy'],
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => InviteCodeMapper.toDomain(entity));
  }

  async findActiveByCode(code: string): Promise<NullableType<InviteCode>> {
    const entity = await this.inviteCodeRepository
      .createQueryBuilder('inviteCode')
      .leftJoinAndSelect('inviteCode.createdBy', 'createdBy')
      .leftJoinAndSelect('inviteCode.usedBy', 'usedBy')
      .where('inviteCode.code = :code', { code: code.toUpperCase() })
      .andWhere('inviteCode.usedBy IS NULL')
      .andWhere('inviteCode.expiresAt > :now', { now: new Date() })
      .getOne();

    return entity ? InviteCodeMapper.toDomain(entity) : null;
  }

  async update(
    id: InviteCode['id'],
    payload: DeepPartial<InviteCode>,
  ): Promise<InviteCode | null> {
    const entity = await this.inviteCodeRepository.findOne({
      where: { id: Number(id) },
      relations: ['createdBy', 'usedBy'],
    });

    if (!entity) {
      return null;
    }

    // Update the entity with the payload
    if (payload.usedBy) {
      const usedByEntity = new UserEntity();
      usedByEntity.id = Number(payload.usedBy.id);
      entity.usedBy = usedByEntity;
    }
    if (payload.usedAt) {
      entity.usedAt = payload.usedAt as Date;
    }
    if (payload.expiresAt) {
      entity.expiresAt = payload.expiresAt as Date;
    }

    const updatedEntity = await this.inviteCodeRepository.save(entity);

    return InviteCodeMapper.toDomain(updatedEntity);
  }

  async remove(id: InviteCode['id']): Promise<void> {
    await this.inviteCodeRepository.delete(Number(id));
  }
}
