/**
 * Déclarations de modules pour les assets importés comme modules.
 *
 * TypeScript ne sait pas, seul, qu'un `.png` est une image. Ces déclarations
 * typent le `require`/`import` statique d'un asset et renvoient un
 * `ImageSourcePropType`, utilisable tel quel dans le composant `Image`.
 *
 * `expo/types` ne déclare que les modules CSS : sans ce fichier, tout import
 * d'image échoue à la compilation TypeScript.
 */
declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';
  const content: ImageSourcePropType;
  export default content;
}

declare module '*.jpg' {
  import type { ImageSourcePropType } from 'react-native';
  const content: ImageSourcePropType;
  export default content;
}

declare module '*.jpeg' {
  import type { ImageSourcePropType } from 'react-native';
  const content: ImageSourcePropType;
  export default content;
}

declare module '*.webp' {
  import type { ImageSourcePropType } from 'react-native';
  const content: ImageSourcePropType;
  export default content;
}
