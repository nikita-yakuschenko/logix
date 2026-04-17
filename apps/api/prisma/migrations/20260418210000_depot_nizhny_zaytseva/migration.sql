-- Производство: Нижний Новгород, ул. Зайцева, 31 (MVP — правим самый старый склад).
UPDATE "Depot" d
SET
  "name" = 'Производство',
  "address" = '603158, г. Нижний Новгород, ул. Зайцева, д. 31',
  "lat" = 56.36664,
  "lng" = 43.795044,
  "updatedAt" = NOW()
FROM (
  SELECT id FROM "Depot" ORDER BY "createdAt" ASC LIMIT 1
) AS first
WHERE d.id = first.id;
