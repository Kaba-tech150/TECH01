-- =============================================================================
-- VÉRIFICATION POST-MIGRATION — SECU GUARD
-- =============================================================================
-- Date de création : 2026-09-25
-- Exécution : Supabase Dashboard > SQL Editor, sur le projet concerné.
--
-- AVERTISSEMENT : ce fichier est STRICTEMENT EN LECTURE SEULE.
-- Il ne contient ni CREATE, ni ALTER, ni INSERT, ni UPDATE, ni DELETE, ni GRANT.
-- Il ne peut donc pas modifier l'état de la base.
--
-- MODE D'EMPLOI
--   1. Appliquer d'abord les migrations dans cet ordre :
--        20260925000200_rls_helpers.sql
--        20260925000300_rls_policies.sql
--        20260925000400_state_transitions.sql
--        20260925000500_rls_transitions_fix.sql
--        20260925000600_assignment_insert_fix.sql
--        20260925000700_signup_triggers_fix.sql
--        20260925000900_schema_convergence.sql  (OBLIGATOIRE avant 00300)
--      (20260925000100 est DÉJÀ appliquée : ne pas la rejouer)
--
--   !! ORDRE CORRIGÉ AU 2026-09-26 !!
--   La migration 00900 DOIT être exécutée AVANT la 00300. Sur le projet
--   distant, `profiles` et `missions` préexistaient avec une structure plus
--   ancienne, et `create table if not exists` n'a rien fait pour les aligner :
--   les colonnes `phone` puis `postal_code` manquaient, ce qui faisait
--   échouer 00300 sur ses grants.
--   2. Relancer ensuite le cache de schéma PostgREST dans le SQL Editor :
--        NOTIFY pgrst, 'reload schema';
--        (cette commande se tape à la main, sans les accents graves de Markdown)
--   3. Exécuter ce fichier et lire les résultats.
--
-- Lecture : chaque contrôle renvoie STATUT = OK ou ALERTE.
-- Toute ligne ALERTE doit être traitée avant de considérer l'étape 3 terminée.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CONTRÔLE 1 — Les 12 tables attendues existent dans le schéma public
-- -----------------------------------------------------------------------------
with expected(table_name) as (
  values
    ('profiles'), ('profile_roles'), ('agent_profiles'), ('company_profiles'),
    ('documents'), ('missions'), ('mission_assignments'), ('wallets'),
    ('transactions'), ('reviews'), ('messages'), ('notifications')
)
select
  '1. Tables attendues' as controle,
  e.table_name as objet,
  case when t.table_name is null then 'ALERTE' else 'OK' end as statut,
  case when t.table_name is null
       then 'table absente du schéma public'
       else 'présente'
  end as detail
