import { useQuery } from '@tanstack/react-query';
import { providersService, type Prestataire } from '@/services';
import type { RechercheCriteres } from '@/services/providers.service';

/** Clé de cache des prestataires. Les filtres en font partie. */
export function providersKey(criteres: RechercheCriteres) {
  return ['providers', criteres] as const;
}

/**
 * Prestataires correspondant aux critères.
 *
 * `staleTime` court : la disponibilité d'un agent change d'heure en heure, et
 * un cache long afficherait des prestataires déjà pris. Contrairement aux villes
 * — un référentiel administré — la liste doit être reconsultée souvent.
 */
export function usePrestataires(criteres: RechercheCriteres) {
  return useQuery({
    queryKey: providersKey(criteres),
    queryFn: () => providersService.search(criteres),
    staleTime: 60 * 1000,
  });
}

/**
 * Tri d'affichage.
 *
 * Les agents disponibles d'abord, puis les sociétés, puis les autres. Ce n'est
 * pas un choix esthétique : un agent disponible peut prendre la mission
 * immédiatement, une société suppose une négociation. Le tri va donc dans le sens
 * de ce qu'un client cherche quand il est pressé.
 */
export function trierPrestataires(liste: Prestataire[]): Prestataire[] {
  const rang = (p: Prestataire): number => {
    if (p.kind === 'agent' && p.isAvailable) return 0;
    if (p.kind === 'company') return 1;
    return 2;
  };
  return [...liste].sort((a, b) => rang(a) - rang(b));
}
