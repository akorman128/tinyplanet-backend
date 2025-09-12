import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RelationsService } from './relations.service';
import { CreateRelationDto } from './dto/create-relation.dto';
import { UpdateRelationDto } from './dto/update-relation.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Relation } from './domain/relation';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllRelationsDto } from './dto/find-all-relations.dto';

@ApiTags('Relations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'relations',
  version: '1',
})
export class RelationsController {
  constructor(private readonly relationsService: RelationsService) {}

  @Post()
  @ApiCreatedResponse({
    type: Relation,
  })
  create(@Body() createRelationDto: CreateRelationDto) {
    return this.relationsService.create(createRelationDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(Relation),
  })
  async findAll(
    @Query() query: FindAllRelationsDto,
  ): Promise<InfinityPaginationResponseDto<Relation>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.relationsService.findAllWithPagination({
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: Relation,
  })
  findById(@Param('id') id: string) {
    return this.relationsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: Relation,
  })
  update(
    @Param('id') id: string,
    @Body() updateRelationDto: UpdateRelationDto,
  ) {
    return this.relationsService.update(id, updateRelationDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.relationsService.remove(id);
  }
}
