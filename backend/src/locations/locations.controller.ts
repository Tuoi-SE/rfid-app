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
import { PolicyDecorator } from '../casl/decorators/check-policies.decorator';
import { ResponseMessageDecorator } from '@common/decorators/response-message.decorator';
import { AuthenticatedRequest } from '@common/interfaces/request.interface';

@Controller('api/locations')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /** GET /api/locations — Lấy danh sách vị trí có phân trang */
  @Get()
  @PolicyDecorator.check((ability) => ability.can('read', 'Location'))
  @ResponseMessageDecorator.withMessage('Lấy danh sách vị trí thành công')
  findAll(@Query() query: QueryLocationsDto) {
    return this.locationsService.findAll(query);
  }

  /** GET /api/locations/:id — Chi tiết vị trí */
  @Get(':id')
  @PolicyDecorator.check((ability) => ability.can('read', 'Location'))
  @ResponseMessageDecorator.withMessage('Lấy chi tiết vị trí thành công')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  /** POST /api/locations — Thêm vị trí mới (ADMIN) */
  @Post()
  @PolicyDecorator.check((ability) => ability.can('create', 'Location'))
  @ResponseMessageDecorator.withMessage('Thêm vị trí thành công')
  create(@Body() dto: CreateLocationDto, @Req() req: AuthenticatedRequest) {
    return this.locationsService.create(dto, req.user?.id);
  }

  /** PATCH /api/locations/:id — Cập nhật vị trí (ADMIN) */
  @Patch(':id')
  @PolicyDecorator.check((ability) => ability.can('update', 'Location'))
  @ResponseMessageDecorator.withMessage('Cập nhật vị trí thành công')
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto, @Req() req: AuthenticatedRequest) {
    return this.locationsService.update(id, dto, req.user?.id);
  }

  /** POST /api/locations/sync-warehouses — Đồng bộ tạo Kho Xưởng cho Xưởng (ADMIN) */
  @Post('sync-warehouses')
  @PolicyDecorator.check((ability) => ability.can('update', 'Location'))
  @ResponseMessageDecorator.withMessage('Đồng bộ Kho Xưởng thành công')
  syncWarehouses(@Req() req: AuthenticatedRequest) {
    return this.locationsService.syncWarehouses(req.user?.id);
  }

  /** DELETE /api/locations/:id — Xóa mềm vị trí (ADMIN) */
  @Delete(':id')
  @PolicyDecorator.check((ability) => ability.can('delete', 'Location'))
  @ResponseMessageDecorator.withMessage('Xóa vị trí thành công')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.locationsService.remove(id, req.user?.id);
  }
}
