## Explain analyze before optimization:

### with 100k rows:

- execution time: 53.578 ms
- seq scan: 100,000 rows scanned
- temp storage: 416 pages read/written

## Explain analyze after optimization:

### with 100k rows:

-

## what concurrency mechanism was chosen:

- pessimistic lock
  - easier to implement, debug
  - I don't need to add 'retry' logic
  - looks like better for e-commerce
- how idempotency works:
  - tbd
- which request is optimized:
  - GET /orders
    - tbd
- how transaction is implemented:
  - tbd
