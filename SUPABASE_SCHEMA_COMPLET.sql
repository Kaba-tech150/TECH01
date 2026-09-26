-- ============================================================================
-- SCHÉMA COMPLET - APPLICATION DE GARDIENNAGE SECU GUARD
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('client', 'agent', 'company', 'admin');
CREATE TYPE mission_status AS ENUM ('draft', 'published', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE provider_status AS ENUM ('registered', 'documents_submitted', 'in_validation', 'validated', 'rejected', 'active', 'suspended');
CREATE TYPE payment_status AS ENUM ('blocked', 'released', 'refunded', 'in_dispute');
CREATE TYPE assignment_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');
CREATE TYPE document_type AS ENUM ('identity', 'certification', 'insurance', 'other');

-- Tables
-- 1. Profiles (utilisateurs de base)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rôles multiples; profiles.role reste le rôle principal pour compatibilité.
CREATE TABLE profile_roles (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, role)
);

INSERT INTO profile_roles (profile_id, role)
SELECT id, role FROM profiles
ON CONFLICT (profile_id, role) DO NOTHING;

-- 2. Agent Profiles (compléments pour les agents)
CREATE TABLE agent_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  company_id UUID,
  certification_number TEXT,
  certification_expiry DATE,
  hourly_rate DECIMAL(10,2),
  zone TEXT, -- Zone géographique (code postal, région, etc.)
  bio TEXT,
  status provider_status DEFAULT 'registered',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Company Profiles (compléments pour les sociétés)
CREATE TABLE company_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  siret TEXT UNIQUE,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  description TEXT,
  website TEXT,
  status provider_status DEFAULT 'registered',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE agent_profiles
  ADD CONSTRAINT agent_profiles_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE SET NULL;

-- 4. Documents (documents de validation)
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_url TEXT NOT NULL, -- URL Supabase Storage
  document_name TEXT,
  expiry_date DATE,
  status provider_status DEFAULT 'documents_submitted',
  rejection_reason TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Missions
CREATE TABLE missions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  agent_count INTEGER NOT NULL DEFAULT 1,
  budget DECIMAL(10,2),
  status mission_status DEFAULT 'draft',
  special_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Mission Assignments (affectation des agents/sociétés aux missions)
CREATE TABLE mission_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agent_profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
  status assignment_status DEFAULT 'pending',
  proposed_rate DECIMAL(10,2),
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_in_location_lat DECIMAL(10,8),
  check_in_location_lng DECIMAL(10,8),
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_out_location_lat DECIMAL(10,8),
  check_out_location_lng DECIMAL(10,8),
  report TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Wallets (portefeuilles)
CREATE TABLE wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  blocked_balance DECIMAL(10,2) DEFAULT 0,
  stripe_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Transactions
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  status payment_status DEFAULT 'blocked',
  description TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Reviews
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Messages
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Notifications
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profile_roles_role ON profile_roles(role);

CREATE INDEX idx_agent_profiles_profile_id ON agent_profiles(profile_id);
CREATE INDEX idx_agent_profiles_company_id ON agent_profiles(company_id);
CREATE INDEX idx_agent_profiles_status ON agent_profiles(status);
CREATE INDEX idx_agent_profiles_zone ON agent_profiles(zone);

CREATE INDEX idx_company_profiles_profile_id ON company_profiles(profile_id);
CREATE INDEX idx_company_profiles_status ON company_profiles(status);

CREATE INDEX idx_documents_profile_id ON documents(profile_id);
CREATE INDEX idx_documents_status ON documents(status);