from expected e
left join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = e.table_name
order by e.table_name;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 2 — DETECTION DE DRIFT : tables du schéma public SANS RLS
-- C'est le contrôle le plus critique. Toute table listée ici est
-- potentiellement lisible par le client.
-- Résultat attendu : 0 ligne.
-- -----------------------------------------------------------------------------
select
  '2. Tables sans RLS' as controle,
  c.relname as objet,
  'ALERTE' as statut,
  'table publique sans RLS activée' as detail
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not c.relrowsecurity
order by c.relname;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 3 — RLS activée sur les 12 tables
--
-- Note sur `statut_force` : la migration 00500 retire volontairement le FORCE
-- sur `missions` et `mission_assignments`, car ce dernier bloque les fonctions
-- SECURITY DEFINER de transition d'état. Un FORCE à 'non' sur ces deux tables
-- est donc ATTENDU et n'est pas une alerte. Sur les 10 autres tables, le FORCE
-- doit être à 'oui'.
-- -----------------------------------------------------------------------------
select
  '3. RLS activée' as controle,
  c.relname as objet,
  case when c.relrowsecurity then 'OK' else 'ALERTE' end as statut_enable,
  case
    when c.relname in ('missions', 'mission_assignments')
      then case when c.relforcerowsecurity
                then 'ALERTE (FORCE encore actif, appliquer 00500)'
                else 'OK (volontairement sans FORCE)'
           end
    else case when c.relforcerowsecurity then 'OK' else 'INFO (FORCE non appliqué)'
         end
  end as statut_force
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 4 — Nombre de politiques RLS par table
-- Attendu : profiles 2, profile_roles 4, agent_profiles 4, company_profiles 4,
--           documents 3, missions 3, mission_assignments 2, wallets 1,
--           transactions 1, reviews 3, messages 3, notifications 2. Total 32.
-- -----------------------------------------------------------------------------
select
  '4. Politiques RLS' as controle,
  c.relname as table_name,
  count(p.polname) as nb_policies,
  case
    when c.relname = 'profiles' and count(p.polname) = 2 then 'OK'
    when c.relname = 'profile_roles' and count(p.polname) = 4 then 'OK'
    when c.relname = 'agent_profiles' and count(p.polname) = 4 then 'OK'
    when c.relname = 'company_profiles' and count(p.polname) = 4 then 'OK'
    when c.relname = 'documents' and count(p.polname) = 3 then 'OK'
    when c.relname = 'missions' and count(p.polname) = 3 then 'OK'
    when c.relname = 'mission_assignments' and count(p.polname) = 2 then 'OK'
    when c.relname = 'wallets' and count(p.polname) = 1 then 'OK'
    when c.relname = 'transactions' and count(p.polname) = 1 then 'OK'
    when c.relname = 'reviews' and count(p.polname) = 3 then 'OK'
    when c.relname = 'messages' and count(p.polname) = 3 then 'OK'
    when c.relname = 'notifications' and count(p.polname) = 2 then 'OK'
    else 'ALERTE'
  end as statut
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname
order by c.relname;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 5 — Permissions de table par rôle (anon ne doit avoir QUE select,
-- et uniquement sur ce qui est strictement public ; authenticated doit avoir
-- des droits limités, jamais all sur wallets/transactions).
-- -----------------------------------------------------------------------------
select
  '5. Permissions table' as controle,
  table_name,
  grantee,
  string_agg(distinct privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;

-- ALERTE manuelle attendue si :
--   - anonymous apparaît avec INSERT/UPDATE/DELETE sur une table métier
--   - authenticated apparaît avec INSERT/UPDATE/DELETE sur wallets ou transactions

-- -----------------------------------------------------------------------------
-- CONTRÔLE 6 — Vérifier que le client NE PEUT PAS écrire les colonnes sensibles
-- Colonnes qui ne doivent pas être modifiables par 'authenticated' :
--   profiles.role, profiles.email
--   missions.status
--   mission_assignments.status
--   wallets.* / transactions.*  (table entière)
-- Résultat attendu : 0 ligne.
-- -----------------------------------------------------------------------------
select
  '6. Ecriture interdite (attendu 0)' as controle,
  table_name,
  column_name,
  grantee,
  'ALERTE' as statut,
  'le client peut ecrire une colonne sensible' as detail
from information_schema.column_privileges
where table_schema = 'public'
  and grantee = 'authenticated'
  and privilege_type in ('UPDATE', 'INSERT', 'ALL')
  and (
    (table_name = 'profiles' and column_name in ('role', 'email'))
    or (table_name = 'missions' and column_name = 'status')
    or (table_name = 'mission_assignments' and column_name = 'status')
  )
order by table_name, column_name;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 7 — Fonctions de transition d'état
-- Attendu : 8 fonctions publiques accordées à authenticated, refusées à anon.
-- La lecture des droits passe par pg_proc.proacl, plus fiable que
-- has_function_privilege() qui est ambigu avec un nom de rôle en texte.
-- Valeur de droit_attribuee : 'EXECUTE' = autorisé, vide = refusé.
-- -----------------------------------------------------------------------------
select
  '7. Fonctions de transition' as controle,
  p.proname as fonction,
  coalesce((
    select 'EXECUTE'
    from pg_proc p2
    cross join lateral aclexplode(coalesce(p2.proacl, acldefault('f', p2.proowner))) acl
    where p2.oid = p.oid
      and acl.grantee = (select oid from pg_roles where rolname = 'authenticated')
      and acl.privilege_type = 'EXECUTE'
  ), 'refuse') as droit_authenticated,
  case
    when exists (
      select 1
      from pg_proc p3
      cross join lateral aclexplode(coalesce(p3.proacl, acldefault('f', p3.proowner))) acl3
      where p3.oid = p.oid
        and acl3.grantee = (select oid from pg_roles where rolname = 'anon')
        and acl3.privilege_type = 'EXECUTE'
    ) then 'ALERTE (anon ne doit pas exécuter)'
    else 'OK'
  end as statut_anon
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'publish_mission', 'cancel_mission', 'complete_mission',
    'mark_mission_paid', 'open_mission_dispute',
    'accept_assignment', 'reject_assignment', 'complete_assignment'
  )
