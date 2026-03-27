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
import { TagsService } from '@tags/tags.service';
import { CreateTagDto } from '@tags/dto/create-tag.dto';
import { UpdateTagDto } from '@tags/dto/update-tag.dto';
import { AssignTagsDto } from '@tags/dto/bulk-update.dto';
import { LiveScanDto } from '@tags/dto/live-scan.dto';
import { QueryTagsDto } from '@tags/dto/query-tags.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Public } from '@auth/decorators/public.decorator';
import { EventsGateway } from '../events/events.gateway';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { AuthenticatedRequest } from '@common/interfaces/request.interface';

/**
 * TagsController — Quản lý thẻ RFID / mã EPC.
 *
 * Yêu cầu đăng nhập. Ngoại trừ đọc / live scan cho thiết bị chuyên dụng (Public)
 */
@Controller('api/tags')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class TagsController {
  constructor(
    private tagsService: TagsService,
    private eventsGateway: EventsGateway,
  ) {}

  /** GET /api/tags — Danh sách thẻ có phân trang và filter */
  @Get()
  @Public()
  @ResponseMessage('Lấy danh sách thẻ thành công')
  findAll(@Query() query: QueryTagsDto) {
    return this.tagsService.findAll(query);
  }

  /** GET /api/tags/:epc — Chi tiết 1 thẻ RFID */
  @Get(':epc')
  @CheckPolicies((ability) => ability.can('read', 'Tag'))
  @ResponseMessage('Lấy chi tiết thẻ thành công')
  findByEpc(@Param('epc') epc: string) {
    return this.tagsService.findByEpc(epc);
  }

  /** GET /api/tags/:epc/history — Lịch sử sự kiện của thẻ */
  @Get(':epc/history')
  @CheckPolicies((ability) => ability.can('read', 'Tag'))
  @ResponseMessage('Lấy lịch sử thẻ thành công')
  getHistory(@Param('epc') epc: string) {
    return this.tagsService.getHistory(epc);
  }

  /** POST /api/tags — Khởi tạo danh sách thẻ trắng vào hệ thống (ADMIN) */
  @Post()
  @CheckPolicies((ability) => ability.can('create', 'Tag'))
  @ResponseMessage('Khởi tạo thẻ trắng thành công')
  async create(@Body() dto: CreateTagDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    const tag = await this.tagsService.create(dto, userId);
    this.eventsGateway.emitTagsUpdated();
    return tag;
  }

  /** PATCH /api/tags/assign — Gán hàng loạt thẻ trắng cho 1 Sản phẩm (ADMIN) */
  @Patch('assign')
  @CheckPolicies((ability) => ability.can('update', 'Tag'))
  @ResponseMessage('Gán thẻ thành công')
  async assignTags(@Body() dto: AssignTagsDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    const result = await this.tagsService.assignTags(dto, userId);
    this.eventsGateway.emitTagsUpdated();
    return result;
  }

  /** POST /api/tags/live — Nhận dữ liệu quét thẻ realtime (Public) */
  @Post('live')
  @Public()
  @ResponseMessage('Nhận diện thẻ thành công')
  liveScan(@Body() dto: LiveScanDto) {
    this.eventsGateway.emitLiveScan(dto.scans);
    return { count: dto.scans.length };
  }

  /** PATCH /api/tags/:epc — Cập nhật thông tin thẻ (ADMIN) */
  @Patch(':epc')
  @CheckPolicies((ability) => ability.can('update', 'Tag'))
  @ResponseMessage('Cập nhật thẻ thành công')
  async update(@Param('epc') epc: string, @Body() dto: UpdateTagDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    const tag = await this.tagsService.update(epc, dto, userId);
    this.eventsGateway.emitTagsUpdated();
    return tag;
  }

  /** DELETE /api/tags/:epc — Xóa mềm thẻ RFID (ADMIN) */
  @Delete(':epc')
  @CheckPolicies((ability) => ability.can('delete', 'Tag'))
  @ResponseMessage('Xóa thẻ thành công')
  async remove(@Param('epc') epc: string, @Req() req: AuthenticatedRequest) {
    const result = await this.tagsService.remove(epc, req.user?.id);
    this.eventsGateway.emitTagsUpdated();
    return result;
  }
}
