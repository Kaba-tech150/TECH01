-- ============================================================================
-- SCHÉMA MINIMAL DE DÉVELOPPEMENT - APPLICATION DE GARDIENNAGE
-- Ne pas exécuter après SUPABASE_SCHEMA_COMPLET.sql : ce fichier est une alternative réduite.
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('client', 'agent', 'admin');
CREATE TYPE mission_status AS ENUM ('draft', 'published', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Tables
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE missions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  agent_count INTEGER NOT NULL DEFAULT 1,
  budget DECIMAL(10,2),
  status mission_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_missions_client ON missions(client_id);
CREATE INDEX idx_missions_status ON missions(status);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Aucune donnée personnelle n'est publiquement lisible; le rôle n'est pas modifiable par le client.
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
  USING (id = (SELECT auth.uid()));
CREATE POLICY "Users can update own profile details" ON profiles FOR UPDATE
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Clients can view own missions" ON missions FOR SELECT
  USING (client_id = (SELECT auth.uid()));
CREATE POLICY "Clients can create draft missions" ON missions FOR INSERT
  WITH CHECK (client_id = (SELECT auth.uid()) AND status = 'draft');
CREATE POLICY "Clients can update own draft mission details" ON missions FOR UPDATE
  USING (client_id = (SELECT auth.uid()) AND status = 'draft')
  WITH CHECK (client_id = (SELECT auth.uid()) AND status = 'draft');

REVOKE ALL ON TABLE profiles, missions FROM anon, authenticated;
GRANT SELECT ON TABLE profiles, missions TO authenticated;
GRANT UPDATE (full_name, avatar_url) ON TABLE profiles TO authenticated;
GRANT INSERT (client_id, title, description, address, city, start_time, end_time, agent_count, budget)
  ON TABLE missions TO authenticated;
GRANT UPDATE (title, description, address, city, start_time, end_time, agent_count, budget)
  ON TABLE missions TO authenticated;

-- Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
