import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteCodesService } from './invite-codes.service';
import { InviteCodesController } from './invite-codes.controller';
import { InviteCodeEntity } from './infrastructure/persistence/relational/entities/invite-code.entity';
import { InviteCodeRepository } from './infrastructure/persistence/invite-code.repository';
import { InviteCodeRelationalRepository } from './infrastructure/persistence/relational/repositories/invite-code.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InviteCodeEntity])],
  controllers: [InviteCodesController],
  providers: [
    InviteCodesService,
    {
      provide: InviteCodeRepository,
      useClass: InviteCodeRelationalRepository,
    },
  ],
  exports: [InviteCodesService, InviteCodeRepository],
})
export class InviteCodesModule {}
