import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../../orders/order-item.entity';
import { Product } from '../../products/product.entity';

@Resolver('OrderItem')
export class OrderItemsResolver {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  @ResolveField('product')
  async product(@Parent() orderItem: OrderItem): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id: orderItem.productId },
    });
  }
}
