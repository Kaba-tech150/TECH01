-- ============================================================================
-- Annuaire des agents : une fonction, au lieu d'une jointure impossible
-- 2026-09-27
-- ============================================================================
--
-- LE SYMPTÔME
--
-- La recherche affiche « AUCUN PRESTATAIRE TROUVE » alors qu'une fiche agent
-- existe. Aucun filtre côté client ne l'explique : c'est la JOINTURE.
--
-- `providersService.search()` demande :
--
--   select ..., profiles!inner(full_name) from agent_profiles
--
-- `!inner` est une jointure SEMI stricte : si la ligne jointe est filtrée par
-- la RLS, la ligne mère disparaît SILENCIEUSEMENT. Aucune erreur, une liste
-- vide. C'est le pire mode de panne possible, car il est indistinguable d'un
-- résultat légitimement vide.
--
-- LA CAUSE
--
-- 00300 dit, noir sur blanc :
--
--   -- profiles : aucun profil n'est publiquement lisible.
--   create policy "Profiles are viewable by owner or admin" on public.profiles
--     for select using (id = (select auth.uid()) or private.is_admin());
--
-- Un client ne peut donc lire QUE son propre profil. La colonne `full_name` de
-- l'agent n'est pas accessible, la jointure ne joint rien, et la recherche
-- est vide POUR TOUTE VALEUR DE LA TABLE.
--
-- 01900 a rendu `agent_profiles` visible par les clients. C'était nécessaire et
-- INSUFFISANT : `agent_profiles` s'ouvrait déjà, mais `profiles` restait fermée.
-- Deux verrous successifs, et le second ne se voyait qu'à travers le premier.
--
-- LE CHOIX : NE PAS OUVRIR `profiles`
--
-- Ouvrir la table au client semblerait plus simple. Ce serait une faute.
--
-- `profiles` contient `full_name`, `phone` et `avatar_url` : la RLS travaille par
-- LIGNE, pas par colonne. Rendre la table lisible, même pour une seule
-- colonne, exposerait le numéro de téléphone de tous les utilisateurs.
--
-- On expose donc LE NOM, et rien d'autre. C'est la raison d'être du fichier.
--
-- CE QUE LA FONCTION RENVOIE
--
-- `full_name`, le seul champ d'affichage qui manque à `agent_profiles`, et RIEN
-- d'autre. Aucun téléphone, aucun avatar. Une fonction qui rendrait
-- `profiles.*` serait aussi dangereuse qu'ouvrir la table.
--
-- LE POUVOIR DE `security definer`, À CONNAÎTRE
--
-- `security definer` exécute avec les droits du PROPRIÉTAIRE, donc sans la
-- RLS. C'est ce qui rend le nom lisible. Concrètement :
--
--   - la fonction lit `profiles.full_name` pour TOUT le monde ; c'est voulu,
--     un nom n'est pas une donnée sensible, et c'est un annuaire ;
--   - elle ne rend AUCUNE autre colonne de `profiles` ;
--   - `grant execute` ne va qu'à `authenticated`, jamais à `anon` ;
--   - `set search_path = ''` : rien ne peut résoudre un objet dans un autre
--     schéma que celui cité. Convention du projet.
--
-- L'alternative — ajouter `display_name` sur `agent_profiles` — dénormalise une
-- donnée qui change à chaque renommage, et demande un trigger de plus.
--
-- LA VISIBILITÉ EST REPLIQUÉE ICI, ET ICI SEULE
--
-- 01900 a ouvert `agent_profiles` au client. Cette fonction reprend la même
-- règle, pour être correcte même si 01900 n'a pas été appliquée, et pour
-- qu'une seule réponse suffise à diagnostiquer. Deux endroits décrivent donc
-- la même règle : coût assumé, vérifié par le contrôle 20 de
-- `VERIFICATION_RAPIDE.sql`.
--
-- ⚠️ NE PAS REJOUER `20260925000300` APRÈS CE FICHIER : il repose la politique
-- de `profiles`, qui doit rester fermée au client.
--
-- IDEMPOTENT : la fonction est recréée à chaque exécution.
-- ---------------------------------------------------------------------------

begin;

