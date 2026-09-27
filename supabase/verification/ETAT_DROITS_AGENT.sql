-- =============================================================================
-- DROITS D'ÉCRITURE — `agent_profiles`
-- =============================================================================
--
-- POURQUOI CE CONTRÔLE
--
-- L'écran « Ma fiche professionnelle » échoue sur :
--
--     permission denied for table agent_profiles
--
-- Ce message désigne un GRANT manquant, pas une violation RLS. Il faut donc
-- mesurer le GRANT lui-même.
--
-- LECTURE DU RÉSULTAT
--
--   agent_profiles      : SELECT (13 colonnes), INSERT (6), UPDATE (6)
--   company_profiles    : SELECT (12 colonnes), INSERT (8), UPDATE (7)
--
-- Si une ligne manque, la migration 20260926001800 n'est PAS appliquée.
--
-- LES COLONNES ATTENDUES, et elles ne se ressemblent PAS
--
-- INSERT sur agent_profiles (6 colonnes) — 00300 :
--
--     profile_id, certification_number, certification_expiry,
--     hourly_rate, zone, bio
--
-- UPDATE sur agent_profiles (6 colonnes) — 00300 :
--
--     certification_number, certification_expiry, hourly_rate,
--     zone, bio, is_available
--
-- ⚠️ `profile_id` EST ACCORDÉ À L'INSERT ET ABSENT DE L'UPDATE.
--
-- C'est l'asymétrie qui a valu une demi-journée de recherche le 2026-09-27.
-- L'écran de modification envoyait `profile_id`, que le `grant update` ne
-- couvre pas, et PostgreSQL répondait :
--
--     permission denied for table agent_profiles
--
-- Le message nomme la TABLE, jamais la colonne. Et le droit de LECTURE, lui,
-- répondait 200 : on cherchait un problème de droits alors que la lecture était
-- parfaite et que le défaut était dans la charge utile.
--
-- Contrôler le seul INSERT, comme le faisait la première version de ce fichier,
-- ne pouvait donc pas conclure sur l'UPDATE — le même message couvre les deux.
--
-- AUCUNE ÉCRITURE : ce contrôle est un SELECT pur.

select
  table_name,
  privilege_type,
  count(*)::text as nb_colonnes
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('agent_profiles', 'company_profiles')
  and grantee = 'authenticated'
  and privilege_type in ('SELECT', 'INSERT', 'UPDATE')
group by table_name, privilege_type
order by table_name, privilege_type;
