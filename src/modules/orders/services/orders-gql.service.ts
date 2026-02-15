import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities';
import { Repository } from 'typeorm';
import { GetOrdersFilter } from '../interfaces';
import { OrdersConnection } from '../interfaces';

@Injectable()
export class OrdersGqlService {
  private readonly logger = new Logger(OrdersGqlService.name);

  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
  ) {}

  async getAll(filter: GetOrdersFilter): Promise<OrdersConnection> {
    this.validateFilter(filter);

    try {
      const qb = this.repository.createQueryBuilder('order');

      if (filter.userId) {
        qb.andWhere('order.userId = :userId', { userId: filter.userId });
      }

      if (filter.status) {
        qb.andWhere('order.status = :status', { status: filter.status });
      }

      if (filter.fromDate) {
        qb.andWhere('order.createdAt >= :fromDate', {
          fromDate: filter.fromDate,
        });
      }

      if (filter.toDate) {
        qb.andWhere('order.createdAt <= :toDate', { toDate: filter.toDate });
      }

      const [nodes, totalCount] = await qb
        .orderBy('order.createdAt', 'DESC')
        .limit(filter.limit)
        .offset(filter.offset)
        .getManyAndCount();

      const hasNextPage = filter.offset + filter.limit < totalCount;
      const hasPreviousPage = !!filter.offset;
      return {
        nodes,
        totalCount,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to fetch orders', error);
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  private validateFilter(filter: GetOrdersFilter): void {
    if (filter.limit < 1 || filter.limit > 50) {
      throw new BadRequestException(
        'pagination.limit must be between 1 and 50',
      );
    }

    if (filter.offset < 0) {
      throw new BadRequestException('pagination.offset must be >= 0');
    }
  }
}
