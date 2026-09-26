# SecuGuard — Instructions pour les agents et les développeurs

Ce fichier est le référentiel de règles du projet. `CLAUDE.md` ne contient que
`@AGENTS.md` et pointe donc ici.

## Projet

Application mobile de mise en relation entre clients et prestataires de
sécurité. React Native / Expo, backend Supabase (PostgreSQL + Auth + RLS).

## Stack imposée

| Domaine | Choix | Interdiction |
|---|---|---|
| Framework | Expo `~57`, Expo Router | pas de React Navigation en parallèle |
| Langage | TypeScript `6` en `strict` | pas de `any`, `@ts-ignore`, `@ts-nocheck` |
| Base | Supabase JS, SQL via migrations | aucun appel SQL en dehors de `src/lib/supabase` |
| Validation | Zod `4` | pas de validation manuelle à la main |
| Style | StyleSheet + `src/constants` | pas de couleurs en dur dans les composants |
| Forms | React Hook Form | — |

## Règles de sécurité — non négociables

1. **La RLS est la barrière. Le client ne l'est pas.** `ProtectedRoute` et
   `StartupGate` ne sont qu'une aide d'interface. Ne jamais les présenter comme
   une protection.
2. **Aucune migration n'est « à peu près » appliquée.** Toute modification du
   schéma passe par un fichier dans `supabase/migrations/`, nommé
   `AAAAMMJJHHMMSS_description.sql`, idempotent, et transactionnel
   (`begin;` … `commit;`).
3. **Ne jamais exposer un message technique du serveur à l'utilisateur.**
   Utiliser `toUserFacingError()` de `src/lib/supabase/errors.ts`. Le détail
   technique reste dans les journaux. Un message PostgreSQL brut peut révéler
   l'existence d'une table, d'une politique ou d'un rôle.
4. **Les statuts passent par des fonctions serveur.** Ne jamais écrire
   `missions.status` ni `mission_assignments.status` depuis le client : utiliser
   les RPC `publish_mission`, `accept_assignment`, etc.
5. **Attention à `force row level security`.** Le `FORCE` soumet le *propriétaire*
   de la table aux politiques, donc il casse les fonctions `SECURITY DEFINER` et
   les triggers. Avant d'ajouter un `force`, vérifier ce qui écrit dans la table
   en `SECURITY DEFINER`.
6. **Ne jamais ajouter de politique `insert` sur `profiles`.** Un client
   authentifié pourrait alors forger un profil avec le rôle `admin`. Les triggers
   d'inscription suffisent.

## Vérifications obligatoires avant de dire « c'est fini »

```bash
npm run typecheck     # doit être vide
npm run lint          # doit être vide
npm run check:supabase # doit dire RESULTAT : conforme
```

`npm run lint` ne couvre que `src/`. Pour l'ensemble du dépôt, y compris
`scripts/` : `npx eslint .`.

## Diagnostic : ne pas se fier au faux vert

`scripts/check-supabase-access.js` distingue quatre situations, et il compte :

| Réponse | Signification |
|---|---|
| `acces refuse par la RLS (attendu)` | sain |
| `droits absents sur le SCHEMA public` | migration 00300 non appliquée |
| `table absente du cache PostgREST` | table inexistante |
| `fonction absente du cache PostgREST` | migration 00400 non appliquée |

Un `401` seul ne prouve **rien** : il peut signifier que la RLS protège, ou
qu'aucun droit n'a été accordé. Un test qui ne fait pas la différence ne
valide rien.

## Organisation

- `src/app` : exclusivement Expo Router, layouts et écrans
- `src/components/ui` et `src/components/common` : transverses, sans logique métier
- `src/features/<domaine>` : à créer pour la logique métier
- `src/services` : accès aux données
- `src/lib/supabase` : **seul** point d'accès à Supabase
- `src/constants` : couleurs, espacements, tailles

## Documentation

`RAPPORT_PROJET.md` est la source de vérité sur l'état d'avancement. Le mettre à
jour à chaque livraison, en distinguant explicitement ce qui est **vérifié** de
ce qui est **supposé**.

`supabase/verification/GUIDE_APPLICATION_MIGRATIONS.md` est le guide destiné au
commanditaire, écrit pour quelqu'un qui ne pratique pas le SQL.
