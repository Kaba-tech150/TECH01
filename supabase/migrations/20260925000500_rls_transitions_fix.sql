-- Correctif RLS / fonctions de transition — 2026-09-25.
--
-- POURQUOI CE CORRECTIF EST NÉCESSAIRE
--
-- La migration 20260925000300 active `force row level security` sur les 12
-- tables. FORCE soumet le PROPRIÉTAIRE de la table aux politiques RLS, et pas
-- seulement les rôles anon et authenticated.
--
-- Les fonctions de la migration 20260925000400 sont en SECURITY DEFINER : elles
-- s'exécutent avec les droits du propriétaire. Sous FORCE, la politique
-- "Clients can edit own draft mission details" s'applique donc aussi à ces
-- fonctions, et sa clause WITH CHECK exige `status = 'draft'`.
--
-- Concrètement, `publish_mission` tente d'écrire status = 'published' depuis
-- une mission 'draft' : la clause WITH CHECK rejette l'écriture, et la
-- transition échoue sur une erreur de politique RLS.
--
-- POURQUOI RETIRER LE FORCE EST SÛR
--
-- Le FORCE ne protège que le propriétaire de la table. Or dans l'application,
-- les requêtes sont exécutées avec les rôles `anon` et `authenticated`, qui ne
-- sont JAMAIS le propriétaire. Pour eux, `enable row level security` suffit
-- pleinement : les politiques s'appliquent quelle que soit leur position.
--
-- Le retrait du FORCE ne modifie donc aucune des garanties vues par le client.
-- Il rend simplement les fonctions SECURITY DEFINER fonctionnelles.
--
-- Ce correctif est idempotent.
--
-- REMARQUE : ce fichier ne traite QUE les transitions d'état. Les triggers de
-- bootstrap à l'inscription (`profiles` et `wallets`) souffrent du même conflit
-- FORCE / SECURITY DEFINER ; ce correctif est complété par
-- 20260925000700_signup_triggers_fix.sql. Ne pas les confondre.

begin;

alter table public.missions no force row level security;
alter table public.mission_assignments no force row level security;

-- L'activation de la RLS est maintenue : seule la contrainte sur le
-- propriétaire est levée.
alter table public.missions enable row level security;
alter table public.mission_assignments enable row level security;

commit;
