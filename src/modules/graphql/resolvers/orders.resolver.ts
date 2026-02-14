import {
  Args,
  Query,
  Resolver,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import {
  OrdersService,
  GetOrdersFilter,
  OrdersConnection,
} from '../../orders/orders.service';
import { Order, OrderStatus } from '../../orders/order.entity';
import { OrderItem } from '../../orders/order-item.entity';
import type { GraphQLContext } from '../loaders';

@Resolver('Order')
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query('orders')
  async orders(
    @Args('filter')
    filter?: { status?: OrderStatus; from?: string; to?: string },
    @Args('pagination') pagination?: { limit: number; offset: number },
  ): Promise<OrdersConnection> {
    const serviceFilter: GetOrdersFilter = {
      limit: pagination?.limit ?? 20,
      offset: pagination?.offset ?? 0,
      status: filter?.status,
      fromDate: filter?.from ? new Date(filter.from) : undefined,
      toDate: filter?.to ? new Date(filter.to) : undefined,
    };

    return this.ordersService.getAllForResolver(serviceFilter);
  }

  @ResolveField('items')
  async items(@Parent() order: Order, @Context() ctx): Promise<OrderItem[]> {
    return (ctx as GraphQLContext).loaders.orderItemsByOrderId.load(order.id);
  }
}
