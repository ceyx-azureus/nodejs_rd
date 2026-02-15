import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  BadRequestException,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './services/orders.service';
import { Order, OrderStatus } from './entities';
import { CreateOrderDto } from './dto/create-order.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getAll(
    @Query('userId') userId?: string,
    @Query('status') status?: OrderStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<Order[]> {
    const parsedLimit = Number(limit ?? 20);
    const parsedOffset = Number(offset ?? 0);
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;
    const safeOffset =
      Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    if (fromDate && Number.isNaN(fromDate.getTime())) {
      throw new BadRequestException('from must be valid date');
    }

    if (toDate && Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('to must be valid date');
    }
    return this.ordersService.getAll({
      userId,
      status,
      fromDate,
      toDate,
      limit: safeLimit,
      offset: safeOffset,
    });
  }

  @Post()
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
