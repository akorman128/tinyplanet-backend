import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { InviteCode } from '../../domain/invite-code';

export abstract class InviteCodeRepository {
  abstract create(
    data: Omit<InviteCode, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<InviteCode>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<InviteCode[]>;

  abstract findById(id: InviteCode['id']): Promise<NullableType<InviteCode>>;

  abstract findByCode(code: string): Promise<NullableType<InviteCode>>;

  abstract findByCreatedBy(userId: number): Promise<InviteCode[]>;

  abstract findActiveByCode(code: string): Promise<NullableType<InviteCode>>;

  abstract update(
    id: InviteCode['id'],
    payload: DeepPartial<InviteCode>,
  ): Promise<InviteCode | null>;

  abstract remove(id: InviteCode['id']): Promise<void>;
}
