-- Référentiel des villes desservies — 2026-09-26.
--
-- POURQUOI UNE TABLE
--
-- La zone de couverture de l'application grandit progressivement. Saisir la
-- ville en texte libre produit deux défauts immédiats :
--
--   1. des fautes de frappe qui empêchent toute correspondance ("Saint
--      Denis" / "Saint-Denis" / "saint denis"), donc aucune recherche ne
--      fonctionne ensuite ;
--   2. des missions créées là où l'application ne couvre rien, donc
--      impossibles à pourvoir.
--
-- Une liste fermée, administrée, règle les deux points d'un coup : la saisie
-- disparaît au profit d'une sélection, et l'administrateur n'ouvre une ville
-- que lorsqu'il a la capacité de la desservir.
--
-- MODÈLE DE DONNÉES
--
-- `nom` porte une contrainte d'unicité : c'est la clé naturelle, celle que
-- l'utilisateur reconnaît. `active` permet de retirer une ville de la liste
-- SANS supprimer l'historique : les missions passées restent lisibles, et le
-- nom affiché ne bouge pas.
--
-- ORDRE D'EXÉCUTION — NE PAS INVERSER
--
-- L'insertion des villes précède délibérément l'activation de la RLS.
-- C'est le piège exact déjà rencontré deux fois sur ce projet :
--
--   force row level security soumet le PROPRIÉTAIRE à ses propres politiques.
--   Aucune politique `insert` n'existe à ce stade, l'insertion des villes
--   serait donc refusée, et la migration entière échouerait.
--
-- L'ordre correct est : créer la table, la remplir, puis seulement activer la
-- RLS. C'est aussi l'ordre le plus sûr à rejouer.
--
-- Les villes ci-dessous sont un EXEMPLE. Le pays de lancement n'est pas
-- confirmé : cette liste doit être ajustée avant toute mise en production.

begin;

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------
create table if not exists public.villes (
  id uuid primary key default extensions.gen_random_uuid(),
  nom text not null unique check (char_length(trim(nom)) > 0),
  code_postal text,
  region text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Jeu initial
--
-- À RÉVISER : liste d'exemple, le pays de lancement reste à confirmer.
-- `on conflict do nothing` rend l'opération rejouable.
-- ---------------------------------------------------------------------------
insert into public.villes (nom, code_postal, region) values
  ('Paris',        '75001', 'Île-de-France'),
  ('Marseille',    '13001', 'Provence-Alpes-Côte d’Azur'),
  ('Lyon',         '69001', 'Auvergne-Rhône-Alpes'),
  ('Toulouse',     '31000', 'Occitanie'),
  ('Bordeaux',     '33000', 'Nouvelle-Aquitaine'),
  ('Nantes',       '44000', 'Pays de la Loire'),
  ('Lille',        '59000', 'Hauts-de-France'),
  ('Strasbourg',   '67000', 'Grand Est')
on conflict (nom) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Index
-- ---------------------------------------------------------------------------
create index if not exists idx_villes_nom on public.villes(nom);
create index if not exists idx_villes_active on public.villes(active) where active;

-- Trigger de mise à jour, créé par 00100 sur les autres tables.
-- PostgreSQL ne vérifie pas le droit EXECUTE sur une fonction de trigger :
-- seul le propriétaire déclencheur est contrôlé, à la création.
drop trigger if exists set_villes_updated_at on public.villes;
create trigger set_villes_updated_at before update on public.villes
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. RLS — activée APRES l'insertion, jamais avant
-- ---------------------------------------------------------------------------
alter table public.villes enable row level security;
alter table public.villes force row level security;

-- Lecture : la liste des villes actives est commune à tous les comptes.
-- Les villes désactivées restent visibles des seuls administrateurs, afin de
-- pouvoir vérifier une désactivation sans risquer de la contourner.
drop policy if exists "Villes actives lisibles par tous" on public.villes;
create policy "Villes actives lisibles par tous" on public.villes for select
  using (active or private.is_admin());

-- Écriture : réservée à l'administrateur. Un client ne peut ni créer une
-- ville, ni en réactiver une, ce qui ferait mentir la couverture réelle.
drop policy if exists "Admins can create villes" on public.villes;
create policy "Admins can create villes" on public.villes for insert
  with check (private.is_admin());

drop policy if exists "Admins can update villes" on public.villes;
create policy "Admins can update villes" on public.villes for update
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists "Admins can delete villes" on public.villes;
create policy "Admins can delete villes" on public.villes for delete
  using (private.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Droits d'accès
--
-- `anon` n'obtient RIEN : la liste n'est utile qu'à un compte connecté, et le
-- projet applique la règle « anon ne lit rien ».
--
-- Les colonnes accordées à l'administrateur sont explicitement listées, afin
-- qu'il ne puisse pas réécrire `created_at`.
-- ---------------------------------------------------------------------------
revoke all on table public.villes from anon, authenticated;

grant select on table public.villes to authenticated;
grant insert (nom, code_postal, region) on table public.villes to authenticated;
grant update (nom, code_postal, region, active) on table public.villes to authenticated;
grant delete on table public.villes to authenticated;

commit;