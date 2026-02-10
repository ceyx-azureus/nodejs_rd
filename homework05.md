## Explain analyze before optimization:

### with 100k rows without idx_orders_user_status_created:

- execution time: 53.578 ms
- seq scan: 100,000 rows scanned
- temp storage: 416 pages read/written

## Explain analyze after optimization:

### with 100k rows with idx_orders_user_status_created:

- execution time: 0.155 ms --> ~345x faster
- seq scan: 20 rows scanned
- temp storage: 0 pages read/written

## what concurrency mechanism was chosen:

- pessimistic lock
  - easier to implement, debug
  - I don't need to add 'retry' logic
  - looks like better for e-commerce
- how idempotency works:
  - with idempotency key in the header it checks if order with this key exists
    - if order with this key exists, return existing order
    - if order with this key doesn't exist, create new order
- which request is optimized:
  - GET /orders
- how transaction is implemented:
  - httpCodes:
    - 200 if order exists (based on idempotency key)
    - 201 if order doesn't exist
    - 404 if not found
    - 409 if product amount in order is more then in stock
    - 500 if internal server error
  - transaction:
    - pessimistick lock
    - product validation
    - stock check
    - order creation
    - reducing the stock for each product
    - stock update
    - commit transaction
  - rollback if error
