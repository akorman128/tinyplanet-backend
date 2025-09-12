import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { RelationsService } from './relations.service';
import { RelationsController } from './relations.controller';
import { RelationalRelationPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalRelationPersistenceModule,
  ],
  controllers: [RelationsController],
  providers: [RelationsService],
  exports: [RelationsService, RelationalRelationPersistenceModule],
})
export class RelationsModule {}
