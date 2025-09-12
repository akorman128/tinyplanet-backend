import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RelationEntity } from '../entities/relation.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Relation } from '../../../../domain/relation';
import { RelationRepository } from '../../relation.repository';
import { RelationMapper } from '../mappers/relation.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class RelationRelationalRepository implements RelationRepository {
  constructor(
    @InjectRepository(RelationEntity)
    private readonly relationRepository: Repository<RelationEntity>,
  ) {}

  async create(data: Relation): Promise<Relation> {
    const persistenceModel = RelationMapper.toPersistence(data);
    const newEntity = await this.relationRepository.save(
      this.relationRepository.create(persistenceModel),
    );
    return RelationMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Relation[]> {
    const entities = await this.relationRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => RelationMapper.toDomain(entity));
  }

  async findById(id: Relation['id']): Promise<NullableType<Relation>> {
    const entity = await this.relationRepository.findOne({
      where: { id },
    });

    return entity ? RelationMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Relation['id'][]): Promise<Relation[]> {
    const entities = await this.relationRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => RelationMapper.toDomain(entity));
  }

  async update(
    id: Relation['id'],
    payload: Partial<Relation>,
  ): Promise<Relation> {
    const entity = await this.relationRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.relationRepository.save(
      this.relationRepository.create(
        RelationMapper.toPersistence({
          ...RelationMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return RelationMapper.toDomain(updatedEntity);
  }

  async remove(id: Relation['id']): Promise<void> {
    await this.relationRepository.delete(id);
  }
}