order by p.proname;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 8 — Helpers RLS privés présents et non exécutables par anon
-- Attendu : 8 fonctions dans le schéma private (6 helpers d'origine +
-- 2 fonctions de transition ajoutées par la migration 00400).
-- Attendu : 8 lignes.
-- -----------------------------------------------------------------------------
select
  '8. Helpers privés' as controle,
  p.proname as fonction,
  case
    when exists (
      select 1
      from pg_proc p2
      cross join lateral aclexplode(coalesce(p2.proacl, acldefault('f', p2.proowner))) acl
      where p2.oid = p.oid
        and acl.grantee = (select oid from pg_roles where rolname = 'anon')
        and acl.privilege_type = 'EXECUTE'
    ) then 'ALERTE (anon ne doit pas exécuter)'
    else 'OK'
  end as statut_anon
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'private'
  and p.proname in (
    'has_role', 'is_admin', 'can_view_mission',
    'can_view_assignment', 'is_assignment_agent', 'can_review_mission',
    'transition_mission', 'transition_assignment'
  )
order by p.proname;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 9 — Valeurs des enums (le contrat TypeScript doit correspondre)
-- Attendu : mission_status contient bien 'paid'.
-- -----------------------------------------------------------------------------
select
  '9. Enums' as controle,
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' order by e.enumsortorder) as valeurs
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
group by t.typname
order by t.typname;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 10 — Triggers de mise à jour de updated_at et triggers de création
-- de profil / wallet. Comportement attendu : 9 triggers de updated_at
-- (profiles, agent_profiles, company_profiles, documents, missions,
--  mission_assignments, wallets, transactions, reviews)
--
-- ATTENTION : ce contrôle ne liste QUE les triggers de `public`. Le trigger
-- d'inscription `on_auth_user_created_secuguard` est porté par `auth.users`
-- et n'apparaît donc pas ici. Il est vérifié par le CONTRÔLE 15.
--
-- Le trigger `on_profile_created_wallet` EST visible ici, puisqu'il est porté
-- par `public.profiles`.
-- -----------------------------------------------------------------------------
select
  '10. Triggers' as controle,
  c.relname as table_name,
  tg.tgname as trigger_name,
  tg.tgenabled::text as etat,
  case
    when tg.tgenabled = 'O' then 'OK'
    when tg.tgenabled = 'D' then 'OK (désactivé localement, actif en prod)'
    else 'ALERTE (désactivé)'
  end as statut
from pg_trigger tg
join pg_class c on c.oid = tg.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not tg.tgisinternal
order by c.relname, tg.tgname;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 11 — Index créés sur les colonnes clés
-- Attendu : au minimum 19 index. Une valeur très inférieure signale que la
-- migration 20260925000100 n'a pas été appliquée intégralement.
-- -----------------------------------------------------------------------------
select
  '11. Index' as controle,
  count(*) as nb_index_sur_tables_public,
  case when count(*) >= 19 then 'OK' else 'ALERTE' end as statut
from pg_indexes
where schemaname = 'public';

