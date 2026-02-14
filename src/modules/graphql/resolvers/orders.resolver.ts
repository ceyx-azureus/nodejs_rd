import { Args, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService, GetOrdersFilter } from '../../orders/orders.service';
import { Order, OrderStatus } from '../../orders/order.entity';
import { OrderItem } from '../../orders/order-item.entity';

@Resolver('Order')
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  @Query('orders')
  async orders(
    @Args('filter')
    filter?: { status?: OrderStatus; from?: string; to?: string },
    @Args('pagination') pagination?: { limit: number; offset: number },
  ) {
    const limit = pagination?.limit ?? 20;
    const offset = pagination?.offset ?? 0;

    const serviceFilter: GetOrdersFilter = {
      limit,
      offset,
    };

    if (filter?.status) {
      serviceFilter.status = filter.status;
    }

    if (filter?.from) {
      serviceFilter.fromDate = new Date(filter.from);
    }

    if (filter?.to) {
      serviceFilter.toDate = new Date(filter.to);
    }

    const [nodes, totalCount] =
      await this.ordersService.getAllForResolver(serviceFilter);

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasNextPage: offset + limit < totalCount,
        hasPreviousPage: offset > 0,
      },
    };
  }

  @ResolveField('items')
  async items(@Parent() order: Order): Promise<OrderItem[]> {
    return this.orderItemRepository.find({ where: { orderId: order.id } });
  }
}
