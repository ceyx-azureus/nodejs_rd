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

## From Bonus list:

- added additional safety check: unique(userId, idempotencyKey)

## Before /orders optimization, 100k orders:

Limit (cost=9339.27..9339.32 rows=20 width=64) (actual time=46.169..46.173 rows=20 loops=1)
Buffers: shared hit=1644, temp read=414 written=414
-> Sort (cost=9339.27..9589.22 rows=99979 width=64) (actual time=46.168..46.170 rows=20 loops=1)
Sort Key: o.created_at DESC
Sort Method: top-N heapsort Memory: 27kB
Buffers: shared hit=1644, temp read=414 written=414
-> Hash Right Join (cost=5768.78..6678.87 rows=99979 width=64) (actual time=26.549..36.231 rows=100000 loops=1)
Hash Cond: (oi.order_id = o.id)
Buffers: shared hit=1641, temp read=414 written=414
-> Seq Scan on order_items oi (cost=0.00..17.20 rows=720 width=36) (actual time=0.011..0.012 rows=4 loops=1)
Buffers: shared hit=1
-> Hash (cost=3640.04..3640.04 rows=99979 width=44) (actual time=26.314..26.314 rows=100000 loops=1)
Buckets: 131072 Batches: 2 Memory Usage: 4954kB
Buffers: shared hit=1640, temp written=412
-> Seq Scan on orders o (cost=0.00..3640.04 rows=99979 width=44) (actual time=0.005..12.399 rows=100000 loops=1)
Filter: ((created_at >= '2026-01-01 00:00:00'::timestamp without time zone) AND (created_at <= '2026-03-01 00:00:00'::timestamp without time zone) AND (user_id = 'f2b8e4d4-f1c2-4be9-9f1a-cf81db56ba44'::uuid) AND (status = 'CREATED'::orders_status_enum))
Rows Removed by Filter: 2
Buffers: shared hit=1640
Planning:
Buffers: shared hit=277
Planning Time: 0.436 ms
Execution Time: 46.198 ms
(22 rows)

## with /orders idx optimization, 100k orders:

- @Index('idx_orders_user_status_created', ['userId', 'status', 'createdAt'])
  Limit (cost=0.42..218.31 rows=20 width=64) (actual time=0.041..0.137 rows=20 loops=1)
  Buffers: shared hit=24
  -> Nested Loop Left Join (cost=0.42..1089184.09 rows=99975 width=64) (actual time=0.040..0.134 rows=20 loops=1)
  Join Filter: (oi.order_id = o.id)
  Rows Removed by Join Filter: 160
  Buffers: shared hit=24
  -> Index Scan Backward using idx_orders_user_status_created on orders o (cost=0.42..9435.09 rows=99975 width=44) (actual time=0.027..0.096 rows=20 loops=1)
  Index Cond: ((user_id = '66903d44-2322-458e-96a4-b71803384ad5'::uuid) AND (status = 'CREATED'::orders_status_enum) AND (created_at >= '2026-01-01 00:00:00'::timestamp without time zone) AND (created_at <= '2026-03-01 00:00:00'::timestamp without time zone))
  Buffers: shared hit=23
  -> Materialize (cost=0.00..20.80 rows=720 width=36) (actual time=0.000..0.001 rows=8 loops=20)
  Buffers: shared hit=1
  -> Seq Scan on order_items oi (cost=0.00..17.20 rows=720 width=36) (actual time=0.004..0.005 rows=8 loops=1)
  Buffers: shared hit=1
  Planning:
  Buffers: shared hit=308
  Planning Time: 0.489 ms
  Execution Time: 0.158 ms
  (17 rows)

## explain analyze on final commit:

Limit (cost=27.55..27.56 rows=1 width=64) (actual time=38.621..38.625 rows=20 loops=1)
Buffers: shared hit=60941
-> Sort (cost=27.55..27.56 rows=1 width=64) (actual time=38.620..38.622 rows=20 loops=1)
Sort Key: o.created_at DESC
Sort Method: top-N heapsort Memory: 27kB
Buffers: shared hit=60941
-> Hash Right Join (cost=8.45..27.54 rows=1 width=64) (actual time=28.064..32.172 rows=60000 loops=1)
Hash Cond: (oi.order_id = o.id)
Buffers: shared hit=60938
-> Seq Scan on order_items oi (cost=0.00..17.20 rows=720 width=36) (actual time=0.014..0.014 rows=4 loops=1)
Buffers: shared hit=1
-> Hash (cost=8.44..8.44 rows=1 width=44) (actual time=28.042..28.043 rows=60000 loops=1)
Buckets: 65536 (originally 1024) Batches: 1 (originally 1) Memory Usage: 5200kB
Buffers: shared hit=60937
-> Index Scan Backward using idx_orders_user_status_created on orders o (cost=0.41..8.44 rows=1 width=44) (actual time=0.025..20.083 rows=60000 loops=1)
Index Cond: ((user_id = 'e7938922-2991-43df-a835-b7c098c1f691'::uuid) AND (status = 'CREATED'::orders_status_enum) AND (created_at >= '2026-01-01 00:00:00'::timestamp without time zone) AND (created_at <= '2026-03-01 00:00:00'::timestamp without time zone))
Buffers: shared hit=60937
Planning:
Buffers: shared hit=311 read=2
Planning Time: 0.434 ms
Execution Time: 38.689 ms
(21 rows)

## and second run when DB built a hash table:

Limit (cost=0.42..218.90 rows=20 width=64) (actual time=0.035..0.116 rows=20 loops=1)
Buffers: shared hit=23
-> Nested Loop Left Join (cost=0.42..657869.18 rows=60221 width=64) (actual time=0.034..0.113 rows=20 loops=1)
Join Filter: (oi.order_id = o.id)
Rows Removed by Join Filter: 80
Buffers: shared hit=23
-> Index Scan Backward using idx_orders_user_status_created on orders o (cost=0.42..7463.38 rows=60221 width=44) (actual time=0.025..0.091 rows=20 loops=1)
Index Cond: ((user_id = 'e7938922-2991-43df-a835-b7c098c1f691'::uuid) AND (status = 'CREATED'::orders_status_enum) AND (created_at >= '2026-01-01 00:00:00'::timestamp without time zone) AND (created_at <= '2026-03-01 00:00:00'::timestamp without time zone))
Buffers: shared hit=22
-> Materialize (cost=0.00..20.80 rows=720 width=36) (actual time=0.000..0.001 rows=4 loops=20)
Buffers: shared hit=1
-> Seq Scan on order_items oi (cost=0.00..17.20 rows=720 width=36) (actual time=0.003..0.003 rows=4 loops=1)
Buffers: shared hit=1
Planning:
Buffers: shared hit=311 dirtied=1
Planning Time: 0.449 ms
Execution Time: 0.136 ms
(17 rows)
