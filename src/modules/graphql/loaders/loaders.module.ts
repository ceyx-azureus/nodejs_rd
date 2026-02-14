import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../products/product.entity';
import { OrderItem } from '../../orders/order-item.entity';
import { Order } from '../../orders/order.entity';
import { LoadersFactory } from './loaders.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order, OrderItem])],
  providers: [LoadersFactory],
  exports: [LoadersFactory],
})
export class LoadersModule {}
