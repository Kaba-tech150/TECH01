import { useQuery } from '@tanstack/react-query';
import { administrationService } from '@/services';

/** Clé de cache des statistiques de la plateforme. */
export const STATISTIQUES_KEY = ['administration', 'statistiques'] as const;

/** Clé de cache de la file de validation. */
export const DOSSIERS_KEY = ['administration', 'dossiers'] as const;

/**
 * Compteurs de la plateforme.
 *
 * `refetchInterval` est Délibérément absent.
 *
 * La maquette porte un « Live polling 2s » et une courbe de charge système : ce
 * sont des mesures d'infrastructure, pas des données métier. Interroger la base
 * toutes les deux secondes pour recompter des missions Mobile d'afficherait une
 * précision de surveillance sur des chiffres qui changent à la publication d'une
 * mission, pas à la seconde. Le rafraîchissement suit donc le geste : au retour
 * sur l'écran.
 */
export function useStatistiquesPlateforme() {
  return useQuery({
    queryKey: STATISTIQUES_KEY,
    queryFn: () => administrationService.getStatistiques(),
  });
}

/**
 * File des dossiers de validation en attente.
 *
 * Requête SÉPARÉE de celle des statistiques, et non regroupée : la file peut
 * échouer — par exemple si la migration qui l'ouvre n'est pas appliquée — sans
 * que les compteurs, eux, disparaissent. Réunies, une seule lecture en échec
 * viderait tout l'écran d'accueil.
 */
export function useDossiersEnAttente() {
  return useQuery({
    queryKey: DOSSIERS_KEY,
    queryFn: () => administrationService.getDossiersEnAttente(),
    retry: 0,
  });
}