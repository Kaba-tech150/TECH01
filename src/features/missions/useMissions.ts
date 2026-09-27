import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
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
 * `client_id` est imposé ici à partir de la session, et non repris du
 * formulaire. C'est le point de sécurité du flux : même si le client
 * envoyait un autre identifiant, la politique RLS
 * « Clients can create draft missions » refuse l'insertion, et l'utilisateur
 * ne pourrait pas créer de mission au nom d'autrui.
 */
export function useCreateMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMissionInput) => {
      /*
       * `client_id` N'EST PAS ENVOYÉ.
       *
       * La colonne porte désormais la valeur par défaut `(select auth.uid())`,
       * posée par la migration `20260926001400_mission_client_id_default.sql` :
       * le serveur l'écrit à partir du jeton, et le rôle `authenticated` n'a
       * plus le droit d'écrire cette colonne.
       *
       * C'est une inversion de responsabilité délibérée. L'application
       * envoyait l'identifiant, et la RLS devait vérifier qu'il était correct
       * — ce qui bloquait la création d'une mission. Une donnée d'identité ne
       * doit pas être fournie par le client alors qu'elle est disponible, et
       * plus fiable, dans le jeton. Le rôle `authenticated` peut donc créer une
       * mission pour lui-même, et pour personne d'autre : c'est désormais
       * garanti par l'absence de droit, pas seulement par la politique.
       */
      return missionsService.createMission({
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