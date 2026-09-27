-- Sonde de diagnostic RLS — 2026-09-26. À SUPPRIMER APRÈS USAGE.
--
-- POURQUOI CE FICHIER EXISTE
--
-- Le diagnostic de la violation RLS sur `missions` est bloqué par une
-- contradiction : la politique
--
--   with check (client_id = (select auth.uid()) and status = 'draft')
--
-- est pourtant correcte, `client_id` est envoyé égal à `user.id`, le droit
-- `insert` sur `client_id` est accordé, et le défaut de `status` vaut 'draft'.
-- La ligne devrait donc être acceptée. Elle est refusée quand même.
--
-- Toute vérification faite depuis le SQL Editor est IMPRÉCISE : le rôle y est
-- `postgres`, alors que l'insertion fautive est exécutée en `authenticated`.
-- `auth.uid()` ne renvoie pas la même chose dans les deux cas, et c'est
-- précisément la variable suspecte.
--
-- Cette fonction est donc appelée DEPUIS L'APPLICATION : elle s'exécute avec
-- le jeton du joueur, dans le rôle `authenticated`, au moment exact de
-- l'échec. Elle rend visible ce que le SQL Editor ne peut pas montrer.
--
-- `SECURITY DEFINER` est nécessaire pour lire `pg_policies` et `pg_class`,
-- qui ne sont pas accessibles au rôle `authenticated`.
--
-- Elle est placée dans `public` et non dans `private` : le schéma `private`
-- n'est pas exposé par PostgREST, la fonction y serait inatteignable.
--
-- ⚠️ À SUPPRIMER dès le diagnostic terminé. Une sonde de diagnostic ne doit
-- pas rester exposée en production.

begin;

drop function if exists public.diagnostic_rls();

create or replace function public.diagnostic_rls()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'auth_uid', (select auth.uid()),
    'current_user', current_user,
    'force_rls_missions', (
      select relforcerowsecurity
        from pg_class
       where oid = 'public.missions'::regclass
    ),
    'droit_insert_table', has_table_privilege(current_user, 'public.missions', 'INSERT'),
    'droit_insert_client_id', has_column_privilege(current_user, 'public.missions', 'client_id', 'INSERT'),
    'droit_insert_status', has_column_privilege(current_user, 'public.missions', 'status', 'INSERT'),
    'defaut_status', (
      select column_default
        from information_schema.columns
       where table_schema = 'public' and table_name = 'missions'
         and column_name = 'status'
    ),
    'politiques', (
      select coalesce(
        jsonb_agg(jsonb_build_object(
          'nom', policyname,
          'permissive', permissive,
          'roles', roles,
          'cmd', cmd,
          'with_check', with_check
        ) order by cmd),
        '[]'::jsonb)
        from pg_policies
       where schemaname = 'public' and tablename = 'missions'
    ),
    'triggers', (
      select coalesce(
        jsonb_agg(jsonb_build_object('nom', tgname, 'def', pg_get_triggerdef(oid))),
        '[]'::jsonb)
        from pg_trigger
       where not tgisinternal and tgrelid = 'public.missions'::regclass
    )
  );
$$;

revoke all on function public.diagnostic_rls() from public;
grant execute on function public.diagnostic_rls() to authenticated;

commit;
