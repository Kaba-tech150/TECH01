import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { logTechnicalError, toUserFacingError } from '@/lib/supabase/errors';
import { missionsService } from '@/services';
import type { CreateMissionInput } from './missionSchema';

/**
 * Clé de cache des missions d'un client.
 *
 * Exportée pour que la création puisse invalider exactement la même clé.
 * Une clé dupliquée à la main dans deux fichiers finirait toujours par
 * divergir, et l'invalidation silencieusement ne fonctionnerait plus.
 */
export const CLIENT_MISSIONS_KEY = ['missions', 'client'] as const;

/**
 * Missions du client connecté.
 *
 * `isPending` distingue « chargement » de « liste vide » : sans cette
 * distinction, l'écran affiche « Aucune mission » pendant la requête, ce qui
 * laisse croire que la création a échoué.
 */
export function useClientMissions() {
  return useQuery({
    queryKey: CLIENT_MISSIONS_KEY,
    queryFn: () => missionsService.getClientMissions(),
  });
}

/**
 * Création d'une mission.
 *
 * `client_id` EST ENVOYÉ — et c'est volontaire, après un long détour.
 *
 * HISTORIQUE, à lire avant de « simplifier » ceci
 *
 * Deux essais ont échoué, et le second est instructif :
 *
 * 1. La version initiale n'envoyait pas `client_id` et la politique
 *    « Clients can create draft missions » refusait la ligne — alors que
 *    toutes les conditions de la clause WITH CHECK étaient vérifiées vraies.
 *
 * 2. La migration `20260926001400` a posé `default auth.uid()` et a retiré le
 *    droit d'écrire la colonne. L'idée était bonne : faire écrire l'identité
 *    par le serveur. **Ça n'a pas fonctionné.** Un `DEFAULT` est une
 *    expression évaluée quand PostgreSQL *prépare* l'instruction, donc dans le
 *    rôle *preparer* de PostgREST, où le jeton n'est pas encore installé :
 *    `auth.uid()` renvoyait `NULL`, et la politique comparait `client_id` à
 *    `NULL`. Refus, avec un message qui ne nomme aucune des deux raisons.
 *
 * Le correctif retenu (`20260926001600`) renverse l'approche : la colonne est à
 * nouveau remplie par le client, et un trigger `BEFORE INSERT` en
 * `SECURITY DEFINER` **écrase** la valeur par `auth.uid()`.
 *
 * CONSÉQUENCE PRATIQUE : le trigger s'exécute au moment où le jeton EST
 * disponible. C'est la seule fenêtre fiable.
 *
 * Et la valeur envoyée ici n'a AUCUNE importance : le trigger l'écrase. Le
 * client peut envoyer n'importe quoi, le serveur écrit l'identité. La
 * garantie tient à l'écriture inconditionnelle du trigger, pas à la
 * comparaisonaison d'une politique.
 *
 * La session reste donc la source : `user.id`, jamais une valeur du formulaire.
 */
export function useCreateMission() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: CreateMissionInput) => {
      /*
       * Sans session, l'insertion n'a aucune chance : le trigger refuserait
       * l'écriture faute de jeton. Mieux vaut un message clair ici qu'un
       * « vos droits ne permettent pas cette opération » trompeur.
       */
      if (!user) {
        throw new Error('Session absente : reconnectez-vous pour créer une mission.');
      }

      return missionsService.createMission({
        client_id: user.id,
        title: input.title,
        description: input.description,
        address: input.address,
        city: input.city,
        postal_code: input.postalCode,
        start_time: input.startTime,
        end_time: input.endTime,
        agent_count: input.agentCount,
        budget: input.budget,
        special_requirements: input.specialRequirements,
      });
    },
    onSuccess: () => {
      // La liste est réinvalidée, pas rechargée à la main : l'écran affiche
      // immédiatement « Chargement » puis la nouvelle mission, sans état
      // intermédiaire incohérent.
      void queryClient.invalidateQueries({ queryKey: CLIENT_MISSIONS_KEY });
    },
  });
}

/**
 * Publie une mission via la fonction serveur.
 *
 * Le statut n'est jamais écrit directement : la migration 00300 n'accorde
 * aucun droit d'écriture sur `missions.status`, et la matrice de transitions
 * vit dans `publish_mission`.
 */
export function usePublishMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (missionId: string) => missionsService.publishMission(missionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENT_MISSIONS_KEY });
    },
  });
}

/**
 * Messages d'erreur traduits pour un échec de création.
 *
 * Séparé des hooks pour que la logique d'affichage reste dans l'écran : un
 * hook ne doit pas décider de la couleur d'un bandeau.
 */
export function useMissionErrorMessage() {
  return useCallback(
    (error: unknown, action: string) => {
      logTechnicalError(action, error);
      return toUserFacingError(error, `Impossible de ${action} la mission.`).message;
    },
    [],
  );
}