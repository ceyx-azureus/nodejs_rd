import { Module } from '@nestjs/common';
import { Product } from '../products/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Order, OrderItem, ProcessedMessage } from './entities';
import { OrdersController } from './orders.controller';
import { OrdersService } from './services/orders.service';
import { OrdersGqlService } from './services/orders-gql.service';
import { OrdersConsumerService } from './services/orders-consumer.service';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, User, ProcessedMessage]),
    RabbitmqModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGqlService, OrdersConsumerService],
  exports: [OrdersGqlService],
})
export class OrdersModule {}
