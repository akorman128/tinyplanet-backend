import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateRelationDto } from './dto/create-relation.dto';
import { UpdateRelationDto } from './dto/update-relation.dto';
import { RelationRepository } from './infrastructure/persistence/relation.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Relation } from './domain/relation';

@Injectable()
export class RelationsService {
  constructor(
    // Dependencies here
    private readonly relationRepository: RelationRepository,
  ) {}

  async create(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createRelationDto: CreateRelationDto,
  ) {
    // Do not remove comment below.
    // <creating-property />

    return this.relationRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.relationRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Relation['id']) {
    return this.relationRepository.findById(id);
  }

  findByIds(ids: Relation['id'][]) {
    return this.relationRepository.findByIds(ids);
  }

  async update(
    id: Relation['id'],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateRelationDto: UpdateRelationDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.relationRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
    });
  }

  remove(id: Relation['id']) {
    return this.relationRepository.remove(id);
  }
}
