-- ============================================================
-- Maison Lambert — Database Schema
-- PostgreSQL / Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (admin accounts managed via NextAuth + Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  role         TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  description  TEXT NOT NULL,
  price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url    TEXT,
  category     TEXT NOT NULL CHECK (category IN ('brut', 'rosé', 'blanc-de-blancs', 'millésime', 'prestige', 'autre')),
  featured     BOOLEAN NOT NULL DEFAULT FALSE,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_session_id    TEXT UNIQUE,
  stripe_payment_intent TEXT,
  customer_email       TEXT NOT NULL,
  customer_name        TEXT NOT NULL,
  customer_phone       TEXT,
  shipping_address     JSONB NOT NULL,
  subtotal             NUMERIC(10, 2) NOT NULL,
  shipping_cost        NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total                NUMERIC(10, 2) NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  pdf_url        TEXT,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  description    TEXT NOT NULL,
  price_per_night NUMERIC(10, 2) NOT NULL CHECK (price_per_night > 0),
  capacity       INTEGER NOT NULL DEFAULT 2,
  photos         TEXT[] NOT NULL DEFAULT '{}',
  amenities      TEXT[] NOT NULL DEFAULT '{}',
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_name      TEXT NOT NULL,
  guest_email     TEXT NOT NULL,
  guest_phone     TEXT,
  check_in        DATE NOT NULL,
  check_out       DATE NOT NULL,
  nights          INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
  total_price     NUMERIC(10, 2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'confirmed'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  source          TEXT NOT NULL DEFAULT 'direct'
                    CHECK (source IN ('direct', 'airbnb', 'booking', 'other')),
  external_uid    TEXT,              -- iCal UID for external bookings
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_overlapping_bookings UNIQUE NULLS NOT DISTINCT (room_id, check_in, check_out),
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_slug       ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active      ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_email         ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room        ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates       ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_invoices_order       ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number      ON invoices(invoice_number);

-- ============================================================
-- FUNCTION: prevent overlapping bookings
-- ============================================================
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE room_id = NEW.room_id
      AND id != COALESCE(NEW.id, uuid_generate_v4())
      AND status NOT IN ('cancelled')
      AND check_in  < NEW.check_out
      AND check_out > NEW.check_in
  ) THEN
    RAISE EXCEPTION 'Room is already booked for the selected dates';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_overlap
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION check_booking_overlap();

-- ============================================================
-- FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at  BEFORE UPDATE ON products  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at    BEFORE UPDATE ON orders    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_rooms_updated_at     BEFORE UPDATE ON rooms     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at  BEFORE UPDATE ON bookings  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (Supabase)
-- ============================================================
ALTER TABLE products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users     ENABLE ROW LEVEL SECURITY;

-- Public read access for products and rooms
CREATE POLICY "products_public_read"  ON products  FOR SELECT USING (active = true);
CREATE POLICY "rooms_public_read"     ON rooms     FOR SELECT USING (active = true);

-- Service role has full access (used by API routes)
CREATE POLICY "service_role_all_products"    ON products    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_orders"      ON orders      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_order_items" ON order_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_invoices"    ON invoices    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_rooms"       ON rooms       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_bookings"    ON bookings    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_users"       ON users       FOR ALL USING (auth.role() = 'service_role');
