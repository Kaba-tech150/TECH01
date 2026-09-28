import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { providersService, type AgentProfile } from '@/services';
import type { AgentProfileInsertableFields, AgentProfileUpdatableFields } from '@/types';

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

/**
 * Passer la fiche en disponible ou en indisponible.
 *
 * MUTATION DISTINCTE DE `useEnregistrerFicheAgent`, ET VOLONTAIREMENT.
 *
 * Basculer un interrupteur ne doit pas réécrire le formulaire. Si les deux
 * passaient par la même mutation, un agent qui n'a touché qu'à son statut
 * verrait ses autres champs réécrits avec les valeurs du formulaire — dont des
 * champs qu'il a volontairement laissés vides.
 *
 * Les deux caches sont invalidés : la fiche, et la liste des prestataires, car
 * la recherche affiche le badge « Disponible ».
 */
export function useChangerDisponibilite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ficheId,
      isAvailable,
    }: {
      ficheId: string;
      isAvailable: boolean;
    }) => {
      await providersService.setDisponibilite(ficheId, isAvailable);
      return isAvailable;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MA_FICHE_KEY });
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });
}

/**
 * Les deux charges utiles viennent de `prestataireSchema`, qui est leur source
 * UNIQUE. Les déclarer ici aussi aurait permis qu'elles divergent — et c'est
 * précisément la duplication qui avait produit le bug : deux listes de
 * colonnes, dont une fausse.
 */
type Variables = {
  userId: string;
  fiche: AgentProfile | null;
  charge: AgentProfileInsertableFields | AgentProfileUpdatableFields;
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
        await providersService.updateAgentProfile(
          fiche.id,
          charge as AgentProfileUpdatableFields,
        );
      } else {
        await providersService.createAgentProfile(charge as AgentProfileInsertableFields);
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
