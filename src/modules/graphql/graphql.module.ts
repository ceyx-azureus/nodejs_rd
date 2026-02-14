import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphqlResolver, OrdersResolver, OrderItemsResolver } from './resolvers';
import { OrdersModule } from '../orders/orders.module';
import { OrderItem } from '../orders/order-item.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [
    OrdersModule,
    TypeOrmModule.forFeature([OrderItem, Product]),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: () => ({
        playground: true,
        typePaths: ['./src/modules/graphql/schema/**/*.graphql'],
      }),
    }),
  ],
  providers: [GraphqlResolver, OrdersResolver, OrderItemsResolver],
})
export class GraphqlModule {}
