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
--   12 lignes  -> 20260926001800 EST appliquée, lecture et écriture OK
--    0 ligne   -> elle n'est PAS appliquée
--
-- LES COLONNES `INSERT` ATTENDUES (6), celles accordées par 00300 :
--
--     profile_id, certification_number, certification_expiry,
--     hourly_rate, zone, bio
--
-- `id`, `status`, `created_at` et `updated_at` doivent être ABSENTS : ils
-- n'appartiennent pas à l'agent, et les voir signifierait qu'un droit trop
-- large a été accordé.
--
-- ⚠️ CE CONTRÔLE DEMANDE LA LECTURE *ET* L'ÉCRITURE.
--
-- La première version ne demandait que les `INSERT`. Elle a donc confirmé la
-- présence des droits d'écriture tout en laissant le manque des droits de
-- LECTURE — qui était précisément la cause de l'échec, un GET renvoyant 403
-- alors que le POST aurait pu passer.
--
-- Le même message, `permission denied for table`, couvre les DEUX commandes.
-- Une demande qui n'en mesure qu'une ne peut pas conclure sur l'autre.
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
  and privilege_type in ('SELECT', 'INSERT')
group by table_name, privilege_type
order by table_name, privilege_type;
