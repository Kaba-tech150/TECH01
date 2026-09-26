import { QueryClient } from '@tanstack/react-query';

/**
 * Client TanStack Query — état serveur de l'application.
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * TanStack Query était installé depuis le début mais jamais utilisé. Le
 * premier flux métier le nécessite : la liste des missions du client est une
 * donnée serveur, qui doit être rechargée après chaque création, et dont
 * l'état de chargement doit être distinct de l'état « vide ».
 *
 * Un `useState` + un `useEffect` maison donneraient trois états à gérer
 * manuellement dans chaque écran (chargement, erreur, données), et surtout
 * risquerait d'afficher une liste vide pendant le rechargement — ce qui est
 * le symptôme le plus trompeur pour un utilisateur.
 *
 * RÉGLES DE RETRY
 *
 * `retry: 1` et non 3 : la plupart des échecs sont des erreurs de
 * permission ou de validation, qui ne se corrigent pas en réessayant. Répéter
 * trois fois ne fait que retarder l'affichage du message d'erreur.
 *
 * `refetchOnWindowFocus: false` : au retour sur l'application, la liste se
 * recharge via `invalidateQueries` au moment utile, pas à chaque changement
 * de focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});