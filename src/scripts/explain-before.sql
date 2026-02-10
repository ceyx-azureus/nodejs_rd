EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id,
       o.user_id,
       o.status,
       o.created_at,
       oi.product_id,
       oi.quantity
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.user_id = '2a415eb9-caaf-4004-a4b0-e0d152c22afc'
  AND o.status = 'CREATED'
  AND o.created_at >= '2026-01-01'
  AND o.created_at <= '2026-03-01'
ORDER BY o.created_at DESC
LIMIT 20 OFFSET 0;
