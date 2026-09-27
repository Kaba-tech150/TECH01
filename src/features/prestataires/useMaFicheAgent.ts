import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { providersService, type AgentProfile } from '@/services';
import type { TableInsert, TableUpdate } from '@/types';

/** Clé de cache de la fiche agent du compte connecté. */
export const MA_FICHE_KEY = ['providers', 'moi', 'agent'] as const;

/**
 * Fiche agent du compte connecté, ou `null` s'il n'en a pas encore.
 *
 * Renvoie `null` — et non une erreur — tant qu'aucune fiche n'existe : c'est
 * l'état de départ normal, pas une panne. L'écran affiche alors un formulaire
 * de création au lieu d'un message d'erreur.
 */
export function useMaFicheAgent(userId: string | undefined) {
  return useQuery({
    queryKey: MA_FICHE_KEY,
    queryFn: () => providersService.getMyAgentProfile(userId as string),
    enabled: Boolean(userId),
  });
}

type Variables = {
  userId: string;
  fiche: AgentProfile | null;
  charge: TableInsert<'agent_profiles'> | TableUpdate<'agent_profiles'>;
};

/**
 * Crée ou met à jour la fiche agent.
 *
 * Une seule mutation pour les deux cas : l'appelant n'a pas à savoir s'il
 * crée ou s'il modifie, et l'écran n'a pas deux boutons qui divergent.
 */
export function useEnregistrerFicheAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, fiche, charge }: Variables) => {
      if (fiche) {
        await providersService.updateAgentProfile(fiche.id, charge as TableUpdate<'agent_profiles'>);
      } else {
        await providersService.createAgentProfile(charge as TableInsert<'agent_profiles'>);
      }
      return userId;
    },
    onSuccess: () => {
      // La liste des prestataires est invalidée aussi : la fiche vient de
      // changer, et la recherche doit refléter le nouveau tarif sans rechargement.
      void queryClient.invalidateQueries({ queryKey: MA_FICHE_KEY });
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });
}
