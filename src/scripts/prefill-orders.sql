INSERT INTO orders (order_number, user_id, status, idempotency_key, created_at)
  SELECT
    'ORD_A_' || generate_series,
    '8268719b-3a89-4920-a752-37450722b2df',
    'CREATED',
    gen_random_uuid(),
    '2026-01-30'::timestamp + (random() * interval '15 days')
  FROM generate_series(1, 60000);

INSERT INTO orders (order_number, user_id, status, idempotency_key, created_at)
  SELECT
    'ORD_B_' || generate_series,
    '3ffd7e40-4198-463b-8bb2-9ddc744e87eb',
    'PAID',
    gen_random_uuid(),
    '2026-01-30'::timestamp + (random() * interval '15 days')
  FROM generate_series(1, 60000);