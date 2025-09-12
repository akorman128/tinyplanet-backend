import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Relation } from '../../domain/relation';

export abstract class RelationRepository {
  abstract create(
    data: Omit<Relation, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Relation>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Relation[]>;

  abstract findById(id: Relation['id']): Promise<NullableType<Relation>>;

  abstract findByIds(ids: Relation['id'][]): Promise<Relation[]>;

  abstract update(
    id: Relation['id'],
    payload: DeepPartial<Relation>,
  ): Promise<Relation | null>;

  abstract remove(id: Relation['id']): Promise<void>;
}
