-- =============================================================================
-- DIAGNOSTIC — QUE S'EST-IL PASSÉ ? — SECU GUARD
-- =============================================================================
--
-- Constat : les tables `public.profiles` et `public.missions` ont disparu.
-- Les 10 autres tables sont intactes.
--
-- Cette requête établit l'étendue exacte des dégâts, en lecture seule.
--
-- L'hypothèse est que les deux tables ont été supprimées avec CASCADE :
-- cela explique que les tables qui les référencent (agent_profiles, documents,
-- wallets, reviews, messages, notifications) aient SURVECU tout en ayant
-- perdu leur clé étrangère.
--
-- UTILISATION : SQL Editor > coller ce fichier ENTIER > Run.
-- =============================================================================

-- 1. Quelles tables existent encore ?
select
  '1. Tables restantes' as controle,
  string_agg(table_name, ', ' order by table_name) as valeur
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE';

-- 2. Les deux tables disparues existent-elles vraiment, ou est-ce un alias ?
select
  '2. Test direct profiles' as controle,
  case when to_regclass('public.profiles') is null
       then 'ABSENTE'
       else 'PRESENTE' end as valeur
union all
select '3. Test direct missions',
  case when to_regclass('public.missions') is null
       then 'ABSENTE'
       else 'PRESENTE' end;

-- 3. Quelles clés étrangères manquent ? C'est le damage control principal.
select
  '4. Cles etrangeres restantes vers profiles/missions' as controle,
  count(*)::text as valeur,
  'ALERTE si 0 : les liens de suppression en cascade ont disparu' as detail
from pg_constraint
where contype = 'f'
  and confrelid in ('public.profiles'::regclass, 'public.missions'::regclass);

-- 4. Les tables survivantes ont-elles encore leur colonne de liaison ?
select
  '5. Colonnes de liaison' as controle,
  t.table_name || '.' || c.column_name as valeur
from information_schema.tables t
join information_schema.columns c
  on c.table_schema = t.table_schema and c.table_name = t.table_name
where t.table_schema = 'public'
  and t.table_name in ('agent_profiles','company_profiles','documents',
                       'wallets','reviews','messages','notifications')
  and c.column_name in ('profile_id','profile_id_referenced','client_id',
                        'sender_id','reviewer_id','reviewee_id','mission_id','wallet_id')
order by t.table_name, c.column_name;

-- 5. Y a-t-il encore des donnees a recuperer ?
select
  '6. Donnees restantes' as controle,
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles')::text
  || ' table profiles, '
  || (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'missions')::text
  || ' table missions' as valeur;