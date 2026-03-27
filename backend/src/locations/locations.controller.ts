import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationsDto } from './dto/query-locations.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@Controller('api/locations')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /** GET /api/locations — Lấy danh sách vị trí có phân trang */
  @Get()
  @CheckPolicies((ability) => ability.can('read', 'Location'))
  @ResponseMessage('Lấy danh sách vị trí thành công')
  findAll(@Query() query: QueryLocationsDto) {
    return this.locationsService.findAll(query);
  }

  /** GET /api/locations/:id — Chi tiết vị trí */
  @Get(':id')
  @CheckPolicies((ability) => ability.can('read', 'Location'))
  @ResponseMessage('Lấy chi tiết vị trí thành công')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  /** POST /api/locations — Thêm vị trí mới (ADMIN) */
  @Post()
  @CheckPolicies((ability) => ability.can('create', 'Location'))
  @ResponseMessage('Thêm vị trí thành công')
  create(@Body() dto: CreateLocationDto, @Req() req: any) {
    return this.locationsService.create(dto, req.user?.id);
  }

  /** PATCH /api/locations/:id — Cập nhật vị trí (ADMIN) */
  @Patch(':id')
  @CheckPolicies((ability) => ability.can('update', 'Location'))
  @ResponseMessage('Cập nhật vị trí thành công')
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto, @Req() req: any) {
    return this.locationsService.update(id, dto, req.user?.id);
  }

  /** DELETE /api/locations/:id — Xóa mềm vị trí (ADMIN) */
  @Delete(':id')
  @CheckPolicies((ability) => ability.can('delete', 'Location'))
  @ResponseMessage('Xóa vị trí thành công')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.locationsService.remove(id, req.user?.id);
  }
}