-- -----------------------------------------------------------------------------
-- CONTRÔLE 12 — RÉCAPITULATIF
-- Si des alertes subsistent, ne pas considérer l'étape 3 comme terminée.
-- -----------------------------------------------------------------------------
select
  '12. RECAP' as controle,
  'tables sans RLS' as item,
  count(*) as valeur,
  case when count(*) = 0 then 'OK' else 'ALERTE' end as statut
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
union all
select
  '12. RECAP', 'politiques RLS totales',
  count(*),
  case when count(*) = 32 then 'OK' else 'ALERTE' end
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
union all
select
  '12. RECAP', 'tables public sans RLS et sans policy (risque)',
  count(*),
  case when count(*) = 0 then 'OK' else 'ALERTE' end
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not c.relrowsecurity
  and not exists (select 1 from pg_policy p where p.polrelid = c.oid);

-- -----------------------------------------------------------------------------
-- CONTRÔLE 13 — Rôle d'exécution et BYPASSRLS
-- Les fonctions de transition (migration 00400) sont en SECURITY DEFINER.
-- Elles s'exécutent avec les droits du propriétaire de la table.
-- Si ce rôle ne dispose pas de BYPASSRLS et que FORCE RLS est actif,
-- les politiques RLS s'appliquent à ces fonctions et les transitions échouent.
-- Ce contrôle ne doit pas être ignoré.
-- -----------------------------------------------------------------------------
select
  '13. Role et BYPASSRLS' as controle,
  current_user as role_courant,
  r.rolsuper as est_superutilisateur,
  r.rolbypassrls as possede_bypassrls,
  case
    when r.rolbypassrls or r.rolsuper then 'OK'
    else 'ALERTE : appliquer 20260925000500_rls_transitions_fix.sql'
  end as statut
from pg_roles r
where r.rolname = current_user;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 14 — État du FORCE RLS sur missions et mission_assignments
-- Valeur attendue après le correctif 00500 : false (no force), tout en gardant
-- relrowsecurity = true.
-- -----------------------------------------------------------------------------
select
  '14. FORCE RLS missions' as controle,
  c.relname as objet,
  c.relrowsecurity as rls_activee,
  c.relforcerowsecurity as rls_forcee,
  case
    when c.relname in ('missions', 'mission_assignments')
         and c.relforcerowsecurity then 'ALERTE : appliquer le correctif 00500'
    when not c.relrowsecurity then 'ALERTE : RLS desactivee'
    else 'OK'
  end as statut
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('missions', 'mission_assignments')
order by c.relname;


-- -----------------------------------------------------------------------------
-- CONTRÔLE 15 — Triggers de bootstrap à l'inscription
--
-- Ces triggers sont ABSENTS de la table publique `auth.users` : ils sont donc
-- invisibles au CONTRÔLE 10, qui filtre sur `n.nspname = 'public'`.
--
-- Ils doivent exister et être ACTIFS, sinon l'inscription crée un compte sans
-- profil : l'application bloque alors sur « Accès indisponible » pour tout
-- nouvel utilisateur.
--
-- Attendu : 2 lignes, toutes en 'OK'.
--   on_auth_user_created_secuguard  (sur auth.users)     -> profiles + profile_roles
--   on_profile_created_wallet      (sur public.profiles) -> wallets
--
-- Les deux tables sont interrogées, car les triggers ne sont pas portés par la
-- même relation.
-- -----------------------------------------------------------------------------
select
  '15. Triggers inscription' as controle,
  n.nspname || '.' || c.relname as sur_table,
  tg.tgname as trigger_name,
  tg.tgenabled::text as etat,
  case
    when tg.tgenabled = 'O' then 'OK'
    when tg.tgenabled = 'D' then 'ALERTE (désactivé localement)'
    else 'ALERTE (état ' || tg.tgenabled::text || ')'
  end as statut
from pg_trigger tg
join pg_class c on c.oid = tg.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not tg.tgisinternal
  and tg.tgname in ('on_auth_user_created_secuguard', 'on_profile_created_wallet')
order by tg.tgname;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 16 — Le client NE PEUT PAS écrire un profil lui-même
--
-- Contre-mesure directe du CONTRÔLE 15. Si `authenticated` avait un droit
-- d'insertion sur `profiles`, un attaquant pourrait forger un profil avec le
-- rôle `admin`. On ne doit donc trouver NI droit de table NI droit de colonne.
--
-- Résultat attendu : 0 ligne.
-- -----------------------------------------------------------------------------
select
  '16. Fausse inscription profil (attendu 0)' as controle,
  table_name,
  column_name,
  privilege_type,
  'ALERTE' as statut,
  'le client peut creer un profil, donc forger un role' as detail
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'profiles'
  and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'ALL')