CREATE INDEX idx_missions_client_id ON missions(client_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_start_time ON missions(start_time);
CREATE INDEX idx_missions_city ON missions(city);

CREATE INDEX idx_mission_assignments_mission_id ON mission_assignments(mission_id);
CREATE INDEX idx_mission_assignments_agent_id ON mission_assignments(agent_id);
CREATE INDEX idx_mission_assignments_company_id ON mission_assignments(company_id);
CREATE INDEX idx_mission_assignments_status ON mission_assignments(status);

CREATE INDEX idx_wallets_profile_id ON wallets(profile_id);

CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_mission_id ON transactions(mission_id);
CREATE INDEX idx_transactions_status ON transactions(status);

CREATE INDEX idx_reviews_mission_id ON reviews(mission_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);

CREATE INDEX idx_messages_mission_id ON messages(mission_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Fonctions internes utilisées par les politiques RLS; le schéma private n'est pas exposé par l'API.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(requested_role public.user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profile_roles
    WHERE profile_id = (SELECT auth.uid()) AND role = requested_role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = requested_role
  );
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.has_role('admin'::public.user_role);
$$;

CREATE OR REPLACE FUNCTION private.can_view_mission(target_mission_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = target_mission_id AND m.client_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.mission_assignments ma
      JOIN public.agent_profiles ap ON ap.id = ma.agent_id
      WHERE ma.mission_id = target_mission_id
        AND ma.status IN ('pending'::public.assignment_status, 'accepted'::public.assignment_status, 'completed'::public.assignment_status)
        AND ap.profile_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.mission_assignments ma
      JOIN public.company_profiles cp ON cp.id = ma.company_id
      WHERE ma.mission_id = target_mission_id
        AND ma.status IN ('pending'::public.assignment_status, 'accepted'::public.assignment_status, 'completed'::public.assignment_status)
        AND cp.profile_id = (SELECT auth.uid())
    );
$$;

CREATE OR REPLACE FUNCTION private.can_view_assignment(target_assignment_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.mission_assignments ma
      JOIN public.missions m ON m.id = ma.mission_id
      LEFT JOIN public.agent_profiles ap ON ap.id = ma.agent_id
      LEFT JOIN public.company_profiles cp ON cp.id = ma.company_id
      WHERE ma.id = target_assignment_id
        AND (m.client_id = (SELECT auth.uid()) OR ap.profile_id = (SELECT auth.uid()) OR cp.profile_id = (SELECT auth.uid()))
    );
$$;

CREATE OR REPLACE FUNCTION private.is_assignment_agent(target_assignment_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.mission_assignments ma
    JOIN public.agent_profiles ap ON ap.id = ma.agent_id
    WHERE ma.id = target_assignment_id AND ap.profile_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION private.can_review_mission(target_mission_id UUID, target_reviewee_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.missions m
    WHERE m.id = target_mission_id AND (
      (m.client_id = (SELECT auth.uid()) AND EXISTS (
        SELECT 1 FROM public.mission_assignments ma
        WHERE ma.mission_id = m.id AND ma.status = 'completed'::public.assignment_status
          AND (
            EXISTS (SELECT 1 FROM public.agent_profiles ap WHERE ap.id = ma.agent_id AND ap.profile_id = target_reviewee_id)
            OR EXISTS (SELECT 1 FROM public.company_profiles cp WHERE cp.id = ma.company_id AND cp.profile_id = target_reviewee_id)
          )
      ))
      OR (m.client_id = target_reviewee_id AND EXISTS (
        SELECT 1 FROM public.mission_assignments ma
        WHERE ma.mission_id = m.id AND ma.status = 'completed'::public.assignment_status
          AND (
            EXISTS (SELECT 1 FROM public.agent_profiles ap WHERE ap.id = ma.agent_id AND ap.profile_id = (SELECT auth.uid()))
            OR EXISTS (SELECT 1 FROM public.company_profiles cp WHERE cp.id = ma.company_id AND cp.profile_id = (SELECT auth.uid()))
          )
      ))
    )
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(public.user_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_view_mission(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_view_assignment(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_assignment_agent(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_review_mission(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(public.user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_view_mission(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_view_assignment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_assignment_agent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_review_mission(UUID, UUID) TO authenticated;

-- Aucun profil, document ou statut de prestataire n'est publiquement lisible.
CREATE POLICY "Profiles are viewable by owner or admin" ON profiles FOR SELECT
  USING (id = (SELECT auth.uid()) OR private.is_admin());
CREATE POLICY "Owners and admins can update profile details" ON profiles FOR UPDATE
  USING (id = (SELECT auth.uid()) OR private.is_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR private.is_admin());

CREATE POLICY "Users can view their role assignments" ON profile_roles FOR SELECT
  USING (profile_id = (SELECT auth.uid()) OR private.is_admin());
CREATE POLICY "Admins can add role assignments" ON profile_roles FOR INSERT
  WITH CHECK (private.is_admin());
CREATE POLICY "Admins can update role assignments" ON profile_roles FOR UPDATE
  USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "Admins can remove role assignments" ON profile_roles FOR DELETE
  USING (private.is_admin());

CREATE POLICY "Agents can view own or company-linked profile" ON agent_profiles FOR SELECT
  USING (
    profile_id = (SELECT auth.uid()) OR private.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.company_profiles cp
      WHERE cp.id = agent_profiles.company_id AND cp.profile_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Agents can create own pending profile" ON agent_profiles FOR INSERT
  WITH CHECK (profile_id = (SELECT auth.uid()) AND company_id IS NULL AND status = 'registered');
CREATE POLICY "Agents can update own profile details" ON agent_profiles FOR UPDATE
  USING (profile_id = (SELECT auth.uid())) WITH CHECK (profile_id = (SELECT auth.uid()));
CREATE POLICY "Admins can update agent profiles" ON agent_profiles FOR UPDATE
  USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "Companies can view own profile" ON company_profiles FOR SELECT
  USING (profile_id = (SELECT auth.uid()) OR private.is_admin());
CREATE POLICY "Companies can create own pending profile" ON company_profiles FOR INSERT
  WITH CHECK (profile_id = (SELECT auth.uid()) AND status = 'registered');
CREATE POLICY "Companies can update own profile details" ON company_profiles FOR UPDATE
  USING (profile_id = (SELECT auth.uid())) WITH CHECK (profile_id = (SELECT auth.uid()));
CREATE POLICY "Admins can update company profiles" ON company_profiles FOR UPDATE
  USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "Users can view own documents; admins can view all" ON documents FOR SELECT
  USING (profile_id = (SELECT auth.uid()) OR private.is_admin());
CREATE POLICY "Users can submit own documents" ON documents FOR INSERT
  WITH CHECK (profile_id = (SELECT auth.uid()) AND status = 'documents_submitted');
CREATE POLICY "Admins can review documents" ON documents FOR UPDATE
  USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "Mission participants can view mission" ON missions FOR SELECT
  USING (private.can_view_mission(id));
CREATE POLICY "Clients can create draft missions" ON missions FOR INSERT
  WITH CHECK (client_id = (SELECT auth.uid()) AND status = 'draft');
CREATE POLICY "Clients can edit own draft mission details" ON missions FOR UPDATE
  USING (client_id = (SELECT auth.uid()) AND status = 'draft')
  WITH CHECK (client_id = (SELECT auth.uid()) AND status = 'draft');

CREATE POLICY "Mission participants can view assignments" ON mission_assignments FOR SELECT
  USING (private.can_view_assignment(id));
CREATE POLICY "Assigned agents can update mission reports" ON mission_assignments FOR UPDATE
  USING (private.is_assignment_agent(id)) WITH CHECK (private.is_assignment_agent(id));

CREATE POLICY "Users can view own wallet; admins can view all" ON wallets FOR SELECT
  USING (profile_id = (SELECT auth.uid()) OR private.is_admin());
CREATE POLICY "Users can view own transactions; admins can view all" ON transactions FOR SELECT
  USING (
    private.is_admin() OR EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = transactions.wallet_id AND w.profile_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Review participants can view reviews" ON reviews FOR SELECT
  USING (reviewer_id = (SELECT auth.uid()) OR reviewee_id = (SELECT auth.uid()) OR private.is_admin());
CREATE POLICY "Mission participants can create valid reviews" ON reviews FOR INSERT
  WITH CHECK (
    reviewer_id = (SELECT auth.uid()) AND reviewee_id <> (SELECT auth.uid())
    AND private.can_review_mission(mission_id, reviewee_id)
  );
CREATE POLICY "Review authors can edit their review" ON reviews FOR UPDATE
  USING (reviewer_id = (SELECT auth.uid()))
  WITH CHECK (reviewer_id = (SELECT auth.uid()) AND private.can_review_mission(mission_id, reviewee_id));

CREATE POLICY "Mission participants can view messages" ON messages FOR SELECT
  USING (private.can_view_mission(mission_id));
CREATE POLICY "Mission participants can send messages as themselves" ON messages FOR INSERT
  WITH CHECK (sender_id = (SELECT auth.uid()) AND private.can_view_mission(mission_id));
CREATE POLICY "Mission participants can mark messages read" ON messages FOR UPDATE
  USING (private.can_view_mission(mission_id)) WITH CHECK (private.can_view_mission(mission_id));

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
  USING (profile_id = (SELECT auth.uid()));
CREATE POLICY "Users can mark own notifications read" ON notifications FOR UPDATE
  USING (profile_id = (SELECT auth.uid())) WITH CHECK (profile_id = (SELECT auth.uid()));

-- Le client ne peut jamais écrire les soldes, les transactions ou les statuts sensibles.
REVOKE ALL ON TABLE profiles, profile_roles, agent_profiles, company_profiles, documents,
  missions, mission_assignments, wallets, transactions, reviews, messages, notifications
  FROM anon, authenticated;
GRANT SELECT ON TABLE profiles, profile_roles, agent_profiles, company_profiles, documents,
  missions, mission_assignments, wallets, transactions, reviews, messages, notifications
  TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE profile_roles TO authenticated;
GRANT UPDATE (full_name, phone, avatar_url) ON TABLE profiles TO authenticated;
GRANT INSERT (profile_id, certification_number, certification_expiry, hourly_rate, zone, bio)
  ON TABLE agent_profiles TO authenticated;
GRANT UPDATE (certification_number, certification_expiry, hourly_rate, zone, bio, is_available)
  ON TABLE agent_profiles TO authenticated;
GRANT INSERT (profile_id, company_name, siret, address, city, postal_code, description, website)
  ON TABLE company_profiles TO authenticated;
GRANT UPDATE (company_name, siret, address, city, postal_code, description, website)
  ON TABLE company_profiles TO authenticated;
GRANT INSERT (profile_id, document_type, document_url, document_name, expiry_date)
  ON TABLE documents TO authenticated;
GRANT UPDATE (status, rejection_reason, verified_by, verified_at)
  ON TABLE documents TO authenticated;
GRANT INSERT (client_id, title, description, address, city, postal_code, start_time, end_time, agent_count, budget, special_requirements)
  ON TABLE missions TO authenticated;
GRANT UPDATE (title, description, address, city, postal_code, start_time, end_time, agent_count, budget, special_requirements)
  ON TABLE missions TO authenticated;
GRANT UPDATE (check_in_time, check_in_location_lat, check_in_location_lng, check_out_time, check_out_location_lat, check_out_location_lng, report)
  ON TABLE mission_assignments TO authenticated;
GRANT INSERT (mission_id, reviewer_id, reviewee_id, rating, comment)
  ON TABLE reviews TO authenticated;
GRANT UPDATE (rating, comment) ON TABLE reviews TO authenticated;
GRANT INSERT (mission_id, sender_id, content) ON TABLE messages TO authenticated;
GRANT UPDATE (read) ON TABLE messages TO authenticated;
GRANT UPDATE (read) ON TABLE notifications TO authenticated;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_profiles_updated_at BEFORE UPDATE ON agent_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_profiles_updated_at BEFORE UPDATE ON company_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mission_assignments_updated_at BEFORE UPDATE ON mission_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour créer automatiquement un profile après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
  safe_role public.user_role;
BEGIN
  requested_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'client'));
  IF requested_role IN ('client', 'agent', 'company') THEN
    safe_role := requested_role::public.user_role;
  ELSE
    safe_role := 'client'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    safe_role
  );

  INSERT INTO public.profile_roles (profile_id, role)
  VALUES (NEW.id, safe_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger pour créer automatiquement un wallet après création de profile
CREATE OR REPLACE FUNCTION create_wallet_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (profile_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_wallet_for_profile();
