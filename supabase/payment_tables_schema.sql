-- BOND App - Payment & Subscription Tables for Supabase
-- Run this in your Supabase SQL Editor

-- ============================================
-- Table: payment_transactions
-- Stores all payment checkout sessions and their status
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL, -- 'month' or 'year'
  trial_days INTEGER NOT NULL DEFAULT 7,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  status TEXT NOT NULL DEFAULT 'initiated', -- 'initiated', 'complete', 'expired'
  subscription_created BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session_id ON payment_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status, status);

-- ============================================
-- Table: subscriptions
-- Stores active user subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  is_trial BOOLEAN DEFAULT TRUE,
  trial_ends_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  session_id TEXT UNIQUE REFERENCES payment_transactions(session_id),
  amount_paid DECIMAL(10, 2) NOT NULL,
  interval TEXT NOT NULL, -- 'month' or 'year'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);

-- ============================================
-- Table: webhook_events
-- Logs all Stripe webhook events for debugging
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT UNIQUE NOT NULL,
  session_id TEXT,
  payment_status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for event tracking
CREATE INDEX IF NOT EXISTS idx_webhook_events_session_id ON webhook_events(session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);

-- ============================================
-- Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Payment Transactions Policies
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payment transactions"
  ON payment_transactions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscriptions Policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Webhook Events Policies (service role only)
CREATE POLICY "Service role can manage webhook events"
  ON webhook_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Helper Views (Optional but useful)
-- ============================================

-- View: Active premium users
CREATE OR REPLACE VIEW active_premium_users AS
SELECT 
  u.id,
  u.email,
  u.name,
  s.package_id,
  s.package_name,
  s.is_trial,
  s.trial_ends_at,
  s.expires_at,
  s.amount_paid,
  s.interval
FROM users u
INNER JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active';

-- View: Monthly recurring revenue (MRR)
CREATE OR REPLACE VIEW monthly_recurring_revenue AS
SELECT 
  COUNT(*) as active_subscriptions,
  SUM(CASE WHEN interval = 'month' THEN amount_paid ELSE amount_paid / 12 END) as mrr,
  COUNT(CASE WHEN is_trial = TRUE THEN 1 END) as trial_users,
  COUNT(CASE WHEN is_trial = FALSE THEN 1 END) as paying_users
FROM subscriptions
WHERE status = 'active';

-- ============================================
-- Sample Queries
-- ============================================

-- Get user's subscription status
-- SELECT * FROM subscriptions WHERE user_id = '<user-uuid>' AND status = 'active';

-- Get all transactions for a user
-- SELECT * FROM payment_transactions WHERE user_id = '<user-uuid>' ORDER BY created_at DESC;

-- Get MRR stats
-- SELECT * FROM monthly_recurring_revenue;

-- Get expiring trials (next 7 days)
-- SELECT * FROM subscriptions 
-- WHERE is_trial = TRUE 
-- AND status = 'active' 
-- AND trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '7 days';

-- Find subscriptions to expire soon (auto-renewal reminders)
-- SELECT u.email, s.* FROM subscriptions s
-- JOIN users u ON s.user_id = u.id
-- WHERE s.status = 'active' 
-- AND s.expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days';
