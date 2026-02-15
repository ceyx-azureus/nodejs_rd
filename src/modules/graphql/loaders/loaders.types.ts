import DataLoader from 'dataloader';
import { Product } from '../../products/product.entity';
import { OrderItem } from '../../orders/entities';

export type Loaders = {
  productByproductId: DataLoader<string, Product>;
  orderItemsByOrderId: DataLoader<string, OrderItem[]>;
};

export type GraphQLContext = {
  loaders: Loaders;
};
