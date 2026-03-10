import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  BadRequestException,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './services/orders.service';
import { Order } from './entities';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScopesGuard } from '../auth/guards/scopes.guard';
import { RequireScopes } from '../auth/decorators/scopes.decorator';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('orders')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequireScopes('order:read')
  getAll(@Query() query: GetOrdersQueryDto): Promise<Order[]> {
    return this.ordersService.getAll({
      userId: query.userId,
      status: query.status,
      fromDate: query.from ? new Date(query.from) : undefined,
      toDate: query.to ? new Date(query.to) : undefined,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });
  }

  @Post()
  @RequireScopes('order:create')
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @Res() res: Response,
  ): Promise<Response<Order>> {
    if (!idempotencyKey || !UUID_REGEX.test(idempotencyKey)) {
      throw new BadRequestException(
        'Invalid or missing idempotency-key header.',
      );
    }

    const result = await this.ordersService.createOrder(dto, idempotencyKey);

    const statusCode = result.isExisting ? 200 : 201;
    return res.status(statusCode).json(result.order);
  }
}
