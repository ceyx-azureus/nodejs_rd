import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphqlResolver } from './resolvers';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: () => ({
        playground: true,
        typePaths: ['./src/modules/graphql/schema/**/*.graphql'],
      }),
    }),
  ],
  providers: [GraphqlResolver],
})
export class GraphqlModule {}