-- ---------------------------------------------------------------------------
-- 1. La fonction
--
-- `p_texte` : recherche libre sur nom, zone et bio. Les trois conditions sont
-- en OU et non en ET : un terme doit se trouver dans L'UN des trois champs,
-- pas dans tous. Sinon « Paris » ne trouverait pas un agent dont la zone est
-- « Paris » et dont la bio ne mentionne pas Paris.
--
-- Le terme n'est jamais concaténé dans du SQL : il part en paramètre, que le
-- client échappe. Un terme contenant `%`, `_` ou `'` ne peut donc pas
-- transformer la requête en autre chose.
-- ---------------------------------------------------------------------------
create or replace function private.liste_agents_publics(p_texte text)
returns table (
  id                  uuid,
  profile_id          uuid,
  full_name           text,
  zone                text,
  bio                 text,
  hourly_rate         numeric,
  certification_number text,
  is_available        boolean,
  status              text
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select
    ap.id,
    ap.profile_id,
    p.full_name,
    ap.zone,
    ap.bio,
    ap.hourly_rate,
    ap.certification_number,
    ap.is_available,
    ap.status::text
  from public.agent_profiles ap
  join public.profiles p on p.id = ap.profile_id
  where p_texte is null
     or btrim(p_texte) = ''
     or p.full_name ilike '%' || p_texte || '%'
     or ap.zone      ilike '%' || p_texte || '%'
     or ap.bio       ilike '%' || p_texte || '%'
  order by p.full_name nulls last, ap.id;
$fn$;

-- L'ordre des droits est délibéré : on retire d'abord, on accorde ensuite.
-- Accorder puis retirer laisserait un privilège que le retrait final masque.
revoke all on function private.liste_agents_publics(text) from public;
revoke all on function private.liste_agents_publics(text) from anon;
grant execute on function private.liste_agents_publics(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 1 bis. Le point d'entrée public
--
-- PostgREST n'expose QUE le schéma `public`. Une fonction restée dans
-- `private` est invisible à `/rest/v1/rpc/`, et l'appel échouerait en 404 —
-- donc la recherche rendrait une liste vide, exactement comme avant.
--
-- C'est la convention de `00400` : le travail se fait dans `private`, le client
-- n'appelle qu'un wrapper dans `public`. On ne s'en écarte pas.
--
-- Le wrapper ne fait QUE déléguer. Il n'ajoute aucun droit : `security definer`
-- porte ici aussi, puisqu'il interroge `private`, inaccessible à l'appelant.
-- Il rend exactement les mêmes colonnes — le nom, et rien d'autre.
-- ---------------------------------------------------------------------------

create or replace function public.liste_agents_publics(p_texte text)
returns table (
  id                  uuid,
  profile_id          uuid,
  full_name           text,
  zone                text,
  bio                 text,
  hourly_rate         numeric,
  certification_number text,
  is_available        boolean,
  status              text
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select * from private.liste_agents_publics(p_texte);
$fn$;

-- Les retraits viennent APRÈS la création, et non avant.
--
-- BUG CORRIGÉ LE 2026-09-27, dans ce fichier même. La première version plaçait
-- les `revoke` AVANT le `create`, par réflexe de prudence. C'est impossible :
-- PostgreSQL n'a pas de `IF EXISTS` pour un `revoke` sur fonction, et
-- `REVOKE ... ON FUNCTION` sur une fonction INEXISTANTE échoue avec
--
--   ERROR: 42883: function public.liste_agents_publics(text) does not exist
--
-- La migration s'arrêtait donc à la première exécution — sur un échec qui n'a
-- rien à voir avec la fonction qu'elle cherchait à créer.
--
-- L'ordre correct est celui de la fonction `private` juste au-dessus, et il
-- est suffisant : `create or replace` CONSERVE les droits existants, donc un
-- retrait placé après agit sur la fonction nouvellement créée comme sur une
-- fonction qui préexistait. Les deux cas sont couverts.
revoke all on function public.liste_agents_publics(text) from public;
revoke all on function public.liste_agents_publics(text) from anon;

grant execute on function public.liste_agents_publics(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Vérification
--
-- Une fonction absente du catalogue produit un 404 SILENCIEUX côté client : la
-- recherche rendrait une liste vide, exactement comme avant le correctif. Ce
-- contrôle échoue donc si la fonction n'est pas installée.
--
-- Il vérifie deux choses de plus :
--
--   - qu'elle est bien `SECURITY DEFINER`, sans quoi elle ne servirait à rien ;
--   - que la politique de `profiles` est toujours là. La fonction contourne
--     cette politique : la contourner n'est légitime que si elle tient.
-- ---------------------------------------------------------------------------
do $$
declare
  n integer;
begin
  select count(*) into n
    from pg_proc pr
    join pg_namespace ns on ns.oid = pr.pronamespace
   where ns.nspname = 'private'
     and pr.proname = 'liste_agents_publics';

  if n = 0 then
    raise exception
      'ECHEC liste_agents_publics : la fonction n est pas dans le catalogue';
  end if;

  if not exists (
    select 1
      from pg_proc pr
      join pg_namespace ns on ns.oid = pr.pronamespace
     where ns.nspname = 'private'
       and pr.proname = 'liste_agents_publics'
       and pr.prosecdef
  ) then
    raise exception
      'ECHEC liste_agents_publics : la fonction n est pas SECURITY DEFINER';
  end if;

  if not exists (
    select 1
      from pg_proc pr
      join pg_namespace ns on ns.oid = pr.pronamespace
     where ns.nspname = 'public'
       and pr.proname = 'liste_agents_publics'
  ) then
    raise exception
      'ECHEC liste_agents_publics : le point d entree public est absent, PostgREST renverrait 404 et la recherche resterait vide';
  end if;

  if not exists (
    select 1
      from pg_policy po
      join pg_class c on c.oid = po.polrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'profiles'
       and po.polname = 'Profiles are viewable by owner or admin'
  ) then
    raise exception
      'ECHEC liste_agents_publics : la politique de lecture de profiles a disparu, la fonction contournerait du vide';
  end if;
end;
$$;

commit;

