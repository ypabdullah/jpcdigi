-- Create tables to support WhatsApp broadcast functionality

-- Table for storing broadcast campaigns
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_template TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('all', 'selected', 'filtered')),
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sending', 'scheduled', 'completed', 'failed')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table for storing broadcast messages (individual message status)
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing broadcast recipients (for scheduled broadcasts)
CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(broadcast_id, user_id)
);

-- Table for storing order status history
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS broadcast_messages_broadcast_id_idx ON broadcast_messages(broadcast_id);
CREATE INDEX IF NOT EXISTS broadcast_messages_user_id_idx ON broadcast_messages(user_id);
CREATE INDEX IF NOT EXISTS broadcast_recipients_broadcast_id_idx ON broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx ON order_status_history(order_id);

-- RLS policies for the new tables
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage broadcasts
CREATE POLICY broadcast_admin_policy ON broadcasts
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY broadcast_messages_admin_policy ON broadcast_messages
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY broadcast_recipients_admin_policy ON broadcast_recipients
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Admins can view all order status history
CREATE POLICY order_status_admin_policy ON order_status_history
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Customers can view status history for their own orders
CREATE POLICY order_status_customer_policy ON order_status_history
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM orders WHERE id = order_id
    )
  );
