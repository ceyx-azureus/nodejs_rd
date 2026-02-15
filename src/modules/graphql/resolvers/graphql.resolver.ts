import { Query, Resolver } from '@nestjs/graphql';

@Resolver('Query')
export class GraphqlResolver {
  @Query()
  hello(): string {
    return 'Hello World!';
  }
}
