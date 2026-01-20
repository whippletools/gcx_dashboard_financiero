-- Insert environment configuration data
INSERT INTO environment_config (key, value, description) VALUES
  ('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtcmZjYXV1dWJibGFpa3Vka3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMTc1NzYsImV4cCI6MjA3Mzg5MzU3Nn0.TX8rK2KXqj6oT3vlZwhxki36znsauteVLjYJ2aC1o6Q', 'Supabase anonymous key for client-side access'),
  ('NEXT_PUBLIC_SUPABASE_URL', 'https://vmrfcauuubblaikudkpt.supabase.co', 'Supabase project URL'),
  ('POSTGRES_DATABASE', 'postgres', 'PostgreSQL database name'),
  ('POSTGRES_HOST', 'db.vmrfcauuubblaikudkpt.supabase.co', 'PostgreSQL host address'),
  ('POSTGRES_PASSWORD', 'SaxrmZSId476nXY9', 'PostgreSQL database password'),
  ('POSTGRES_PRISMA_URL', 'postgres://postgres.vmrfcauuubblaikudkpt:SaxrmZSId476nXY9@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true', 'PostgreSQL connection URL for Prisma with connection pooling'),
  ('POSTGRES_URL', 'postgres://postgres.vmrfcauuubblaikudkpt:SaxrmZSId476nXY9@aws-1-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x', 'PostgreSQL connection URL with pooling'),
  ('POSTGRES_URL_NON_POOLING', 'postgres://postgres.vmrfcauuubblaikudkpt:SaxrmZSId476nXY9@aws-1-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require', 'PostgreSQL connection URL without pooling'),
  ('POSTGRES_USER', 'postgres', 'PostgreSQL username'),
  ('SUPABASE_JWT_SECRET', '9hkLEv/OOMbIWaZ1DBRafHoxiQdGh2ejsMOT+m/2dL+de62Bj/yrbv5gQF9tFpzbdiweDsuFfM9Oj9nFIdFq5Q==', 'JWT secret for token validation'),
  ('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtcmZjYXV1dWJibGFpa3Vka3B0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODMxNzU3NiwiZXhwIjoyMDczODkzNTc2fQ.o2hOHfrJJ1Ink_uQvuNFC5SfmKWRe60WzNLFBEDnJIk', 'Supabase service role key for server-side admin access'),
  ('SUPABASE_URL', 'https://vmrfcauuubblaikudkpt.supabase.co', 'Supabase project URL for server-side')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = NOW();
