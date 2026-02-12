INSERT INTO orders (order_number, user_id, status, idempotency_key, created_at)
  SELECT
    'ORD_A_' || generate_series,
    '31dc0380-a10f-4640-8f96-86b3f46b9659',
    'CREATED',
    gen_random_uuid(),
    '2026-01-30'::timestamp + (random() * interval '15 days')
  FROM generate_series(1, 60000);

INSERT INTO orders (order_number, user_id, status, idempotency_key, created_at)
  SELECT
    'ORD_B_' || generate_series,
    '3974822d-8bc3-4506-9e09-51a7fd8cbbc2',
    'CREATED',
    gen_random_uuid(),
    '2026-01-30'::timestamp + (random() * interval '15 days')
  FROM generate_series(1, 60000);