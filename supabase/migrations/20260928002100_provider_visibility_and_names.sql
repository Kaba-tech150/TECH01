-- ============================================================================
-- Les sociétés deviennent visibles par les clients, et lecture par identifiant
-- — 2026-09-28
-- ============================================================================
--
-- DEUX DÉFAUTS CORRIGÉS DANS UN SEUL FICHIER, ILS SONT LIÉS
--
-- DÉFAUT 1 — AUCUNE SOCIÉTÉ N'ÉTAIT VISIBLE PAR UN CLIENT
--
-- `20260925000300` définit, pour la lecture de `company_profiles` :
--
--   create policy "Companies can view own profile" on public.company_profiles
--     for select using (profile_id = (select auth.uid()) or private.is_admin());
--
-- Lisible par la société elle-même, ou un administrateur. **Pas par un client.**
--
-- Or `providersService.search()` interroge `company_profiles` directement :
--
--   .from('company_profiles').select(COLONNES_COMPANY)
--
-- `company_profiles` est en `force row level security` (00300, ligne 63) — le
-- propriétaire lui-même est soumis aux politiques. La requête renvoie donc
-- **zéro ligne** pour un client, sans erreur et sans journal : elle est
-- exécutée, permissions accordées, résultat vide.
--
-- CONSÉQUENCE : la recherche n'a JAMAIS affiché une société. Le test du
-- 2026-09-27 a trouvé un AGENT, et l'absence de sociétés n'a pas été remarkée
-- — on cherchait un agent, on a trouvé un agent.
--
-- C'est le défaut corrigé par `20260926001900` pour `agent_profiles`, jamais
-- repris pour `company_profiles`. La migration 01900 cite elle-même les
-- « trois interrogations sans contrôle » du projet ; celle-ci en est une
-- quatrième, et elle est née le jour même où 01900 corrigeait l'autre table.
--
-- Le plan §Acteurs prévoit que le client réserve « agents indépendants ET
-- sociétés de gardiennage ». Sans ce correctif, la moitié des prestataires
-- n'existe pas pour lui.
--
--
-- DÉFAUT 2 — LE NOM D'UN PRESTATAIRE ÉTAIT ILLISIBLE SUR UNE MISSION
--
-- `mission_assignments` ne stocke que `agent_id` ou `company_id`, un
-- identifiant métier. Le nom affiché d'un agent vit dans `profiles.full_name`,
-- et la politique `Profiles are viewable by owner or admin` ne l'ouvre qu'à
-- l'intéressé et à l'administrateur.
--
-- Il n'est donc lisible que par `liste_agents_publics`, qui filtre par TEXTE
-- et ne sait pas rendre une ligne par identifiant. Un client devait donc
-- afficher « Agent a3f8b2c1-… » sur sa mission.
--
--
-- ⚠️ POURQUOI `FORCE` SUR CES DEUX TABLES EST ESSENTIEL, ET NE LE SUPPRIMEZ PAS
--
-- Les fonctions ci-dessous sont en `SECURITY DEFINER` : elles s'exécutent avec
-- les droits du propriétaire. Sur une table SANS `force row level security`, le
-- propriétaire n'est soumis à AUCUNE politique, et la fonction renverrait donc
-- **tous** les agents, y compris `rejected` et `suspended`.
--
-- `force` est donc ce qui fait appliquer la politique à l'intérieur même de la
-- fonction. C'est l'inverse du retrait opéré par `00500` sur `missions` et
-- `mission_assignments` — là, il fallait le retirer parce qu'il cassait les
-- `SECURITY DEFINER` légitimes.
--
-- Retirer `force` d'`agent_profiles` ou de `company_profiles` ne casserait
-- aucune transition d'état : cela ouvrirait silencieusement l'annuaire à des
-- fiches rejetées. Aucun contrôle ne le verrait.
--
--
-- IDEMPOTENCE
--
-- Rejouable sans effet de bord : `create or replace`, politique supprimée avant
-- d'être recréée, retraits placés APRÈS la création — un `REVOKE` sur une
-- fonction inexistante échoue en `42883`, ce qui a déjà arrêté `02000` à sa
-- première exécution.
--
-- ⚠️ NE PAS REJOUER `20260925000300` APRÈS CE FICHIER. Il repose les deux
-- politiques de lecture.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Politique de lecture des sociétés, alignée sur celle des agents
--
--    Mêmes deux statuts que `01900` : `registered` et `validated`. Un profil
--    `rejected` n'est pas exposé, et `suspended` non plus. La validation
--    reste un acte d'administration, avec l'écran correspondant.
-- ---------------------------------------------------------------------------
drop policy if exists "Companies can view own profile" on public.company_profiles;

