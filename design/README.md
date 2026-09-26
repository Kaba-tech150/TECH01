# Déposez votre maquette ici

Un seul fichier, chemin absolu envoyé ensuite dans le chat.

## Ce qui fonctionne

| Format | Qualité de restitution | Comment l'obtenir |
|---|---|---|
| **PNG / JPG** | Bonne (couleurs estimées) | Capture d'écran, export Figma 1x ou 2x |
| **SVG** | Très bonne (couleurs exactes) | Export vectoriel Figma |
| **HTML + CSS** | **La meilleure** | Figma → *Copy as Code* |
| **JSON de tokens** | Excellente (palette exacte) | Variables de style Figma, ou Zeplin |
| **React / Next** | Excellente | Si votre maquette est déjà en code |

## Conseils

- **Un écran par image.** Pas une planche de 6 écrans collés : je vais mélanger les détails.
- **Export 2x** si possible, les textes et bordures deviennent plus lisibles.
- **Capturez le fond complet**, pas juste le contenu flottant.
- **Inclinez-vous pour le code** si vous l'avez : Figma *Copy as Code* me donne les vrais codes hex, et je cesse de deviner vos couleurs.

## Après réception

Je produirai d'abord `src/constants/index.ts` (tokens) et les primitives de `src/components/ui/`, pas un écran.
