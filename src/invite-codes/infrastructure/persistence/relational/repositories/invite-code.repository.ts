import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { InviteCodeEntity } from '../entities/invite-code.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InviteCode } from '../../../../domain/invite-code';
import { InviteCodeRepository } from '../../invite-code.repository';
import { InviteCodeMapper } from '../mappers/invite-code.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { UpdateInviteCodeDto } from '../../../../dto/update-invite-code.dto';

@Injectable()
export class InviteCodeRelationalRepository implements InviteCodeRepository {
  constructor(
    @InjectRepository(InviteCodeEntity)
    private readonly inviteCodeRepository: Repository<InviteCodeEntity>,
  ) {}

  async create(data: Partial<InviteCode>): Promise<InviteCode> {
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
    });

    return entities.map((entity) => InviteCodeMapper.toDomain(entity));
  }

  async findById(id: InviteCode['id']): Promise<NullableType<InviteCode>> {
    const entity = await this.inviteCodeRepository.findOne({
      where: { id: Number(id) },
    });

    return entity ? InviteCodeMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<NullableType<InviteCode>> {
    const entity = await this.inviteCodeRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    return entity ? InviteCodeMapper.toDomain(entity) : null;
  }

  async findByCreatedBy(
    userId: number,
    dateRange?: { start: Date; end: Date },
  ): Promise<InviteCode[]> {
    const entities = await this.inviteCodeRepository.find({
      where: { createdById: userId },
      order: { createdAt: 'DESC' },
      ...(dateRange && {
        where: {
          createdById: userId,
          createdAt: Between(dateRange.start, dateRange.end),
        },
      }),
    });

    return entities.map((entity) => InviteCodeMapper.toDomain(entity));
  }

  async update(
    id: number,
    inviteCode: UpdateInviteCodeDto,
  ): Promise<InviteCode> {
    const inviteCodeEntity = await this.inviteCodeRepository.findOneOrFail({
      where: { id: id },
    });

    const updatedInviteCodeEntity = await this.inviteCodeRepository.save(
      Object.assign(inviteCodeEntity, inviteCode),
    );
    return InviteCodeMapper.toDomain(updatedInviteCodeEntity);
  }

  async remove(id: number): Promise<void> {
    await this.inviteCodeRepository.delete(id);
  }
}
