-- ============================================================
-- Helper RPC functions
-- ============================================================

-- Decrement stock safely (called from Stripe webhook)
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_product_id;
END;
$$;

-- Monthly revenue view for analytics
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  TO_CHAR(created_at, 'YYYY-MM') AS month,
  SUM(total) FILTER (WHERE status = 'paid') AS shop_revenue,
  COUNT(*) FILTER (WHERE status = 'paid') AS order_count
FROM orders
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;

-- Booking occupancy view
CREATE OR REPLACE VIEW booking_occupancy AS
SELECT
  r.id AS room_id,
  r.name AS room_name,
  COUNT(b.id) FILTER (WHERE b.status = 'confirmed') AS confirmed_bookings,
  SUM(b.nights) FILTER (WHERE b.status = 'confirmed') AS total_nights_booked,
  SUM(b.total_price) FILTER (WHERE b.status = 'confirmed') AS total_revenue
FROM rooms r
LEFT JOIN bookings b ON b.room_id = r.id
GROUP BY r.id, r.name;
