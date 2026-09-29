import { useQuery } from '@tanstack/react-query';

import { documentsService } from '@/services';

/** Clé de cache des pièces justificatives d'un compte. */
export const DOCUMENTS_KEY = ['documents'] as const;

/**
 * Pièces justificatives du compte connecté.
 *
 * `enabled: false` tant qu'aucun identifiant n'est fourni : sans cela, la
 * requête partirait avec une chaîne vide et renverrait une erreur sans rapport
 * avec l'écran affiché. Même règle que `usePortefeuille`.
 */
export function useMesDocuments(userId: string | undefined) {
  return useQuery({
    queryKey: [...DOCUMENTS_KEY, userId],
    queryFn: () => {
      if (userId === undefined) {
        throw new Error('Aucun compte connecté.');
      }
      return documentsService.getDocuments(userId);
    },
    enabled: Boolean(userId),
  });
}
