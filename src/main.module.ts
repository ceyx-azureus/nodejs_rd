import { Module } from "../packages/core/modules/module.decorator";
import { UserController } from "./users/user.controller";
import { ProductsController } from "./products/products.controller";

@Module({
  providers: [],
  controllers: [UserController, ProductsController],
})
export class MainModule {
  constructor() {}
}
