-- =============================================================================
-- LISTE DES POLITIQUES RLS — SECU GUARD
-- =============================================================================
-- Pourquoi ce fichier : le contrôle 4 de VERIFICATION_RAPIDE.sql annonce
-- 38 politiques, alors que le projet n'en définit que 33 (32 dans la
-- migration 20260925000300 + 1 dans 20260925000600).
--
-- L'écart s'explique ainsi : les tables `profiles` et `missions` existaient
-- AVANT la migration 20260925000100 et portaient déjà des politiques RLS.
-- Or 20260925000300 ne supprime que les politiques qu'il nomme
-- (`drop policy if exists "Nom au policy"`) : les politiques héritées, aux
-- noms différents, ont donc SURVÉCU.
--
-- Une politique héritée peut être plus permissive que celles du projet et
-- laisser fuiter des données. Il faut donc les identifier nommément.
--
-- UTILISATION : SQL Editor > coller ce fichier ENTIER > Run.
-- Lecture seule : uniquement des SELECT.
--
-- LECTURE : les lignes marquées 'ATTENDUE' correspondent aux 33 politiques
-- du projet. Toute ligne 'A EXAMINER' est une politique héritée, dont il
-- faut vérifier la clause `using` / `with check`.
-- =============================================================================

with expected(polname) as (
  values
    -- profiles (2)
    ('Profiles are viewable by owner or admin'),
    ('Owners and admins can update profile details'),
    -- profile_roles (4)
    ('Users can view their role assignments'),
    ('Admins can add role assignments'),
    ('Admins can update role assignments'),
    ('Admins can remove role assignments'),
    -- agent_profiles (4)
    ('Agents can view own or company-linked profile'),
    ('Agents can create own pending profile'),
    ('Agents can update own profile details'),
    ('Admins can update agent profiles'),
    -- company_profiles (4)
    ('Companies can view own profile'),
    ('Companies can create own pending profile'),
    ('Companies can update own profile details'),
    ('Admins can update company profiles'),
    -- documents (3)
    ('Users can view own documents; admins can view all'),
    ('Users can submit own documents'),
    ('Admins can review documents'),
    -- missions (3)
    ('Mission participants can view mission'),
    ('Clients can create draft missions'),
    ('Clients can edit own draft mission details'),
    -- mission_assignments (2 + 1)
    ('Mission participants can view assignments'),
    ('Assigned agents can update mission reports'),
    ('Mission owners can create assignments'),
    -- wallets (1)
    ('Users can view own wallet; admins can view all'),
    -- transactions (1)
    ('Users can view own transactions; admins can view all'),
    -- reviews (3)
    ('Review participants can view reviews'),
    ('Mission participants can create valid reviews'),
    ('Review authors can edit their review'),
    -- messages (3)
    ('Mission participants can view messages'),
    ('Mission participants can send messages as themselves'),
    ('Mission participants can mark messages read'),
    -- notifications (2)
    ('Users can view own notifications'),
    ('Users can mark own notifications read')
)
select
  c.relname as table_name,
  p.polcmd as commande,
  -- `polcmd` ne contient PAS les lettres du SQL : 'a' signifie INSERT, pas 'i'.
  -- Sans cette traduction, un lecteur cherche une politique absente parce
  -- qu'il n'a pas vu les trois caracteres attendus — ce qui est exactement
  -- l'erreur commise le 2026-09-27.
  case p.polcmd
    when '*' then 'TOUTES'
    when 'r' then 'SELECT'
    when 'a' then 'INSERT'
    when 'w' then 'UPDATE'
    when 'd' then 'DELETE'
    else p.polcmd
  end as commande_lisible,
  p.polname as politique,
  case
    when p.polname in (select polname from expected) then 'ATTENDUE'
    else 'A EXAMINER'
  end as statut,
  p.polqual as clause_using,
  p.polwithcheck as clause_with_check
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
order by (p.polname not in (select polname from expected)), c.relname, p.polname;

-- Récapitulatif : combien de politiques héritées restent ?
select
  'Politiques a examiner' as controle,
  count(*)::text as valeur,
  case when count(*) = 0 then 'OK' else 'ALERTE' end as statut
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and p.polname not in (
    'Profiles are viewable by owner or admin',
    'Owners and admins can update profile details',
    'Users can view their role assignments',
    'Admins can add role assignments',
    'Admins can update role assignments',
    'Admins can remove role assignments',
    'Agents can view own or company-linked profile',
    'Agents can create own pending profile',
    'Agents can update own profile details',
    'Admins can update agent profiles',
    'Companies can view own profile',
    'Companies can create own pending profile',
    'Companies can update own profile details',
    'Admins can update company profiles',
    'Users can view own documents; admins can view all',
    'Users can submit own documents',
    'Admins can review documents',
    'Mission participants can view mission',
    'Clients can create draft missions',
    'Clients can edit own draft mission details',
    'Mission participants can view assignments',
    'Assigned agents can update mission reports',
    'Mission owners can create assignments',
    'Users can view own wallet; admins can view all',
    'Users can view own transactions; admins can view all',
    'Review participants can view reviews',
    'Mission participants can create valid reviews',
    'Review authors can edit their review',
    'Mission participants can view messages',
    'Mission participants can send messages as themselves',
    'Mission participants can mark messages read',
    'Users can view own notifications',
    'Users can mark own notifications read'
  );