union all
select
  '16. Fausse inscription profil (attendu 0)',
  table_name,
  null,
  privilege_type,
  'ALERTE',
  'le client peut creer un profil, donc forger un role'
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'profiles'
  and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'ALL');


-- -----------------------------------------------------------------------------
-- CONTRÔLE 17 — Dérive de structure : `profiles` doit avoir toutes ses colonnes
--
-- Ce contrôle existe parce qu'un incident réel s'est produit le 2026-09-26.
-- La table `profiles` existait déjà sur le projet distant, avec une structure
--plus ancienne. La migration 00100 l'a recréée avec `create table if not
-- exists`, instruction SANS EFFET sur une table déjà présente : la colonne
-- `phone` manquait donc, et la migration 00300 échouait ensuite sur
-- `grant update (full_name, phone, ...)`.
--
-- Résultat attendu : 0 ligne manquante. Toute ligne signifie que 00100 n'a
-- pas convergé et qu'une migration applicative échouera.
-- -----------------------------------------------------------------------------
with expected(column_name) as (
  values
    ('id'), ('email'), ('full_name'), ('phone'),
    ('role'), ('avatar_url'), ('created_at'), ('updated_at')
)
select
  '17. Colonnes profiles' as controle,
  e.column_name as colonne_manquante,
  'ALERTE' as statut,
  'absente de public.profiles : les grants et policies qui la citent echoueront' as detail
from expected e
where not exists (
  select 1
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'profiles'
    and c.column_name = e.column_name
)
order by e.column_name;

-- -----------------------------------------------------------------------------
-- CONTRÔLE 18 — Colonnes réelles de `profiles`
--
-- Sert de référence pour comparer avec le CONTRÔLE 17. Permet de voir
-- l'étendue exacte de la dérive plutôt que de supposer.
--
-- Une colonne `phone` absente ici mais présente au contrôle 18 (ou l'inverse)
-- signale un schéma en cours de correction.
-- -----------------------------------------------------------------------------
select
  '18. Structure profiles' as controle,
  c.column_name,
  c.data_type,
  c.is_nullable,
  case
    when c.column_default is not null then 'defaut'
    else 'sans defaut'
  end as valeur_par_defaut
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'profiles'
order by c.ordinal_position;


-- -----------------------------------------------------------------------------
-- CONTRÔLE 19 — FORCE RLS sur les trois tables écrites à l'inscription
--
-- Les triggers de bootstrap écrivent dans `profiles`, `profile_roles` et
-- `wallets`. Sous `force row level security`, ces écritures sont refusées :
-- l'inscription échoue alors entièrement avec le message trompeur
-- « Database error saving new user ».
--
-- Le FORCE doit donc être absent sur ces trois tables, et l'ENABLE présent.
-- Contrôle corrélé au CONTRÔLE 15 : sans trigger actif, ce contrôle n'a pas
-- de portée.
--
-- Résultat attendu : 3 lignes, toutes en 'OK'.
-- -----------------------------------------------------------------------------
select
  '19. FORCE RLS inscription' as controle,
  c.relname as table_name,
  c.relrowsecurity as rls_activee,
  c.relforcerowsecurity as rls_forcee,
  case
    when c.relname in ('profiles', 'profile_roles', 'wallets')
         and c.relforcerowsecurity
      then 'ALERTE : appliquer 20260925000700_signup_triggers_fix.sql'
    when not c.relrowsecurity then 'ALERTE : RLS desactivee'
    else 'OK'
  end as statut
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles', 'profile_roles', 'wallets')
order by c.relname;


-- =============================================================================
-- FIN DU FICHIER DE VÉRIFICATION
-- Si les contrôles 2, 6, 12, 15, 16, 17 ou 19 renvoient une ALERTE, la base
-- n'est pas conforme.
-- =============================================================================

