-- Create table for storing web push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL, -- Stores { p256dh, auth }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view/delete their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Service Role (server) needs full access (default behavior usually, but good to know)
