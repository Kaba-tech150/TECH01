import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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

  return useMutation({
    mutationFn: async (input: CreateMissionInput) => {
      /*
       * VALIDATION DU JETON CÔTÉ SERVEUR — `getUser()`, PAS `getSession()`.
       *
       * L'incident du 2026-09-27 a montré pourquoi, et la différence est
       * entièrement dans le mot « local ».
       *
       * `getSession()` ne fait AUCUN appel réseau : il lit l'objet session
       * dans le stockage de l'appareil et le renvoie tel quel. Il renvoie donc
       * UN JETON PÉRIMÉ sans jamais le faire vérifier.
       *
       * Ce qui s'est passé, dans l'ordre du journal Metro :
       *
       *   1. `auth/v1/token?grant_type=password` -> 400
       *      La connexion ÉCHOUE. Le compte n'est pas confirmé.
       *   2. `getSession()` renvoie pourtant `uid=ec0617ec-…`
       *      Un objet session périmé traîne dans le stockage local.
       *   3. Le premier garde-fou, fondé sur `getSession()`, VALIDE donc à tort.
       *   4. `missions?select=*` -> 403
       *      PostgREST rejette le jeton, et retombe sur le rôle `anon`.
       *   5. `auth.uid()` vaut NULL côté base
       *      `client_id = auth.uid()` s'évalue à NULL, donc faux, donc la
       *      politique refuse la ligne.
       *
       * `getUser()`, lui, appelle `/auth/v1/user` : un jeton invalide renvoie
       * 401, et la session est réputée absente. C'est la SEULE source
       * autoritaire, et la seule qui corresponde à ce que le serveur pense
       * réellement de nous.
       *
       * Le coût est un aller-retour réseau avant chaque écriture. C'est le
       * prix à payer : un garde-fou qui laisse passer un jeton invalide coûte
       * un message serveur incompréhensible, et il a valu une journée
       * entière de diagnostic sur une base parfaitement saine.
       */
      const { data, error: erreurUser } = await supabase.auth.getUser();

      if (erreurUser || !data.user) {
        // La session locale est purifiée : sans cela, le même jeton périmé
        // continuerait de passer pour une session valide, ici et partout.
        void supabase.auth.signOut();
        throw new Error(
          'Session absente : reconnectez-vous avant de créer une mission.',
        );
      }

      const charge = {
        client_id: data.user.id,
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
      };

      /*
       * DIAGNOSTIC TEMPORAIRE — 2026-09-27. À RETIRER.
       *
       * Journalise le résultat de la VALIDATION, pas seulement la charge utile.
       * Le journal du 2026-09-27 a montré que la charge utile ne suffisait pas :
       * elle était correcte, et l'insertion a quand même échoué. Ce qui
       * manquait, c'est la réponse du serveur sur le jeton.
       */
      console.warn(
        `[SecuGuard][diag] mission — uid=${data.user.id} ` +
          `colonnes=${Object.keys(charge).sort().join(',')}`,
      );

      return missionsService.createMission(charge);
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