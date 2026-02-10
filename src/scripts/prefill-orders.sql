INSERT INTO orders (order_number, user_id, status, idempotency_key, created_at)
  SELECT
    'ORD_' || generate_series,
    '2a415eb9-caaf-4004-a4b0-e0d152c22afc',
    'CREATED',
    gen_random_uuid(),
    '2026-01-30'::timestamp + (random() * interval '15 days')
  FROM generate_series(1, 100000);