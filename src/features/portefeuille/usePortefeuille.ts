import { useQuery } from '@tanstack/react-query';
import { missionsService, portefeuilleService } from '@/services';

/** Clé de cache des affectations reçues par une société. */
export const COMPANY_ASSIGNMENTS_KEY = ['assignments', 'company'] as const;

/** Clé de cache du portefeuille d'un compte. */
export const PORTEFEUILLE_KEY = ['portefeuille'] as const;

/**
 * Affectations reçues par la société connectée.
 *
 * MÊME SERVICE QUE L'AGENT, AUTRE CLÉ.
 *
 * `getAgentMissions` et `getCompanyMissions` partagent la forme de retour, pas
 * la cible : le premier résout l'`agent_profiles` du compte, le second son
 * `company_profiles`. Un compte multi-rôle qui bequeille les deux espaces
 * verrait sinon la liste de l'un écraser celle de l'autre — deux clés distinctes
 * l'empêchent, et rendent impossible qu'une invalidation large les confonde.
 */
export function useMesAffectationsSociete() {
  return useQuery({
    queryKey: COMPANY_ASSIGNMENTS_KEY,
    queryFn: () => missionsService.getCompanyMissions(),
  });
}

/**
 * Portefeuille du compte connecté.
 *
 * `enabled: false` tant qu'aucun identifiant n'est fourni : sans cela, la
 * requête partirait avec une chaîne vide et renverrait une erreur sans rapport
 * avec l'écran affiché. Même règle que `useAffectationsMission`.
 */
export function usePortefeuille(userId: string | undefined) {
  return useQuery({
    queryKey: [...PORTEFEUILLE_KEY, userId],
    queryFn: () => {
      if (userId === undefined) {
        throw new Error('Aucun compte connecté.');
      }
      return portefeuilleService.getPortefeuille(userId);
    },
    enabled: Boolean(userId),
  });
}