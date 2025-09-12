import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { InviteCode } from '../../domain/invite-code';
import { UpdateInviteCodeDto } from '../../dto/update-invite-code.dto';

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

  abstract findByCreatedBy(
    userId: number,
    dateRange?: { start: Date; end: Date },
  ): Promise<InviteCode[]>;

  abstract update(
    id: number,
    inviteCode: UpdateInviteCodeDto,
  ): Promise<InviteCode>;

  abstract remove(id: number): Promise<void>;
}
