import { useQuery } from '@tanstack/react-query';
import { villesService } from '@/services';
import type { Ville } from '@/types';

/** Clé de cache du référentiel des villes, partagée par tous les appelants. */
export const VILLES_KEY = ['villes', 'actives'] as const;

/**
 * Villes actuellement desservies.
 *
 * `staleTime` long : la liste change rarement, et la recharger à chaque
 * ouverture de formulaire serait du trafic inutile. La mise à jour se fait
 * explicitement depuis l'espace d'administration.
 */
export function useVilles() {
  return useQuery({
    queryKey: VILLES_KEY,
    queryFn: () => villesService.getActiveCities(),
    // Une heure : au-delà, la liste risquerait de masquer une ville
    // récemment ouverte par l'administration.
    staleTime: 60 * 60 * 1000,
  });
}

/** Filtre une liste de villes sur une recherche libre. */
export function filtrerVilles(villes: Ville[], recherche: string): Ville[] {
  const terme = recherche.trim().toLowerCase();
  if (!terme) {
    return villes;
  }
  return villes.filter(
    (ville) =>
      ville.nom.toLowerCase().includes(terme) ||
      (ville.code_postal?.includes(terme) ?? false) ||
      (ville.region?.toLowerCase().includes(terme) ?? false),
  );
}