-- ============================================================================
-- Restauration des droits d'écriture sur les fiches prestataires
-- — 2026-09-27.
-- ============================================================================
--
-- POURQUOI CE FICHIER EXISTE
--
-- Échec observé le 2026-09-27, à la création de la PREMIÈRE fiche agent de
-- l'histoire du projet :
--
--     [SecuGuard] fiche agent — permission denied for table agent_profiles
--
-- Ce message n'est PAS une violation RLS. PostgreSQL écrit
-- « new row violates row-level security policy » quand c'est la politique qui
-- refuse, et « permission denied for table … » quand c'est un DROIT qui
-- manque. La distinction est nette, et elle désigne ici un `grant` disparu.
--
-- Le fichier `000001_reset_all.sql` a été exécuté après `00300`. Son
-- `DROP TABLE ... CASCADE` emporte les POLITIQUES et les DROITS de niveau
-- table, mais pas les fonctions en `SECURITY DEFINER` — dont le corps n'est
-- pas une dépendance suivie par PostgreSQL. C'est exactement ce mécanisme,
-- déjà établi pour la politique d'affectation (`20260926001200`).
--
-- Les politiques, elles, ont été recréées par la reconstruction : `VERIFICATION_RAPIDE`
-- ne compte que les politiques, et ne vérifie donc pas les droits. Neuf
-- contrôles au vert, et l'écriture impossible. Un contrôle qui ne compte que
-- ce qu'il attend ne peut pas voir ce qu'il n'attend pas.
--
-- CE QUE FAIT CE FICHIER
--
-- Il réaccorde EXACTEMENT les droits déclarés par `00300`, sans en ajouter un
-- seul de plus, et sans élargir aucune colonne :
--
--   agent_profiles    insert  profile_id, certification_number,
--                             certification_expiry, hourly_rate, zone, bio
--                     update  certification_number, certification_expiry,
--                             hourly_rate, zone, bio, is_available
--
--   company_profiles  insert  profile_id, company_name, siret, address, city,
--                             postal_code, description, website
--                     update  company_name, siret, address, city, postal_code,
--                             description, website
--
-- `id`, `status`, `created_at` et `updated_at` restent hors de portée : l'identité
-- et l'état d'accréditation ne s'écrivent pas depuis le client.
--
-- AUCUN DROIT SUR `anon` N'EST ACCORDÉ. Un visiteur non connecté ne gagne
-- rien : c'est le rôle `authenticated` uniquement.
--
-- IDEMPOTENT : les `grant` sont ré-accordables autant de fois que nécessaire.

begin;

-- ---------------------------------------------------------------------------
-- 1. LECTURE — LE MANQUE INITIAL, TROUVÉ LE 2026-09-27
--
-- PREMIÈRE ERREUR DE CE FICHIER : il ne réaccorde que des DROITS D'ÉCRITURE.
-- Or l'appel qui échouait était une LECTURE :
--
--     GET /rest/v1/agent_profiles?id=eq.<uuid>   -> 403
--
-- Le journal indiquait `permission denied for table agent_profiles`, ce qui
-- est la MÊME signature qu'un INSERT refusé. J'en ai conclu à un problème
-- d'écriture — à tort. Le message ne dit pas quelle commande a échoué, et
-- seul l'URL le révèle.
--
-- Le contrôle qui devait trancher ne demandait lui aussi que les `INSERT` :
-- il pouvait donc confirmer la présence d'un droit tout en laissant le manque
-- d'un autre. Un contrôle qui ne demande qu'une partie de la vérité ne peut
-- pas répondre à la question qu'on lui pose.
--
-- On restaure donc la lecture, exactement comme la migration 00300 la
-- déclarait. `grant select` sur une table qui l'a déjà ne fait rien de
-- plus : c'est idempotent.
-- ---------------------------------------------------------------------------
grant select on table public.profiles, public.profile_roles, public.agent_profiles,
  public.company_profiles, public.documents, public.missions, public.mission_assignments,
  public.wallets, public.transactions, public.reviews, public.messages,
  public.notifications, public.villes
  to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Écriture : exactement les droits déclarés par 00300, sans en ajouter un
--    de plus.
--
--    agent_profiles    insert  profile_id, certification_number,
--                              certification_expiry, hourly_rate, zone, bio
--                      update  certification_number, certification_expiry,
--                              hourly_rate, zone, bio, is_available
--
--    company_profiles  insert  profile_id, company_name, siret, address, city,
--                              postal_code, description, website
--                      update  company_name, siret, address, city, postal_code,
--                              description, website
--
-- `id`, `status`, `created_at` et `updated_at` restent hors de portée :
-- l'identité et l'état d'accréditation ne s'écrivent pas depuis le client.
--
-- AUCUN DROIT SUR `anon` N'EST ACCORDÉ.
-- ---------------------------------------------------------------------------
grant insert (profile_id, certification_number, certification_expiry, hourly_rate, zone, bio)
  on table public.agent_profiles to authenticated;
grant update (certification_number, certification_expiry, hourly_rate, zone, bio, is_available)
  on table public.agent_profiles to authenticated;

grant insert (profile_id, company_name, siret, address, city, postal_code, description, website)
  on table public.company_profiles to authenticated;
grant update (company_name, siret, address, city, postal_code, description, website)
  on table public.company_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Auto-vérification
--
-- Le contrôle porte sur la COLONNE LA PLUS RESTREINTE de chaque table :
-- `certification_number` sur l'agent, `siret` sur la société. Si la
-- réapplication est complète, ces deux-là sont réaccordées ; si elle est
-- partielle, c'est là que le manque se voit en premier.
-- ---------------------------------------------------------------------------
do $$
declare
  colonnes integer;
  tables_lisibles integer;
begin
  -- La LECTURE d'abord : c'est celle qui manquait, et celle que l'auto-
  -- vérification ne contrôlait pas. Une auto-vérification qui n'inspecte que
  -- ce qu'elle sait mesurer ne prouve que ce qu'elle sait mesurer.
  select count(*) into tables_lisibles
    from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name in ('agent_profiles', 'company_profiles')
     and grantee = 'authenticated'
     and privilege_type = 'SELECT';

  if tables_lisibles <> 2 then
    raise exception
      'ECHEC restore_provider_grants : SELECT manquant sur % des 2 tables prestataires (attendu 2)',
      tables_lisibles;
  end if;

  -- Puis l'écriture, sur les colonnes les plus restreintes.
  select count(*) into colonnes
    from information_schema.column_privileges
   where table_schema = 'public'
     and table_name = 'agent_profiles'
     and column_name in ('profile_id', 'certification_number', 'hourly_rate', 'zone', 'bio')
     and grantee = 'authenticated'
     and privilege_type = 'INSERT';

  if colonnes <> 5 then
    raise exception
      'ECHEC restore_provider_grants : INSERT sur agent_profiles = % colonnes sur 5 attendues',
      colonnes;
  end if;

  select count(*) into colonnes
    from information_schema.column_privileges
   where table_schema = 'public'
     and table_name = 'company_profiles'
     and column_name in ('profile_id', 'company_name', 'siret', 'city', 'description')
     and grantee = 'authenticated'
     and privilege_type = 'INSERT';

  if colonnes <> 5 then
    raise exception
      'ECHEC restore_provider_grants : INSERT sur company_profiles = % colonnes sur 5 attendues',
      colonnes;
  end if;
end;
$$;

commit;
