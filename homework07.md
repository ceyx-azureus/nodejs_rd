# Homework 07

## 1.1

### code-first підхід -> чому обрав

- ~~мені так більше подобається
- менше дублювання коду
- не треба окремо писати схему
- сам собі голова на цій задачі
- type-safety
- знання TS
- малий "проект" - дз~~
- беручи до уваги що наступні задачі мають бути schema-first та роут має бути один то я переробив в schema-first щоб не заводити кілька модулів і роутів (а роут все одно має бути один)

## 2.1

## 3.2

### pagination with args vs connection

завів окремий метод в orders.service без leftjoin, щоб не ламати існуючу вже логіку

- пагінація проста, але невідомо яка загальна кількість рекордів
- коннекшн
  - має інфу про кількість,
  - чи є ще сторінки до/після
  - це те що graphQL підтримує та рекомендує

## 4.1

### з проблемою N+1 -> query

```
query {
  orders(filter:{status: PAID}, pagination: {limit: 5, offset: 0}) {
    totalCount,
    nodes{
      id,
      createdAt, items{product{name}}
    }
  }
}
```

### з проблемою N+1 -> SQL LOGS

----------- витягнути ордери з status = PAID

```
query: SELECT "order"."id" AS "order_id", "order"."order_number" AS "order_order_number", "order"."user_id" AS "order_user_id", "order"."status" AS "order_status", "order"."idempotency_key" AS "order_idempotency_key", "order"."created_at" AS "order_created_at", "order"."updated_at" AS "order_updated_at" FROM "orders" "order" WHERE "order"."status" = $1 ORDER BY "order"."created_at" DESC LIMIT 5 OFFSET 0 -- PARAMETERS: ["PAID"]
```

----------- count

```
query: SELECT COUNT(1) AS "cnt" FROM "orders" "order" WHERE "order"."status" = $1 -- PARAMETERS: ["PAID"]
```

----------- окремий виклик на кожен ордер айтем

```
query: SELECT "OrderItem"."id" AS "OrderItem_id", "OrderItem"."order_id" AS "OrderItem_order_id", "OrderItem"."product_id" AS "OrderItem_product_id", "OrderItem"."quantity" AS "OrderItem_quantity", "OrderItem"."price" AS "OrderItem_price", "OrderItem"."created_at" AS "OrderItem_created_at", "OrderItem"."updated_at" AS "OrderItem_updated_at" FROM "order_items" "OrderItem" WHERE (("OrderItem"."order_id" = $1)) -- PARAMETERS: ["1441b608-ccc3-4c59-a419-01778d75c43d"]
query: SELECT "OrderItem"."id" AS "OrderItem_id", "OrderItem"."order_id" AS "OrderItem_order_id", "OrderItem"."product_id" AS "OrderItem_product_id", "OrderItem"."quantity" AS "OrderItem_quantity", "OrderItem"."price" AS "OrderItem_price", "OrderItem"."created_at" AS "OrderItem_created_at", "OrderItem"."updated_at" AS "OrderItem_updated_at" FROM "order_items" "OrderItem" WHERE (("OrderItem"."order_id" = $1)) -- PARAMETERS: ["5ad3aff9-030d-48f2-a426-09057ceee681"]
query: SELECT "OrderItem"."id" AS "OrderItem_id", "OrderItem"."order_id" AS "OrderItem_order_id", "OrderItem"."product_id" AS "OrderItem_product_id", "OrderItem"."quantity" AS "OrderItem_quantity", "OrderItem"."price" AS "OrderItem_price", "OrderItem"."created_at" AS "OrderItem_created_at", "OrderItem"."updated_at" AS "OrderItem_updated_at" FROM "order_items" "OrderItem" WHERE (("OrderItem"."order_id" = $1)) -- PARAMETERS: ["f8fea307-956a-4877-a4ed-029db82c4f2d"]
query: SELECT "OrderItem"."id" AS "OrderItem_id", "OrderItem"."order_id" AS "OrderItem_order_id", "OrderItem"."product_id" AS "OrderItem_product_id", "OrderItem"."quantity" AS "OrderItem_quantity", "OrderItem"."price" AS "OrderItem_price", "OrderItem"."created_at" AS "OrderItem_created_at", "OrderItem"."updated_at" AS "OrderItem_updated_at" FROM "order_items" "OrderItem" WHERE (("OrderItem"."order_id" = $1)) -- PARAMETERS: ["0b79bbad-de50-41df-a8b2-cd143eefec59"]
query: SELECT "OrderItem"."id" AS "OrderItem_id", "OrderItem"."order_id" AS "OrderItem_order_id", "OrderItem"."product_id" AS "OrderItem_product_id", "OrderItem"."quantity" AS "OrderItem_quantity", "OrderItem"."price" AS "OrderItem_price", "OrderItem"."created_at" AS "OrderItem_created_at", "OrderItem"."updated_at" AS "OrderItem_updated_at" FROM "order_items" "OrderItem" WHERE (("OrderItem"."order_id" = $1)) -- PARAMETERS: ["5bdfef3f-0442-4a4e-8aa0-6f6424e0d623"]
```

## 4.2 data loader

## 4.3

### query для перевірки

```
query {
  orders(filter:{status: PAID}, pagination: {limit: 5, offset: 10}) {
    totalCount,
    nodes{
      id,
      createdAt, items{product{name}}
    }
  }
}
```

### sql logs -> without N+1

```
query: SELECT "order"."id" AS "order_id", "order"."order_number" AS "order_order_number", "order"."user_id" AS "order_user_id", "order"."status" AS "order_status", "order"."idempotency_key" AS "order_idempotency_key", "order"."created_at" AS "order_created_at", "order"."updated_at" AS "order_updated_at" FROM "orders" "order" WHERE "order"."status" = $1 ORDER BY "order"."created_at" DESC LIMIT 5 OFFSET 10 -- PARAMETERS: ["PAID"]
----------
query: SELECT COUNT(1) AS "cnt" FROM "orders" "order" WHERE "order"."status" = $1 -- PARAMETERS: ["PAID"]
----------
query: SELECT "OrderItem"."id" AS "OrderItem_id", "OrderItem"."order_id" AS "OrderItem_order_id", "OrderItem"."product_id" AS "OrderItem_product_id", "OrderItem"."quantity" AS "OrderItem_quantity", "OrderItem"."price" AS "OrderItem_price", "OrderItem"."created_at" AS "OrderItem_created_at", "OrderItem"."updated_at" AS "OrderItem_updated_at" FROM "order_items" "OrderItem" WHERE (("OrderItem"."order_id" IN ($1, $2, $3, $4, $5))) -- PARAMETERS: ["c526a5f8-602f-4fe9-a185-4d23c3b754ea","609de063-7cd3-4fe0-b413-118c95c112e4","92896af1-709e-4eb9-8cd6-756dda58b3ed","3ec14478-5399-418a-8835-b318da475a82","c316527d-6e0b-428e-b5b0-dec1b2e4c1d8"]
----------
Successfully compiled src/modules/orders/orders.service.ts with swc (28.5ms)
```

## BONUS

- OrdersConnection -> DONE
- keyset -------
- max limit 50 -> DONE
- OrderItemsLoader -> DONE
