import { In } from 'typeorm';
import { dataSource } from '../config/data-source';
import { User } from '../modules/users/user.entity';
import { Product } from '../modules/products/product.entity';
import { Order, OrderStatus } from '../modules/orders/order.entity';
import { OrderItem } from '../modules/orders/order-item.entity';

const usersSeed = [
  { email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' },
  { email: 'bob@example.com', firstName: 'Bob', lastName: 'Johnson' },
];

const productNames = [
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
  'iPhone 17',
  'iPhone Air',
  'iPhone 16',
  'iPhone 16 Plus',
  'iPhone 16e',
  'iPhone 15',
  'iPhone 15 Plus',
  'iPhone 14',
  'iPhone 14 Plus',
  'iPhone 13',
  'MacBook Pro 14.2 M5 (10C CPU/10C GPU), 16 ГБ, 1 ТБ',
  'MacBook Pro 16.2 M4 Max (14C CPU/32C GPU), 36 ГБ, 1 ТБ',
  'MacBook Pro 16.2 M4 Pro (14C CPU/20C GPU), 48 ГБ, 512 ГБ',
  'MacBook Pro 16.2 M4 Pro (14C CPU/20C GPU), 24 ГБ, 512 ГБ',
  'MacBook Pro 14.2 M4 Pro (14C CPU/20C GPU), 24 ГБ, 1 ТБ',
  'MacBook Pro 14.2 M5 (10C CPU/10C GPU), 16 ГБ, 512 ГБ',
  'MacBook Pro 14.2 M4 (10C CPU/10C GPU), 16 ГБ, 1 ТБ',
  'MacBook Pro 14.2 M4 (10C CPU/10C GPU), 16 ГБ, 512 ГБ',
  'MacBook Pro 16.2 M1 Pro (10C CPU/16C GPU), 32 ГБ, 512 ГБ',
  'MacBook Pro 16.2 M4 Max (16C CPU/40C GPU), 48 ГБ, 1 ТБ',
  'MacBook Pro 14.2 M5 (10C CPU/10C GPU), 24 ГБ, 1 ТБ',
];

const productsSeed = productNames.map((name, index) => {
  const basePrice = 5 + index * 3;
  const lowStock = index % 5 === 0;
  return {
    name,
    price: parseFloat((basePrice + 0.99).toFixed(2)),
    stock: lowStock ? 2 : 20,
  };
});

const ordersSeed = [
  {
    id: crypto.randomUUID(),
    orderNumber: 'ORD-0001',
    userEmail: 'alice@example.com',
    status: OrderStatus.PENDING,
    items: [
      {
        productId: crypto.randomUUID(),
        quantity: 1,
      },
      {
        productId: crypto.randomUUID(),
        quantity: 1,
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderNumber: 'ORD-0002',
    userEmail: 'bob@example.com',
    status: OrderStatus.PAID,
    items: [
      {
        productId: crypto.randomUUID(),
        quantity: 2,
      },
      {
        productId: crypto.randomUUID(),
        quantity: 1,
      },
    ],
  },
];

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding is disabled in production');
  }

  await dataSource.initialize();

  try {
    const usersRepository = dataSource.getRepository(User);
    const productsRepository = dataSource.getRepository(Product);
    const ordersRepository = dataSource.getRepository(Order);
    const orderItemsRepository = dataSource.getRepository(OrderItem);

    await usersRepository.upsert(usersSeed, ['email']);
    await productsRepository.upsert(productsSeed, ['name']);

    const users = await usersRepository.find({
      where: { email: In(usersSeed.map((user) => user.email)) },
    });
    const usersByEmail = new Map(users.map((user) => [user.email, user]));

    // const names = productsSeed.map((product) => product.name);
    // const products = await productsRepository.find({
    //   where: { name: In(names) },
    // });
    // const productsByName = new Map(
    //   products.map((product) => [product.name, product]),
    // );

    const ordersToUpsert: Array<Partial<Order>> = [];
    const orderItemsToUpsert: Array<Partial<OrderItem>> = [];

    for (const orderSeed of ordersSeed) {
      const user = usersByEmail.get(orderSeed.userEmail);
      if (!user) {
        continue;
      }

      ordersToUpsert.push({
        id: orderSeed.id,
        orderNumber: orderSeed.orderNumber,
        userId: user.id,
        status: orderSeed.status,
      });

      for (const item of orderSeed.items) {
        orderItemsToUpsert.push({
          orderId: orderSeed.id,
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    }

    if (ordersToUpsert.length > 0) {
      await ordersRepository.upsert(ordersToUpsert, ['id']);
    }

    if (orderItemsToUpsert.length > 0) {
      await orderItemsRepository.upsert(orderItemsToUpsert, ['id']);
    }
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
