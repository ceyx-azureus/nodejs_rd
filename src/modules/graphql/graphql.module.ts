import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  GraphqlResolver,
  OrdersResolver,
  OrderItemsResolver,
} from './resolvers';
import { OrdersModule } from '../orders/orders.module';
import { LoadersModule, LoadersFactory } from './loaders';
import { DateTimeScalar } from './scalars/date-time.scalar';

@Module({
  imports: [
    OrdersModule,
    LoadersModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [LoadersModule],
      inject: [LoadersFactory],
      useFactory: (factory: LoadersFactory) => ({
        playground: true,
        typePaths: ['./src/modules/graphql/schema/**/*.graphql'],
        context: () => ({
          loaders: factory.createLoaders(),
        }),
      }),
    }),
  ],
  providers: [GraphqlResolver, OrdersResolver, OrderItemsResolver, DateTimeScalar],
})
export class GraphqlModule {}
