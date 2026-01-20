-- Create a table to store environment configuration
CREATE TABLE IF NOT EXISTS environment_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the key column for faster lookups
CREATE INDEX IF NOT EXISTS idx_environment_config_key ON environment_config(key);

-- Enable Row Level Security
ALTER TABLE environment_config ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows service role to do everything
CREATE POLICY "Service role has full access to environment_config"
  ON environment_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a policy that allows authenticated users to read
CREATE POLICY "Authenticated users can read environment_config"
  ON environment_config
  FOR SELECT
  TO authenticated
  USING (true);
