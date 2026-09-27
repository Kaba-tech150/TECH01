-- =============================================================================
-- ÉTAT P1 — une seule ligne par fait, un seul jeu de résultats
-- =============================================================================
--
-- POURQUOI CETTE VERSION
--
-- La version précédente renvoyait huit jeux de résultats distincts. Or le SQL
-- Editor n'affiche que le dernier : les sept autres disparaissent, et il est
-- impossible de distinguer « bloc vide » de « bloc non renvoyé ». On ne pouvait
-- donc rien conclure de ce qui venait d'être exécuté.
--
-- Ici, TOUT tient dans un seul `UNION ALL`. Une ligne par fait, et AUCUNE
-- ligne si le fait est faux. Ce qui manque se VOIT.
--
-- AUCUNE ÉCRITURE : ni INSERT, ni UPDATE, ni DELETE. Rien ne peut être cassé.
--
-- UTILISATION
--   SQL Editor > + New query > coller ce fichier ENTIER > Run
-- =============================================================================

with faits(ordre, qu_constate, valeur, statut) as (

  -- 1. La mission peut-elle être créée ? C'est LA question.
  --    0 = aucune politique ne s'applique, et PostgreSQL refuse TOUTE ligne
  --        avec exactement le message observé.
  select 1,
    'Politique INSERT sur missions',
    (select count(*)::text from pg_policy
      where polrelid = 'public.missions'::regclass and polcmd = 'a'),
    case when (select count(*) from pg_policy
      where polrelid = 'public.missions'::regclass and polcmd = 'a') >= 1
      then 'OK' else 'MANQUE' end

  -- 2. Peut-on lire les missions ? Le 403 observé vient d'ici.
  union all
  select 2,
    'Politique SELECT sur missions',
    (select count(*)::text from pg_policy
      where polrelid = 'public.missions'::regclass and polcmd = 'r'),
    case when (select count(*) from pg_policy
      where polrelid = 'public.missions'::regclass and polcmd = 'r') >= 1
      then 'OK' else 'MANQUE' end

  -- 3. Le trigger de 01600 est-il installé ? 0 = 01600 non appliquée.
  union all
  select 3,
    'Trigger client_id (migration 01600)',
    (select count(*)::text from pg_trigger
      where tgrelid = 'public.missions'::regclass
        and not tgisinternal
        and tgname = 'trg_force_mission_client_id'),
    case when (select count(*) from pg_trigger
      where tgrelid = 'public.missions'::regclass
        and not tgisinternal
        and tgname = 'trg_force_mission_client_id') = 1
      then 'OK' else 'MANQUE' end

  -- 4. `client_id` a-t-il encore le DEFAULT de 01400 ?
  --    Si oui, l'ancienne cause est toujours en place.
  union all
  select 4,
    'DEFAULT sur client_id (doit etre AUCUN apres 01600)',
    coalesce((select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'missions'
        and column_name = 'client_id'), '<<< colonne absente >>>'),
    case when (select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'missions'
        and column_name = 'client_id') is null
      then 'OK' else 'PRESENT : cause 01400 toujours active' end

  -- 5. Le statut par défaut : la politique exige 'draft'.
  union all
  select 5,
    'DEFAULT sur status',
    coalesce((select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'missions'
        and column_name = 'status'), '<<< colonne absente >>>'),
    case when (select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'missions'
        and column_name = 'status') like '%draft%'
      then 'OK' else 'PROBLEME' end

  -- 6. Le rôle authentifié a-t-il le droit d'écrire client_id ?
  union all
  select 6,
    'Droit INSERT sur client_id (authenticated)',
    (select count(*)::text from information_schema.column_privileges
      where table_schema = 'public' and table_name = 'missions'
        and column_name = 'client_id'
        and grantee = 'authenticated' and privilege_type = 'INSERT'),
    case when (select count(*) from information_schema.column_privileges
      where table_schema = 'public' and table_name = 'missions'
        and column_name = 'client_id'
        and grantee = 'authenticated' and privilege_type = 'INSERT') = 1
      then 'OK' else 'MANQUE' end

  -- 7. Peut-on lire la table ? Un 403 signifie un droit de lecture absent.
  union all
  select 7,
    'Droit SELECT sur missions (authenticated)',
    (select count(*)::text from information_schema.column_privileges
      where table_schema = 'public' and table_name = 'missions'
        and grantee = 'authenticated' and privilege_type = 'SELECT'),
    case when (select count(*) from information_schema.column_privileges
      where table_schema = 'public' and table_name = 'missions'
        and grantee = 'authenticated' and privilege_type = 'SELECT') > 0
      then 'OK' else 'MANQUE : explique le 403' end

  -- 8. La politique d'insertion, mot à mot. C'est cette phrase que
  --    l'application ne satisfait pas.
  union all
  select 8,
    'Texte de la politique INSERT',
    coalesce((select with_check from pg_policies
      where schemaname = 'public' and tablename = 'missions' and cmd = 'INSERT'),
      '<<< AUCUNE POLITIQUE INSERT >>>'),
    'lecture'

  -- 9. La RLS est-elle active ? Si elle ne l'est pas, la politique ne compte
  --    pas.
  union all
  select 9,
    'RLS active sur missions',
    (select case when relrowsecurity then 'oui' else 'NON' end
      from pg_class where oid = 'public.missions'::regclass),
    case when (select relrowsecurity from pg_class
      where oid = 'public.missions'::regclass)
      then 'OK' else 'DESACTIVEE' end
)

select ordre as "#", qu_constate as "ce_que_l_on_verifie", valeur as "valeur", statut as "verdict"
from faits
order by ordre;
