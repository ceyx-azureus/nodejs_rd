import { Module } from '@nestjs/common';
import { Product } from '../products/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Order, OrderItem } from './entities';
import { OrdersController } from './orders.controller';
import { OrdersService } from './services/orders.service';
import { OrdersGqlService } from './services/orders-gql.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, User])],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGqlService],
  exports: [OrdersGqlService],
})
export class OrdersModule {}
