-- ============================================================================
-- Les fonctions de pointage ne sont pas en lecture seule — 2026-09-28
-- ============================================================================
--
-- LE SYMPTÔME
--
--   cannot execute SELECT FOR UPDATE in a read-only transaction
--   HTTP 405 sur /rest/v1/rpc/pointer_arrivee
--
-- LA CAUSE : `STABLE`
--
-- `20260928002200` a déclaré les deux wrappers publics ainsi :
--
--   create or replace function public.pointer_arrivee(...)
--   language sql
--   stable              -- ← le coupable
--   security definer
--
-- `STABLE` déclare la fonction SANS EFFET DE BORD. PostgreSQL traite alors la
-- transaction entière comme étant en lecture seule, et le
-- `SELECT ... FOR UPDATE` — qui existe précisément pour EMPÊCHER deux pointages
-- concurrents sur la même affectation — devient impossible.
--
-- PostgREST remonte alors `405`, un statut HTTP qui évoque le réseau et non une
-- déclaration de volatilité. Le message PostgreSQL, lui, est exact.
--
--
-- CE QUI A INDUIT L'ERREUR, ET C'EST UTILE DE LE DIRE
--
-- Le modèle copié était `liste_agents_publics`, qui EST `stable` — c'est
-- correct, elle ne fait que lire. Mais `accept_assignment`, juste au-dessus dans
-- `00400`, n'a PAS `stable`, et c'est bien pourquoi elle fonctionne.
--
-- `STABLE` N'EST PAS UN CHOIX ESTHÉTIQUE. C'est une promesse faite au
-- moteur : « je ne modifie rien ». Une fonction qui écrit et la tient voit sa
-- transaction passer en lecture seule, et l'appel échoue avec un statut qui ne
-- parle pas de la cause.
--
-- On vérifie donc désormais la volatilité, et plus seulement l'existence.
--
--
-- IDEMPOTENCE
--
-- `create or replace` : le fichier se rejoue sans effet de bord. Retraits
-- APRÈS la création, comme toujours — un `REVOKE` sur une fonction inexistante
-- échoue en `42883`.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Les deux wrappers publics, SANS `stable`
--
--    Volatile par défaut : c'est la valeur correcte, et on l'écrit
--    explicitement par un `volatile` plutôt que de compter sur l'absence de
--    mot-clé. Un futur lecteur qui ajouterait `stable` verrait la contradiction
--    dans le fichier même.
--
--    Le corps reste `select private.pointer_arrivee(...)`. C'est la fonction
--    INTERNE, en plpgsql, qui porte les écritures et les verrous.
-- ---------------------------------------------------------------------------
create or replace function public.pointer_arrivee(target_assignment_id uuid)
returns public.mission_status
language sql
volatile
security definer
set search_path = ''
as $$ select private.pointer_arrivee(target_assignment_id); $$;

create or replace function public.pointer_depart(
  target_assignment_id uuid,
  p_rapport text
)
returns public.assignment_status
language sql
volatile
security definer
set search_path = ''
as $$ select private.pointer_depart(target_assignment_id, p_rapport); $$;

revoke all on function public.pointer_arrivee(uuid) from public;
revoke all on function public.pointer_arrivee(uuid) from anon;
grant execute on function public.pointer_arrivee(uuid) to authenticated;

revoke all on function public.pointer_depart(uuid, text) from public;
revoke all on function public.pointer_depart(uuid, text) from anon;
grant execute on function public.pointer_depart(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Auto-vérification
--
--    On vérifie LA VOLATILITÉ, pas seulement l'existence. C'est précisément
--    ce qui manquait : les fonctions étaient présentes, accordées, en
--    `SECURITY DEFINER` — et le contrôle 25 les donnait pour bonnes.
-- ---------------------------------------------------------------------------
do $$
declare
  arrivee_volatile boolean;
  depart_volatile  boolean;
begin
  select p.provolatile = 'v' into arrivee_volatile
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'pointer_arrivee';

  select p.provolatile = 'v' into depart_volatile
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'pointer_depart';

  -- `s` = stable, `i` = immutable. Les deux interdisent d'écrire.
  if arrivee_volatile is not true then
    raise exception
      'ECHEC pointage_volatile : pointer_arrivee n est pas volatile (provolatile = %)',
      coalesce((select provolatile from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'pointer_arrivee'), 'inconnue');
  end if;

  if depart_volatile is not true then
    raise exception
      'ECHEC pointage_volatile : pointer_depart n est pas volatile';
  end if;
end;
$$;

commit;
