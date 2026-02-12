import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';

interface CreateOrderResult {
  order: Order;
  isExisting: boolean;
}

interface GetOrdersFilter {
  userId?: string;
  status?: OrderStatus;
  fromDate?: Date;
  toDate?: Date;
  limit: number;
  offset: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async getAll(filter: GetOrdersFilter): Promise<Order[]> {
    const qb = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems');

    if (filter.userId) {
      qb.andWhere('order.userId = :userId', { userId: filter.userId });
    }

    if (filter.status) {
      qb.andWhere('order.status = :status', { status: filter.status });
    }

    if (filter.fromDate) {
      qb.andWhere('order.createdAt >= :fromDate', { fromDate: filter.fromDate });
    }

    if (filter.toDate) {
      qb.andWhere('order.createdAt <= :toDate', { toDate: filter.toDate });
    }

    return qb
      .orderBy('order.createdAt', 'DESC')
      .limit(filter.limit)
      .offset(filter.offset)
      .getMany();
  }

  async createOrder(
    dto: CreateOrderDto,
    idempotencyKey: string,
  ): Promise<CreateOrderResult> {
    const existingOrder = await this.repository.findOne({
      where: { idempotencyKey, userId: dto.userId },
      relations: ['orderItems'],
    });

    if (existingOrder) {
      return { order: existingOrder, isExisting: true };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productIds = dto.items.map((item) => item.productId);

      const products = await this.lockProducts(queryRunner, productIds);

      if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p.id);
        const missingIds = productIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Products not found: ${missingIds.join(', ')}`,
        );
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
          );
        }
      }

      const orderNumber = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const order = queryRunner.manager.getRepository(Order).create({
        orderNumber,
        userId: dto.userId,
        idempotencyKey,
      });

      const savedOrder = await queryRunner.manager
        .getRepository(Order)
        .save(order);

      const orderItems: OrderItem[] = [];
      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;

        await queryRunner.manager
          .getRepository(Product)
          .update(
            { id: item.productId },
            { stock: product.stock - item.quantity },
          );

        const orderItem = queryRunner.manager.getRepository(OrderItem).create({
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        });

        orderItems.push(
          await queryRunner.manager.getRepository(OrderItem).save(orderItem),
        );
      }

      await queryRunner.commitTransaction();

      savedOrder.orderItems = orderItems;
      return { order: savedOrder, isExisting: false };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the order',
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async lockProducts(queryRunner: QueryRunner, productIds: string[]) {
    return queryRunner.manager
      .getRepository(Product)
      .createQueryBuilder('product')
      .setLock('pessimistic_write')
      .where('product.id IN (:...productIds)', { productIds })
      .getMany();
  }
}
