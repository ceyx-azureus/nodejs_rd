import { Module } from "../packages/core/modules/module.decorator";
import { UserController } from "./users/user.controller";
import { ProductsController } from "./products/products.controller";
import { UsersService } from "./users/users.service";

@Module({
  providers: [UsersService],
  controllers: [UserController, ProductsController],
})
export class MainModule {
  constructor() {}
}
