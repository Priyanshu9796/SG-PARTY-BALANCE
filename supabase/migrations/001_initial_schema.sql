-- ============================================================
-- Party Balance — Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: parties
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parties (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_name  TEXT        NOT NULL,
  party_type  TEXT        NOT NULL CHECK (party_type IN ('supplier', 'customer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_user_party_name UNIQUE (user_id, party_name)
);

-- Indexes for parties
CREATE INDEX IF NOT EXISTS idx_parties_user_id ON public.parties(user_id);
CREATE INDEX IF NOT EXISTS idx_parties_party_type ON public.parties(party_type);

-- ============================================================
-- TABLE: party_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS public.party_entries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id      UUID        NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  entry_number  TEXT        NOT NULL,
  entry_date    DATE        NOT NULL,
  entry_type    TEXT        NOT NULL CHECK (entry_type IN ('bill', 'paid', 'received')),
  amount        NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for party_entries
CREATE INDEX IF NOT EXISTS idx_party_entries_user_id  ON public.party_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_party_entries_party_id ON public.party_entries(party_id);
CREATE INDEX IF NOT EXISTS idx_party_entries_date     ON public.party_entries(entry_date);

-- ============================================================
-- FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_parties_updated_at
  BEFORE UPDATE ON public.parties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_party_entries_updated_at
  BEFORE UPDATE ON public.party_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.parties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_entries ENABLE ROW LEVEL SECURITY;

-- Parties RLS policies
CREATE POLICY "parties_select_own" ON public.parties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "parties_insert_own" ON public.parties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "parties_update_own" ON public.parties
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "parties_delete_own" ON public.parties
  FOR DELETE USING (auth.uid() = user_id);

-- Party entries RLS policies
CREATE POLICY "entries_select_own" ON public.party_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "entries_insert_own" ON public.party_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "entries_update_own" ON public.party_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "entries_delete_own" ON public.party_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- VIEW: party_balances  (helper view — not used for RLS bypass)
-- ============================================================
CREATE OR REPLACE VIEW public.party_balances AS
SELECT
  p.id            AS party_id,
  p.user_id,
  p.party_name,
  p.party_type,
  p.created_at,
  COALESCE(SUM(CASE WHEN e.entry_type = 'bill'     THEN e.amount ELSE 0 END), 0) AS total_bills,
  COALESCE(SUM(CASE WHEN e.entry_type = 'paid'     THEN e.amount ELSE 0 END), 0) AS total_paid,
  COALESCE(SUM(CASE WHEN e.entry_type = 'received' THEN e.amount ELSE 0 END), 0) AS total_received,
  CASE
    WHEN p.party_type = 'supplier' THEN
      COALESCE(SUM(CASE WHEN e.entry_type = 'bill' THEN e.amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN e.entry_type = 'paid' THEN e.amount ELSE 0 END), 0)
    WHEN p.party_type = 'customer' THEN
      COALESCE(SUM(CASE WHEN e.entry_type = 'bill'     THEN e.amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN e.entry_type = 'received' THEN e.amount ELSE 0 END), 0)
    ELSE 0
  END AS balance
FROM public.parties p
LEFT JOIN public.party_entries e ON e.party_id = p.id
GROUP BY p.id, p.user_id, p.party_name, p.party_type, p.created_at;
