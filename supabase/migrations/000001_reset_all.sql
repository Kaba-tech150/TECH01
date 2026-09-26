-- =============================================================================
-- REMISE À ZÉRO TOTALE DU SCHEMA — SECU GUARD
-- =============================================================================
--
-- ⚠️⚠️⚠️ CE FICHIER EST DESTRUCTEUR ⚠️⚠️⚠️
--
-- Il supprime TOUTES les tables du schéma public, y compris celles que je ne
-- connaîtrais pas, tous les triggers, toutes les politiques RLS, le schéma
-- private, les types énumérés, et tous les comptes utilisateurs.
--
-- À N'EXÉCUTER QUE SI VOUS VOULEZ PARTIR DE ZÉRO.
--
-- POURQUOI
--
-- La base présentait une dérive accumulée : structures de tables divergentes,
-- politiques héritées d'un ancien schéma, clés étrangères détruites en
-- cascade. Corriger à chaque fois était plus risqué que de recommencer.
--
-- PERTE DE DONNÉES
--
-- Toutes les données sont perdues. Sans impact ici : l'inscription était
-- cassée, donc aucun compte n'a jamais pu être créé.
--
-- Les COMPTES SUPABASE sont volontairement supprimés. Un compte conservé sans
-- profil resterait bloqué à l'écran « Accès indisponible » : le trigger de
-- création de profil ne se déclenche qu'à l'INSCRIPTION, jamais à la
-- reconnexion. Ces comptes seraient irrécupérables.
--
-- APRÈS CE FICHIER : relancer les migrations dans l'ordre, en commençant par
-- 20260925000100_initial_schema.sql. Voir RECONSTRUCTION_BASE.md.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Trigger d inscription pose sur auth.users
--
-- C'est LE PIEGE de cette procedure : ce trigger n'appartient pas au schema
-- public, il ne disparait donc PAS quand on supprime les tables. S'il
-- restait actif, toute inscription future echouerait en tentant d ecrire
-- dans une table qui n existe plus.
-- -----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created_secuguard on auth.users;

-- -----------------------------------------------------------------------------
-- 2. Schema private : fonctions RLS et fonctions de transition
-- -----------------------------------------------------------------------------
drop schema if exists private cascade;

-- -----------------------------------------------------------------------------
-- 3. TOUTES les tables du schema public
--
-- La liste est obtenue dynamiquement depuis pg_tables, et non codee en dur :
-- cela supprime aussi les tables inattendues, heritees d un ancien schema,
-- que je ne connais pas. C est le point cle de cette procedure.
-- -----------------------------------------------------------------------------
do $$
declare
  table_a_supprimer record;
begin
  for table_a_supprimer in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('drop table if exists public.%I cascade', table_a_supprimer.tablename);
    raise notice 'Table supprimee : %', table_a_supprimer.tablename;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Types enumeres
--
-- Chaque suppression est isolee : si un type est encore reference par erreur,
-- l echec est signale sans annuler la remise a zero deja effectuee.
-- -----------------------------------------------------------------------------
do $$
declare
  type_a_supprimer text;
begin
  foreach type_a_supprimer in array array[
    'user_role', 'mission_status', 'provider_status',
    'payment_status', 'assignment_status', 'document_type'
  ] loop
    begin
      execute format('drop type if exists public.%I cascade', type_a_supprimer);
      raise notice 'Type supprime : %', type_a_supprimer;
    exception when others then
      raise notice 'Type conserve (reference residuelle) : %', type_a_supprimer;
    end;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Comptes utilisateurs
-- -----------------------------------------------------------------------------
delete from auth.users;

commit;

-- =============================================================================
-- VERIFICATION : les 4 resultats doivent tous indiquer OK
-- =============================================================================

select
  '1. Tables restantes' as controle,
  count(*)::text as valeur,
  case when count(*) = 0 then 'OK' else 'ATTENTION' end as statut
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE';

select
  '2. Politiques RLS restantes' as controle,
  count(*)::text as valeur,
  case when count(*) = 0 then 'OK' else 'ATTENTION' end as statut
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public';

select
  '3. Trigger inscription actif' as controle,
  count(*)::text as valeur,
  case when count(*) = 0 then 'OK' else 'ATTENTION' end as statut
from pg_trigger
where not tgisinternal
  and tgname = 'on_auth_user_created_secuguard'
  and tgenabled = 'O';

select
  '4. Comptes utilisateurs restants' as controle,
  count(*)::text as valeur,
  case when count(*) = 0 then 'OK' else 'ATTENTION' end as statut
from auth.users;

-- Le schema private sera recreee par la migration 00200.