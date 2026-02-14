INSERT INTO orders (order_number, user_id, status, idempotency_key, created_at)
  SELECT
    'ORD_A_' || generate_series,
    'f8bd70b6-4570-49dc-87a8-9c2b21c85a32',
    'CREATED',
    gen_random_uuid(),
    '2026-01-30'::timestamp + (random() * interval '15 days')
  FROM generate_series(1, 60000);

INSERT INTO orders (order_number, user_id, status, idempotency_key, created_at)
  SELECT
    'ORD_B_' || generate_series,
    'c10ed2b0-1206-4819-af47-4ba012dab3fb',
    'PAID',
    gen_random_uuid(),
    '2026-01-30'::timestamp + (random() * interval '15 days')
  FROM generate_series(1, 60000);