create policy "Companies can view own profile" on public.company_profiles
  for select using (
    profile_id = (select auth.uid())
    or private.is_admin()
    or status = 'validated'
    or status = 'registered'
  );

-- ---------------------------------------------------------------------------
-- 2. Lecture d'un prestataire par son identifiant
--
--    `p_ids` est un tableau, jamais une chaîne concaténée : il part en
--    paramètre lié, donc il ne peut pas être réécrit. Un `text[]` construit
--    par l'appelant aurait au contraire introduit exactement le risque que
--    `02000` avait écarté.
--
--    `kind` est la seule colonne ajoutée, et elle vient du nom de la table
--    interrogée : `id` est un UUID distinct dans les deux, donc il ne peut pas
--    être déduit des données.
--
--    L'UNION ALL est délibéré : `union` trierait et dédupliquerait, et `id`
--    étant unique dans chaque table, cela coûterait un tri pour rien.
-- ---------------------------------------------------------------------------
create or replace function private.prestataires_par_ids(p_ids uuid[])
returns table (
  id            uuid,
  kind          text,
  nom           text,
  statut        text,
  tarif_horaire numeric
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select ap.id,
         'agent'::text,
         coalesce(p.full_name, 'Agent sans nom'),
         ap.status::text,
         ap.hourly_rate
    from public.agent_profiles ap
    join public.profiles p on p.id = ap.profile_id
   where ap.id = any (p_ids)
  union all
  select cp.id,
         'company'::text,
         coalesce(cp.company_name, 'Société sans nom'),
         cp.status::text,
         null::numeric
    from public.company_profiles cp
   where cp.id = any (p_ids);
$fn$;

revoke all on function private.prestataires_par_ids(uuid[]) from public;
revoke all on function private.prestataires_par_ids(uuid[]) from anon;
grant execute on function private.prestataires_par_ids(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Point d'entrée public
--
--    PostgREST n'expose QUE le schéma `public`. Une fonction restée dans
--    `private` serait invisible, et l'appel échouerait en 404 — donc l'écran
--    afficherait une affectation sans nom, SILENCIEUSEMENT.
--
--    C'est la convention de `00400` et de `02000` : le travail se fait dans
--    `private`, le client n'appelle qu'un wrapper.
-- ---------------------------------------------------------------------------
create or replace function public.prestataires_par_ids(p_ids uuid[])
returns table (
  id            uuid,
  kind          text,
  nom           text,
  statut        text,
  tarif_horaire numeric
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select * from private.prestataires_par_ids(p_ids);
$fn$;

revoke all on function public.prestataires_par_ids(uuid[]) from public;
revoke all on function public.prestataires_par_ids(uuid[]) from anon;
grant execute on function public.prestataires_par_ids(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Auto-vérification
--
--    Leçon du projet : le code ne peut pas prouver son propre schéma. Ce
--    fichier échoue bruyamment si son effet est incomplet, plutôt que de
--    laisser passer un demi-correctif.
--
--    On contrôle les TROIS points, pas un seul : une politique sans fonction,
--    ou une fonction sans politique, laisserait le même défaut qu'avant avec
--    un autre symptôme.
-- ---------------------------------------------------------------------------
do $$
declare
  politique_societes integer;
  fonction_privee     integer;
  fonction_publique   integer;
begin
  select count(*) into politique_societes
    from pg_policy
   where polrelid = 'public.company_profiles'::regclass
     and polcmd = 'r';

  select count(*) into fonction_privee
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.proname = 'prestataires_par_ids';

  select count(*) into fonction_publique
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'prestataires_par_ids';

  if politique_societes <> 1 then
    raise exception
      'ECHEC prestataires_par_ids : politiques de lecture sur company_profiles = %, attendu 1',
      politique_societes;
  end if;

  if fonction_privee <> 1 or fonction_publique <> 1 then
    raise exception
      'ECHEC prestataires_par_ids : fonctions trouvees privee/public = %/%, attendu 1/1',
      fonction_privee, fonction_publique;
  end if;

  -- Une fonction absente du catalogue produit un 404 SILENCIEUX : l'écran
  -- afficherait une affectation sans nom, exactement comme avant ce fichier.
  if not has_function_privilege(
       'authenticated', 'public.prestataires_par_ids(uuid[])', 'EXECUTE') then
    raise exception
      'ECHEC prestataires_par_ids : le role authenticated ne peut pas executer la fonction publique';
  end if;
end;
$$;

commit;

