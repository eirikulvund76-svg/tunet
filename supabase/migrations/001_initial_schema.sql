-- ============================================================
-- GARDSHUS AIRBNB MANAGEMENT SYSTEM — DATABASE SCHEMA
-- Supabase / PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_name    TEXT NOT NULL,
  check_in      DATE NOT NULL,
  check_out     DATE NOT NULL,
  num_guests    INTEGER NOT NULL DEFAULT 2,
  price_per_night NUMERIC(10,2) NOT NULL,
  cleaning_fee  NUMERIC(10,2) NOT NULL DEFAULT 400,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('pending','confirmed','paid','cancelled','completed')),
  platform      TEXT DEFAULT 'airbnb'
                CHECK (platform IN ('airbnb','booking','direct','other')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Computed columns view
CREATE VIEW booking_economics AS
  SELECT
    id,
    guest_name,
    check_in,
    check_out,
    (check_out - check_in)                            AS nights,
    num_guests,
    price_per_night,
    cleaning_fee,
    (check_out - check_in) * price_per_night          AS room_revenue,
    (check_out - check_in) * price_per_night + cleaning_fee AS gross_revenue,
    status,
    platform,
    notes
  FROM bookings;

-- ============================================================
-- TURNOVER TEMPLATES & CHECKLISTS
-- ============================================================
CREATE TABLE turnover_tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  est_minutes   INTEGER NOT NULL DEFAULT 15,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE
);

-- Default tasks seed
INSERT INTO turnover_tasks (name, est_minutes, sort_order) VALUES
  ('Bytte sengetøy',          20, 1),
  ('Vaske bad',               25, 2),
  ('Vaske kjøkken',           20, 3),
  ('Støvsuge alle rom',       15, 4),
  ('Vaske golv',              20, 5),
  ('Fylle forbruksvarer',     10, 6),
  ('Kontrollere TV og lys',   10, 7),
  ('Byte kodeboks-kode',       5, 8),
  ('Ta dokumentasjonsbilete', 10, 9);

-- Turnover session (one per booking transition)
CREATE TABLE turnovers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Completed task log per turnover
CREATE TABLE turnover_task_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turnover_id   UUID NOT NULL REFERENCES turnovers(id) ON DELETE CASCADE,
  task_id       UUID NOT NULL REFERENCES turnover_tasks(id),
  completed     BOOLEAN DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  completed_by  TEXT,
  notes         TEXT
);

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE inventory_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'consumable'
                CHECK (category IN ('consumable','textile','equipment','cleaning')),
  unit          TEXT NOT NULL DEFAULT 'stk',
  current_qty   INTEGER NOT NULL DEFAULT 0,
  min_qty       INTEGER NOT NULL DEFAULT 3,
  max_qty       INTEGER NOT NULL DEFAULT 20,
  notes         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory transactions log
CREATE TABLE inventory_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id       UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  delta         INTEGER NOT NULL,       -- positive = restock, negative = use
  reason        TEXT,
  turnover_id   UUID REFERENCES turnovers(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Default inventory seed
INSERT INTO inventory_items (name, category, unit, current_qty, min_qty, max_qty) VALUES
  ('Toalettpapir',     'consumable', 'rull',  3,  5, 24),
  ('Såpe (hender)',    'consumable', 'flaske', 6,  4, 12),
  ('Vaskemiddel',      'cleaning',   'flaske', 2,  3, 10),
  ('Oppvaskmiddel',    'cleaning',   'flaske', 4,  3, 10),
  ('Kaffe / te',       'consumable', 'pakke',  8,  4, 20),
  ('Tørkepapir',       'consumable', 'rull',   5,  3, 12),
  ('Sengetøy (sett)',  'textile',    'sett',   8,  4, 12),
  ('Handkle (stor)',   'textile',    'stk',   14,  6, 20),
  ('Handkle (liten)',  'textile',    'stk',   10,  6, 16),
  ('Putever',          'textile',    'stk',    6,  4,  8),
  ('Dyne',             'textile',    'stk',    4,  2,  6);

-- Low-stock view
CREATE VIEW low_stock_items AS
  SELECT * FROM inventory_items
  WHERE current_qty <= min_qty
  ORDER BY (current_qty::float / NULLIF(min_qty,0)) ASC;

-- ============================================================
-- DAMAGE REPORTS
-- ============================================================
CREATE TABLE damage_reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  turnover_id   UUID REFERENCES turnovers(id) ON DELETE SET NULL,
  room          TEXT NOT NULL
                CHECK (room IN ('soverom','bad','kjøkken','stove','gang','utvendig','anna')),
  description   TEXT NOT NULL,
  priority      TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('high','medium','low')),
  status        TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','in_progress','resolved')),
  images        TEXT[],       -- array of Supabase Storage URLs
  repair_cost   NUMERIC(10,2),
  resolved_at   TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ECONOMY
-- ============================================================
CREATE TABLE economy_entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type          TEXT NOT NULL
                CHECK (type IN ('income','expense')),
  category      TEXT NOT NULL,
  -- Income categories: booking_revenue, cleaning_fee, other_income
  -- Expense categories: electricity, insurance, maintenance, consumables, platform_fee, other
  amount        NUMERIC(10,2) NOT NULL,
  description   TEXT,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly summary view
CREATE VIEW monthly_economy AS
  SELECT
    DATE_TRUNC('month', date)                    AS month,
    SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN type = 'income'  THEN amount
             WHEN type = 'expense' THEN -amount
             ELSE 0 END)                          AS net
  FROM economy_entries
  GROUP BY DATE_TRUNC('month', date)
  ORDER BY month DESC;

-- Per-booking P&L view
CREATE VIEW booking_pnl AS
  SELECT
    b.id,
    b.guest_name,
    b.check_in,
    b.check_out,
    SUM(CASE WHEN e.type = 'income'  THEN e.amount ELSE 0 END) AS income,
    SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END) AS expenses,
    SUM(CASE WHEN e.type = 'income'  THEN e.amount
             WHEN e.type = 'expense' THEN -e.amount
             ELSE 0 END)                          AS net
  FROM bookings b
  LEFT JOIN economy_entries e ON e.booking_id = b.id
  GROUP BY b.id, b.guest_name, b.check_in, b.check_out
  ORDER BY b.check_in DESC;

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update timestamps)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_inventory_updated
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_damage_updated
  BEFORE UPDATE ON damage_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (enable when adding auth)
-- ============================================================
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnovers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnover_task_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports    ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_entries   ENABLE ROW LEVEL SECURITY;

-- Policies (owner-only: single user setup)
-- Replace 'your-user-id' with actual UUID from auth.users after login
-- CREATE POLICY owner_all ON bookings FOR ALL USING (auth.uid() = 'your-user-id');
