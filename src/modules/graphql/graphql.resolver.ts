import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class GraphqlResolver {
  @Query(() => String)
  hello(): string {
    return 'Hello World!';
  }
}
