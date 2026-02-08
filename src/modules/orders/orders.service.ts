import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  constructor() {}

  getOrders(): Promise<unknown[]> {
    return Promise.resolve([]);
  }
}
