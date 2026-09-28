# ÉTAT DE LA BASE — SECU GUARD

> **Aucune migration n'est en attente.** La base est saine.
>
> Ce fichier s'appelait `MIGRATIONS_EN_ATTENTE.md` et annonçait une seule
> opération à faire, un défaut qui n'existe plus. **Son nom est conservé** car
> deux autres documents pointent vers lui ; son titre, lui, dit la vérité.
>
> **Dernière vérification réelle : 2026-09-28.**

---

## OÙ EN SOMMES-NOUS

**26 contrôles sur 26 au vert**, et `npm run check:supabase` conforme.

| Contrôle | Attendu | Obtenu | Verdict |
|---|---|---|---|
| 4 — Politiques RLS | 37 | 37 | ✅ OK |
| 12 — Politique insert affectations | 1 | 1 | ✅ OK |
| 25 — Matrice `accepted` → `in_progress`, pointages publics | — | conforme | ✅ OK |
| 26 — Clôture atomique mission + affectations | — | conforme | ✅ OK |

Les **23 migrations** de `supabase\migrations\` sont appliquées.

> ⚠️ **Un contrôle au vert ne prouve pas que l'application fonctionne.**
> Quatre défauts ont survécu à une chaîne de contrôles entièrement verte le
> 2026-09-28. Les contrôles mesurent ce que la base **contient** ; les défauts
> étaient dans ce qu'elle **fait**. Voir `RAPPORT_PROJET.md`, section
> *Problèmes rencontrés*.

---

## CE QUI A ÉTÉ FAIT LE 2026-09-28

Quatre migrations, trois défauts corrigés. **Vous n'avez rien à faire** : elles
sont déjà appliquées. Ce tableau est là pour que vous sachiez ce qui a changé.

| Fichier | Ce qu'il corrige |
|---|---|
| `20260928002100` | Les sociétés sont visibles par les clients |
| `20260928002200` | Une mission acceptée n'était plus un cul-de-sac : plus aucune transition n'en partait |
| `20260928002300` | Les pointages étaient déclarés `STABLE` — donc annoncés comme sans effet de bord — et échouaient |
| `20260928002400` | La mission et son affectation se closaient par deux gestes différents. Le client voyait « Terminée », le prestataire voyait « Acceptée » |

---

## LA SEULE CHOSE QUI RESTE

**Ce n'est plus une opération SQL.** C'est un test.

### 1. Le test automatique

Dans VS Code, copiez `.env.test.example` en `.env.test` et renseignez **trois
valeurs** : l'email et le mot de passe d'un compte client, et le mot de passe du
compte prestataire `1mama@gmail.com`.

Puis, dans le terminal :

```
npm run test:parcours
```

Il joue le parcours complet avec deux comptes réels, et **cinq cas négatifs** —
des transitions qui n'ont jamais été essayées.

⚠️ Il crée une mission par exécution. Il ne supprime rien : il n'existe pas de
politique de suppression côté client, et c'est voulu. Les missions de test
restent dans l'historique, reconnaissables au préfixe « [TEST] ».

### 2. Les écrans du parcours prestataire

Le test joue la base, **pas React Native**. Le parcours agent reste non vérifié
même si le test est vert.

---

## SI VOUS DEVEZ QUELQUE CHOSE FAIRE

Rien, en principe. Mais si une migration doit être appliquée un jour, la
procédure est la suivante — elle n'a pas changé.

1. Ouvrez `https://supabase.com/dashboard`
2. Projet **SECU GUARD** (référence `awexvvfhfzqovsvtwjfr`)
3. Menu gauche → **SQL Editor** (icône `</>`)
4. Bouton **+ New query**
5. Dans VS Code : le fichier `.sql` → ouvrir → `Ctrl + A` → `Ctrl + C`
6. Dans la zone blanche du SQL Editor → `Ctrl + V` → **Run**

✅ **Attendu :** message vert **« Success. No rows returned »**

❌ **Si vous voyez une erreur rouge :** arrêtez-vous et copiez le message
**en entier**. Chaque migration s'auto-vérifie : elle échoue volontairement si
son effet est incomplet, plutôt que de laisser passer un demi-correctif.

---

## ⚠️ NE REJOUEZ JAMAIS `000001_reset_all.sql`

Ce fichier détruit les 13 tables. Il est rangé **avant** la chaîne de
migrations, donc il s'exécute en premier par ordre alphabétique — c'est
**heureux**, pas par intention.

C'est précisément son exécution **après** `00600` qui a créé le défaut
`mission_assignments` sans politique d'insertion. Ce défaut est corrigé depuis
le 2026-09-27, mais la règle tient : tout fichier destructeur passe **AVANT** les
migrations, jamais après.

---

## VÉRIFIER L'ÉTAT ACTUEL (30 secondes)

Rejouez `supabase\verification\VERIFICATION_RAPIDE.sql` dans le SQL Editor.

✅ **Attendu :** 26 lignes, toutes en `OK`.

Puis, dans le terminal VS Code :

```
npm run check:supabase
```

✅ **Attendu :** `RESULTAT : conforme.`

---

## AVERTISSEMENT

`npm run check:supabase` prouve que la base **est en place et protégée en
lecture**. Il ne prouve **pas** que le parcours fonctionne. Un vert sur ce
script ne vaut pas validation fonctionnelle — c'est établi le 2026-09-28, où
quatre défauts ont survécu à une chaîne de contrôles entièrement verte.

---

**En cas de blocage :** copiez le nom du fichier, le message d'erreur en entier,
et la ligne mentionnée.

