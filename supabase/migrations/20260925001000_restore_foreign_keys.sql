-- Restauration des clés étrangères — 2026-09-26.
--
-- POURQUOI CE CORRECTIF EST NÉCESSAIRE
--
-- Les tables `public.profiles` et `public.missions` ont été supprimées
-- volontairement le 2026-09-26 pour repartir d'un schéma propre, après que
-- leurs versions héritées ait bloqué les migrations.
--
-- UNE CONSÉQUENCE A NE PAS OUBLIER
--
-- La suppression s'est faite en CASCADE. Or ces deux tables étaient
-- référencées par 10 autres tables. CASCADE a donc supprimé les CONTRAINTES
-- de clé étrangère, tout en conservant les tables qui les portaient.
--
-- Concrètement, après la suppression, `agent_profiles.profile_id` n'était
-- plus relié à `profiles`. La colonne existe, accepte n'importe quelle valeur,
-- et ne garantit plus rien. C'est un trou d'intégrité SILENCIEUX : aucune
-- erreur n'apparaît, mais la base ne protège plus ses relations.
--
-- C'est ce que répare ce fichier : les 14 clés étrangères disparues.
--
-- IDEMPOTENCE
--
-- PostgreSQL n'a pas de `add constraint if not exists`. Le bloc ci-dessous
-- vérifie donc l'existence de chaque contrainte dans `pg_constraint` avant de
-- la créer, en reconstituant le nom par défaut que PostgreSQL aurait
-- attribué (`<table>_<colonne>_fkey`). Le fichier peut être rejoué sans
-- effet de bord, et sans erreur de doublon.
--
-- Les contraintes qui n'ont PAS été perdues (celles dont la table cible
-- existe encore) sont laissées intactes : le même test les saute.
--
-- PRÉREQUIS : `20260925000100` doit avoir été relancée AVANT ce fichier, afin
-- que `public.profiles` et `public.missions` existent à nouveau.

begin;

do $$
declare
  lien record;
begin
  for lien in
    select * from (values
      -- Cibles disparues : profiles
      ('profile_roles',       'profile_id',  'profiles', 'id', 'cascade'),
      ('company_profiles',    'profile_id',  'profiles', 'id', 'cascade'),
      ('agent_profiles',      'profile_id',  'profiles', 'id', 'cascade'),
      ('documents',           'profile_id',  'profiles', 'id', 'cascade'),
      ('documents',           'verified_by', 'profiles', 'id', 'set null'),
      ('wallets',             'profile_id',  'profiles', 'id', 'cascade'),
      ('reviews',             'reviewer_id', 'profiles', 'id', 'cascade'),
      ('reviews',             'reviewee_id', 'profiles', 'id', 'cascade'),
      ('messages',            'sender_id',   'profiles', 'id', 'cascade'),
      ('notifications',       'profile_id',  'profiles', 'id', 'cascade'),
      -- Cibles disparues : missions
      ('mission_assignments', 'mission_id',  'missions',  'id', 'cascade'),
      ('transactions',        'mission_id',  'missions',  'id', 'set null'),
      ('reviews',             'mission_id',  'missions',  'id', 'cascade'),
      ('messages',            'mission_id',  'missions',  'id', 'cascade')
    ) as v(table_cible, colonne, table_cible_ref, colonne_ref, on_delete)
  loop
    if not exists (
      select 1 from pg_constraint
      where contype = 'f'
        and conrelid = ('public.' || lien.table_cible)::regclass
        and conname = lien.table_cible || '_' || lien.colonne || '_fkey'
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (%I) references public.%I(%I) on delete %s',
        lien.table_cible,
        lien.table_cible || '_' || lien.colonne || '_fkey',
        lien.colonne,
        lien.table_cible_ref,
        lien.colonne_ref,
        lien.on_delete
      );
      raise notice 'Cle etrangere restauree : %.% -> %.%',
        lien.table_cible, lien.colonne, lien.table_cible_ref;
    else
      raise notice 'Cle etrangere deja presente, ignoree : %.%',
        lien.table_cible, lien.colonne;
    end if;
  end loop;
end $$;

commit;