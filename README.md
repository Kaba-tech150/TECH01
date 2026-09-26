# SecuGuard

Application mobile de mise en relation entre des clients et des prestataires de
sécurité (agents indépendants et sociétés).

React Native / Expo · Supabase (PostgreSQL, Auth, RLS) · TypeScript strict.

## Démarrage

```bash
npm install
cp .env.example .env   # puis renseigner les deux clés Supabase publiques
npm start
```

## Variables d'environnement

Seules deux variables sont nécessaires, et elles sont **publiques** :

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Ne placez jamais la clé `service_role` dans ce dépôt, ni dans l'application. Elle
est réservée à l'environnement serveur.

## Scripts

| Commande | Rôle |
|---|---|
| `npm start` | lance Expo |
| `npm run typecheck` | TypeScript, mode strict |
| `npm run lint` | ESLint sur `src/` |
| `npx eslint .` | ESLint sur tout le dépôt, `scripts/` inclus |
| `npm run check:supabase` | diagnostic de l'accès à la base, en lecture seule |

## État du projet

Le socle technique est en place : parcours de démarrage, authentification,
session persistante, routage par rôle, services et migrations SQL.

**Les migrations ne sont pas encore appliquées sur le projet Supabase distant.**
L'application affiche `Accès indisponible` tant que cette étape n'est pas faite.
La procédure pas à pas est dans
[`supabase/verification/GUIDE_APPLICATION_MIGRATIONS.md`](supabase/verification/GUIDE_APPLICATION_MIGRATIONS.md).

L'état détaillé, ce qui est vérifié et ce qui ne l'est pas, se trouve dans
[`RAPPORT_PROJET.md`](RAPPORT_PROJET.md).

## Documentation

- [`AGENTS.md`](AGENTS.md) — règles de développement et de sécurité
- [`RAPPORT_PROJET.md`](RAPPORT_PROJET.md) — état d'avancement
- [`supabase/verification/`](supabase/verification/) — guide d'application et
  contrôles de conformité

## Licence

Voir [LICENSE](LICENSE).
