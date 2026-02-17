import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProductService } from './products.service';
import { Product } from './product.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScopesGuard } from '../auth/guards/scopes.guard';
import { RequireScopes } from '../auth/decorators/scopes.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @RequireScopes('product:read')
  getAll(): Promise<Product[]> {
    return this.productService.getAll();
  }
}
