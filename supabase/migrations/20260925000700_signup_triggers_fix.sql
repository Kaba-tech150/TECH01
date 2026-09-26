-- Correctif des triggers de bootstrap à l'inscription — 2026-09-26.
--
-- POURQUOI CE CORRECTIF EST NÉCESSAIRE
--
-- L'inscription doit créer des lignes en base. Trois lignes, dans trois
-- tables, via deux triggers installés par la migration 20260925000100 :
--
--   on_auth_user_created_secuguard  (after insert on auth.users)
--       -> public.profiles       (le profil)
--       -> public.profile_roles  (le rôle initial)
--
--   on_profile_created_wallet      (after insert on public.profiles)
--       -> public.wallets        (le porte-monnaie)
--
-- Sans ces triggers, un compte Supabase existerait sans profil : l'application
-- lirait `profiles`, ne trouverait rien, et bloquerait sur « Accès indisponible ».
-- C'est donc un mécanisme central, pas un détail.
--
-- Ces deux fonctions sont en SECURITY DEFINER : elles s'exécutent avec les
-- droits du propriétaire des tables.
--
-- La migration 20260925000300 applique `force row level security` sur les
-- 12 tables. Or FORCE soumet le PROPRIÉTAIRE à ses propres politiques, ce que
-- `enable row level security` ne fait pas. Les triggers se retrouvent donc
-- soumis aux politiques suivantes, qui ne leur ouvrent aucune porte :
--
--   profiles        : select + update seulement   -> aucune politique insert
--   profile_roles   : insert réservé à is_admin() -> refus du propriétaire
--   wallets         : select seulement            -> aucune politique insert
--
-- CAS PARTICULIER DE `profile_roles` — TROUVÉ LE 2026-09-26
--
-- Sa politique d'insertion est :
--
--   create policy "Admins can add role assignments" ... for insert
--     with check (private.is_admin());
--
-- A l'inscription, `auth.uid()` vaut NULL : aucune session n'existe encore,
-- puisque le compte vient d'etre cree. `private.has_role('admin')` teste donc
-- `profile_id = auth.uid()`, c'est-a-dire `profile_id = NULL`, ce qui ne
-- correspond a aucune ligne et renvoie `false`. L'insertion est refusee.
--
-- Ce refus ne se produit QUE parce que le FORCE est actif : sans FORCE, le
-- proprietaire n'est pas soumis a cette politique.
--
-- C'est la cause exacte de l'erreur "Database error saving new user" remontee
-- le 2026-09-26. La premiere version de ce fichier ne traitait que `profiles`
-- et `wallets`, et oubliait `profile_roles`.
--
-- Les déclencheurs sont `AFTER INSERT` et s'exécutent dans la MÊME transaction
-- que la création du compte dans auth.users. Leur échec annule donc
-- l'INSCRIPTION ENTIÈRE : aucun compte ne peut être créé, et l'utilisateur
-- reçoit une erreur technique incompréhensible.
--
-- Le correctif 20260925000500 résout exactement ce mécanisme pour
-- `missions` et `mission_assignments`, mais avait oublié `profiles` et
-- `wallets`. C'est l'objet de ce fichier.
--
-- POURQUOI RETIRER LE FORCE EST SÛR
--
-- Le FORCE ne concerne que le propriétaire de la table. Or les requêtes de
-- l'application sont exécutées avec les rôles `anon` et `authenticated`, qui
-- ne sont JAMAIS le propriétaire. `enable row level security` suffit donc
-- pleinement pour eux : les politiques s'appliquent quelle que soit leur
-- position dans la base.
--
-- Le retrait du FORCE ne modifie donc AUCUNE garantie vue par le client.
--
-- NOTE DE SÉCURITÉ : on ne crée PAS de politique `insert` sur `profiles` pour
-- réparer le trigger. Une telle politique autoriserait n'importe quel client
-- authentifié à forger un profil, y compris avec le rôle `admin`. Le retrait
-- du FORCE est la seule correction qui ne dégrade pas la sécurité.
--
-- Idempotent : peut être rejoué sans effet de bord.

begin;

alter table public.profiles no force row level security;
alter table public.profile_roles no force row level security;
alter table public.wallets no force row level security;

-- L'activation de la RLS est maintenue : seule la contrainte visant le
-- propriétaire est levée.
alter table public.profiles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.wallets enable row level security;

commit;