import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import DataLoader from 'dataloader';
import { Product } from '../../products/product.entity';
import { OrderItem } from '../../orders/order-item.entity';
import { Loaders } from './loaders.types';

@Injectable()
export class LoadersFactory {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  createLoaders(): Loaders {
    return {
      productByproductId: new DataLoader<string, Product>(async (ids) => {
        const products = await this.productRepository.find({
          where: { id: In([...ids]) },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        return ids.map(
          (id) =>
            productMap.get(id) ??
            new Error(`Product with id "${id}" not found`),
        );
      }),

      orderItemsByOrderId: new DataLoader<string, OrderItem[]>(
        async (orderIds) => {
          const items = await this.orderItemRepository.find({
            where: { orderId: In([...orderIds]) },
          });

          const itemsByOrderId = new Map<string, OrderItem[]>();

          items.forEach((item) => {
            const group = itemsByOrderId.get(item.orderId) ?? [];
            itemsByOrderId.set(item.orderId, [...group, item]);
          });

          return orderIds.map((id) => itemsByOrderId.get(id) ?? []);
        },
      ),
    };
  }
}
