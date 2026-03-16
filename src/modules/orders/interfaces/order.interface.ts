import { OrderStatus, Order } from '../entities';

export interface GetOrdersFilter {
  userId?: string;
  status?: OrderStatus;
  fromDate?: Date;
  toDate?: Date;
  limit: number;
  offset: number;
}

export interface CreateOrderResult {
  order: Order;
  isExisting: boolean;
  paymentId?: string;
}

export interface OrdersConnection {
  nodes: Order[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
