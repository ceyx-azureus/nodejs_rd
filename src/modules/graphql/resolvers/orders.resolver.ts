import {
  Args,
  Query,
  Resolver,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { GetOrdersFilter, OrdersConnection } from '../../orders/interfaces';
import { OrdersGqlService } from '../../orders/services';
import { Order, OrderStatus, OrderItem } from '../../orders/entities';
import type { GraphQLContext } from '../loaders';

@Resolver('Order')
export class OrdersResolver {
  constructor(private readonly ordersGqlService: OrdersGqlService) {}

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

    return this.ordersGqlService.getAll(serviceFilter);
  }

  @ResolveField('createdAt')
  createdAt(@Parent() order: Order): string {
    return new Date(order.createdAt).toISOString();
  }

  @ResolveField('updatedAt')
  updatedAt(@Parent() order: Order): string {
    return new Date(order.updatedAt).toISOString();
  }

  @ResolveField('items')
  async items(@Parent() order: Order, @Context() ctx): Promise<OrderItem[]> {
    return (ctx as GraphQLContext).loaders.orderItemsByOrderId.load(order.id);
  }
}
