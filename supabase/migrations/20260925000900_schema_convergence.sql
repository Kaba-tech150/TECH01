-- Convergence de la structure de TOUTES les tables — 2026-09-26.
--
-- POURQUOI CE CORRECTIF EST NÉCESSAIRE
--
-- Deux incidents réels ont révélé le même problème de fond le 2026-09-26 :
--
--   1. `42703: la colonne "phone" de la relation "profiles" n'existe pas`
--   2. `42703: la colonne "postal_code" de la relation "missions" n'existe pas`
--
-- CAUSE RACINE, UNE SEULE POUR LES DEUX
--
-- La migration 20260925000100 crée les tables avec :
--
--   create table if not exists public.missions ( ... postal_code text ... );
--
-- Or `if not exists` rend l'instruction SANS EFFET si la table existe déjà.
-- Sur le projet distant, `profiles` et `missions` existaient DÉJÀ avant
-- l'application de 00100 — ce que le diagnostic du 2026-09-25 signalait
-- (« 2 tables sur 12 »). Ces deux tables ont donc conservé la structure
-- d'une version antérieure du schéma, et les colonnes ajoutées depuis lors
-- n'ont jamais été créées.
--
-- Les 10 autres tables n'existaient pas et ont été créées normalement : c'est
-- pourquoi les erreurs apparaissent toujours sur `profiles` et `missions`.
--
-- Le paradoxe de `create table if not exists` : il masque la divergence au
-- lieu de la signaler, en laissant croire que le schéma est à jour.
--
-- POURQUOI UN SEUL FICHIER POUR TOUT
--
-- Corriger table par table reviendrait à découvrir une nouvelle erreur
-- `42703` à chaque exécution de 00300, une colonne manquante à la fois. Ce
-- fichier aligne les 12 tables sur le schéma de référence en une passe.
--
-- PRINCIPE
--
--   alter table ... add column if not exists
--
-- Sur une colonne déjà présente, l'instruction ne fait RIEN. Aucun type, aucun
-- défaut et aucune contrainte existante n'est modifié. Aucune donnée n'est
-- supprimée. Seules les colonnes réellement absentes sont créées.
--
-- Les colonnes ajoutées sont soit facultatives, soit accompagnées d'une valeur
-- par défaut : l'ajout réussit donc même si la table contient déjà des lignes.
--
-- COLONNES VOLONTAIREMENT NON AJOUTÉES
--
-- `id` n'est pas ajouté sur aucune table. C'est une clé primaire référençant
-- `auth.users` : ce n'est pas un simple ajout de colonne, et le CONTRÔLE 17
-- signalerait son absence.
--
-- Idempotent : peut être rejoué sans effet de bord.

begin;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists role public.user_role not null default 'client';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- profile_roles
-- ---------------------------------------------------------------------------
alter table public.profile_roles add column if not exists role public.user_role not null default 'client';
alter table public.profile_roles add column if not exists created_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- company_profiles
-- ---------------------------------------------------------------------------
alter table public.company_profiles add column if not exists siret text;
alter table public.company_profiles add column if not exists address text;
alter table public.company_profiles add column if not exists city text;
alter table public.company_profiles add column if not exists postal_code text;
alter table public.company_profiles add column if not exists description text;
alter table public.company_profiles add column if not exists website text;
alter table public.company_profiles add column if not exists status public.provider_status not null default 'registered';
alter table public.company_profiles add column if not exists created_at timestamptz not null default now();
alter table public.company_profiles add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- agent_profiles
-- ---------------------------------------------------------------------------
alter table public.agent_profiles add column if not exists company_id uuid;
alter table public.agent_profiles add column if not exists certification_number text;
alter table public.agent_profiles add column if not exists certification_expiry date;
alter table public.agent_profiles add column if not exists hourly_rate numeric(10,2);
alter table public.agent_profiles add column if not exists zone text;
alter table public.agent_profiles add column if not exists bio text;
alter table public.agent_profiles add column if not exists status public.provider_status not null default 'registered';
alter table public.agent_profiles add column if not exists is_available boolean not null default true;
alter table public.agent_profiles add column if not exists created_at timestamptz not null default now();
alter table public.agent_profiles add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
alter table public.documents add column if not exists document_name text;
alter table public.documents add column if not exists expiry_date date;
alter table public.documents add column if not exists status public.provider_status not null default 'documents_submitted';
alter table public.documents add column if not exists rejection_reason text;
alter table public.documents add column if not exists verified_by uuid;
alter table public.documents add column if not exists verified_at timestamptz;
alter table public.documents add column if not exists created_at timestamptz not null default now();
alter table public.documents add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- missions
--
-- C'est la table à l'origine de l'erreur `postal_code`. `description`,
-- `postal_code` et `special_requirements` sont facultatives et ont pu être
-- ajoutées après la création initiale de la table.
-- ---------------------------------------------------------------------------
alter table public.missions add column if not exists description text;
alter table public.missions add column if not exists postal_code text;
alter table public.missions add column if not exists special_requirements text;
alter table public.missions add column if not exists budget numeric(10,2);
alter table public.missions add column if not exists agent_count integer not null default 1;
alter table public.missions add column if not exists status public.mission_status not null default 'draft';
alter table public.missions add column if not exists created_at timestamptz not null default now();
alter table public.missions add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- mission_assignments
-- ---------------------------------------------------------------------------
alter table public.mission_assignments add column if not exists company_id uuid;
alter table public.mission_assignments add column if not exists proposed_rate numeric(10,2);
alter table public.mission_assignments add column if not exists check_in_time timestamptz;
alter table public.mission_assignments add column if not exists check_in_location_lat numeric(10,8);
alter table public.mission_assignments add column if not exists check_in_location_lng numeric(10,8);
alter table public.mission_assignments add column if not exists check_out_time timestamptz;
alter table public.mission_assignments add column if not exists check_out_location_lat numeric(10,8);
alter table public.mission_assignments add column if not exists check_out_location_lng numeric(10,8);
alter table public.mission_assignments add column if not exists report text;
alter table public.mission_assignments add column if not exists status public.assignment_status not null default 'pending';
alter table public.mission_assignments add column if not exists created_at timestamptz not null default now();
alter table public.mission_assignments add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- wallets
-- ---------------------------------------------------------------------------
alter table public.wallets add column if not exists blocked_balance numeric(12,2) not null default 0;
alter table public.wallets add column if not exists stripe_account_id text;
alter table public.wallets add column if not exists created_at timestamptz not null default now();
alter table public.wallets add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
alter table public.transactions add column if not exists mission_id uuid;
alter table public.transactions add column if not exists status public.payment_status not null default 'blocked';
alter table public.transactions add column if not exists description text;
alter table public.transactions add column if not exists stripe_payment_intent_id text;
alter table public.transactions add column if not exists created_at timestamptz not null default now();
alter table public.transactions add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
alter table public.reviews add column if not exists comment text;
alter table public.reviews add column if not exists created_at timestamptz not null default now();
alter table public.reviews add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
alter table public.messages add column if not exists read boolean not null default false;
alter table public.messages add column if not exists created_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
alter table public.notifications add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists read boolean not null default false;
alter table public.notifications add column if not exists created_at timestamptz not null default now();

commit;