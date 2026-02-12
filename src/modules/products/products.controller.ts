import { Controller, Get } from '@nestjs/common';
import { ProductService } from './products.service';
import { Product } from './product.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  getAll(): Promise<Product[]> {
    return this.productService.getAll();
  }
}
