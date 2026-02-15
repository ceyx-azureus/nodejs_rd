import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';
import { OrderItem } from '../../orders/entities';
import { Product } from '../../products/product.entity';
import type { GraphQLContext } from '../loaders';

@Resolver('OrderItem')
export class OrderItemsResolver {
  @ResolveField('product')
  async product(
    @Parent() orderItem: OrderItem,
    @Context() ctx,
  ): Promise<Product> {
    return (ctx as GraphQLContext).loaders.productByproductId.load(
      orderItem.productId,
    );
  }
}
