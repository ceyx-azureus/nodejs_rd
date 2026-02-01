import { Controller, Get } from "../../packages/core/http";

@Controller("/products")
export class ProductsController {
  @Get()
  findAll() {
    return [1, 2, 3, 4];
  }

  @Get(":id")
  findById(req: any) {
    console.log("id", req.params.id);
    return `product id: ${req.params.id}`;
  }
}
