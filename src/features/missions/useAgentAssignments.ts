import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { missionsService } from '@/services';

/**
 * Clé de cache des affectations de l'agent connecté.
 *
 * Distincte de `assignmentsKey(missionId)`, qui est celle du CLIENT. Les deux
 * portent pourtant le même préfixe : c'est volontaire, pour qu'une invalidation
 * large — par exemple après une action du client — ne puisse pas les confondre,
 * et qu'aucune ne puisse afficher les données de l'autre.
 */
export const AGENT_ASSIGNMENTS_KEY = ['assignments', 'agent'] as const;

/**
 * Affectations reçues par l'agent connecté.
 *
 * ⚠️ CETTE LECTURE INTERROGE `missions` PAR IMBRICATION, ET C'EST LE PREMIER
 * ENDROIT OÙ ELLE EST LÉGITIME.
 *
 * Le défaut du 2026-09-27 portait sur une imbrication de `profiles` — table que
 * le client ne peut pas lire, et dont il demandait des colonnes inexistantes.
 * Ici, l'agent **peut** legitimately lire la mission : `can_view_mission` lui
 * ouvre celle à laquelle il est affecté, dès le statut `pending`.
 *
 * La différence n'est pas de forme, elle est de DROIT. Une imbrication est
 * licite quand la ligne visée est lisible par le lecteur. Celle-ci l'est, et
 * celle du 27/09 ne l'était pas.
 *
 * Elle reste non exécutée : c'est le premier vrai test de ce chemin.
 */
export function useMesAffectations() {
  return useQuery({
    queryKey: AGENT_ASSIGNMENTS_KEY,
    queryFn: () => missionsService.getAgentMissions(),
  });
}

/** Ce qu'un agent répond à une demande. */
export type ReponseAffectation = 'accepter' | 'refuser';

/**
 * Accepter ou refuser une affectation.
 *
 * `accept_assignment` et `reject_assignment` sont les **deux premières
 * transitions d'état jamais exécutées** dans ce projet. Elles existent au
 * catalogue, leurs droits sont accordés, et rien n'a jamais prouvé qu'elles
 * répondent.
 *
 * L'écran ne montre le bouton d'une réponse que sur une affectation `pending` :
 * la matrice serveur refuse toute autre transition, et un bouton qui échoue
 * est pire qu'un bouton absent.
 */
export function useRepondreAffectation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      affectationId,
      reponse,
    }: {
      affectationId: string;
      reponse: ReponseAffectation;
    }) =>
      reponse === 'accepter'
        ? missionsService.acceptAssignment(affectationId)
        : missionsService.rejectAssignment(affectationId),

    onSuccess: () => {
      // SEULLE la liste de l'agent est invalidée. La liste du client ne peut
      // pas être rafraîchie depuis son téléphone : elle le sera à son prochain
      // chargement, et c'est le comportement attendu d'un écran partagé.
      void queryClient.invalidateQueries({ queryKey: AGENT_ASSIGNMENTS_KEY });
    },
  });
}
