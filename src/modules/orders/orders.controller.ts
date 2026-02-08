import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getAll(): Promise<Order[]> {
    return this.ordersService.getAll();
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
