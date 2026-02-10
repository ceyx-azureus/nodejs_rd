INSERT INTO orders (order_number, user_id, status, idempotency_key, created_at)
  SELECT
    'ORD_' || generate_series,
    '2ccd911b-b93e-4bd3-bebc-7013bea76e53',
    'CREATED',
    gen_random_uuid(),
    '2026-01-30'::timestamp + (random() * interval '15 days')
  FROM generate_series(1, 100000);