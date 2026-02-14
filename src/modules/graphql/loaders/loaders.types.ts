import { Product } from '../../products/product.entity';
import { OrderItem } from '../../orders/order-item.entity';
import DataLoader from 'dataloader';

export type Loaders = {
  productByproductId: DataLoader<string, Product>;
  orderItemsByOrderId: DataLoader<string, OrderItem[]>;
};

export type GraphQLContext = {
  loaders: Loaders;
};
