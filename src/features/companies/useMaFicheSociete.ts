import { useQuery } from '@tanstack/react-query';

import { companiesService } from '@/services';

/** Clé de cache de la fiche société du compte connecté. */
export const MA_FICHE_SOCIETE_KEY = ['companies', 'moi'] as const;

/** Clé de cache de l'équipe de la société du compte connecté. */
export const MON_EQUIPE_KEY = ['companies', 'equipe'] as const;

/**
 * Fiche société du compte connecté, ou `null` s'il n'en a pas encore.
 *
 * `null` — et non une erreur — tant qu'aucune fiche n'existe : c'est l'état de
 * départ normal, pas une panne. Un compte peut être créé avant que sa société ne
 * soit renseignée. Même traitement que `useMaFicheAgent`.
 */
export function useMaFicheSociete(userId: string | undefined) {
  return useQuery({
    queryKey: [...MA_FICHE_SOCIETE_KEY, userId],
    queryFn: () => companiesService.getMyCompanyProfile(userId as string),
    enabled: Boolean(userId),
  });
}

/**
 * Agents rattachés à la société du compte connecté.
 *
 * La liste est vide tant que la société n'existe pas : le service résout
 * `company_profiles.id` avant de lire l'équipe, et renvoie `[]` s'il est
 * absent. L'écran affiche alors « aucune équipe » plutôt qu'une erreur.
 */
export function useMonEquipe(userId: string | undefined) {
  return useQuery({
    queryKey: [...MON_EQUIPE_KEY, userId],
    queryFn: () => companiesService.getMyTeam(userId as string),
    enabled: Boolean(userId),
  });
}
