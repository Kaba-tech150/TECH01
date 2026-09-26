import { z } from 'zod';

/**
 * Validation du formulaire de création de mission.
 *
 * RÈGLE DE CONCEPTION
 *
 * Le schéma valide ce que l'utilisateur saisit, et reproduit les contraintes
 * de la base pour donner un message en français. Sans cela, une erreur
 * comme `end_time > start_time` remonterait brute de PostgreSQL, sous la
 * forme d'un message technique illisible.
 *
 * La validation côté client n'est PAS une mesure de sécurité : la base
 * réapplique les mêmes contraintes (`missions_time_range_check`, `not null`).
 * Elle sert uniquement à améliorer l'expérience utilisateur.
 */

const champOptionnel = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Ce champ ne peut pas dépasser ${max} caractères`)
    .optional()
    .or(z.literal(''));

/**
 * Convertit une saisie `AAAA-MM-JJ HH:MM` en ISO 8601.
 *
 * `new Date(...)` sans suffixe `Z` interprète l'heure comme locale, ce qui est
 * le comportement voulu : l'utilisateur saisit son heure locale, la base
 * stocke de l'UTC. Le `.toISOString()` effectue la conversion.
 *
 * @returns la date en ISO, ou `null` si la saisie est inexploitable.
 */
export function versIso(valeur: string): string | null {
  const date = new Date(valeur.trim());
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export const missionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Le titre doit contenir au moins 3 caractères')
      .max(120, 'Le titre ne peut pas dépasser 120 caractères'),

    description: champOptionnel(2000),

    address: z
      .string()
      .trim()
      .min(3, "L'adresse est requise")
      .max(200, "L'adresse ne peut pas dépasser 200 caractères"),

    city: z
      .string()
      .trim()
      .min(2, 'La ville est requise')
      .max(100, 'La ville ne peut pas dépasser 100 caractères'),

    postalCode: champOptionnel(10),

    startTime: z
      .string()
      .trim()
      .min(1, 'La date et l’heure de début sont requises')
      .refine(
        (valeur) => versIso(valeur) !== null,
        'Format attendu : 2026-10-01 14:00',
      ),

    endTime: z
      .string()
      .trim()
      .min(1, 'La date et l’heure de fin sont requises')
      .refine(
        (valeur) => versIso(valeur) !== null,
        'Format attendu : 2026-10-01 18:00',
      ),

    agentCount: z
      .string()
      .trim()
      .min(1, 'Indiquez au moins un agent')
      .refine((valeur) => {
        const nombre = Number(valeur);
        return Number.isInteger(nombre) && nombre > 0;
      }, 'Le nombre d’agents doit être un entier positif'),

    budget: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((valeur) => {
        if (valeur === undefined || valeur === '') return true;
        const nombre = Number(valeur);
        return !Number.isNaN(nombre) && nombre >= 0;
      }, 'Le budget doit être un nombre positif'),

    specialRequirements: champOptionnel(2000),
  })
  .refine(
    (valeurs) => {
      const debut = versIso(valeurs.startTime);
      const fin = versIso(valeurs.endTime);
      if (!debut || !fin) return true;
      return new Date(fin).getTime() > new Date(debut).getTime();
    },
    {
      message: 'La fin de la mission doit être postérieure à son début',
      path: ['endTime'],
    },
  );

export type MissionFormValues = z.infer<typeof missionSchema>;

/** Champs remplis par défaut dans le formulaire. */
export const MISSION_FORM_DEFAULTS: MissionFormValues = {
  title: '',
  description: '',
  address: '',
  city: '',
  postalCode: '',
  startTime: '',
  endTime: '',
  agentCount: '1',
  budget: '',
  specialRequirements: '',
};

/**
 * Transforme la saisie validée en charge utile d'insertion.
 *
 * COLONNES VOLONTAIREMENT ABSENTES
 *
 * `status`, `created_at` et `updated_at` ne sont pas transmis, et c'est
 * volontaire : la migration 20260925000300 n'accorde au client que
 *
 *   grant insert (client_id, title, description, address, city, postal_code,
 *                  start_time, end_time, agent_count, budget, special_requirements)
 *
 * Mentionner `status` ferait échouer l'insertion, et forger un statut
 * autre que `draft` contournerait la matrice de transitions. La mission
 * démarre donc en brouillon, et seule la fonction serveur `publish_mission`
 * peut la publier.
 *
 * Les champs vides sont envoyés en `null` et non en chaîne vide : une
 * chaîne vide n'est pas la même valeur qu'une absence de donnée.
 */
export function versChargeUtile(valeurs: MissionFormValues) {
  return {
    title: valeurs.title.trim(),
    description: valeurs.description?.trim() || null,
    address: valeurs.address.trim(),
    city: valeurs.city.trim(),
    postalCode: valeurs.postalCode?.trim() || null,
    startTime: versIso(valeurs.startTime) as string,
    endTime: versIso(valeurs.endTime) as string,
    agentCount: Number(valeurs.agentCount),
    budget: valeurs.budget ? Number(valeurs.budget) : null,
    specialRequirements: valeurs.specialRequirements?.trim() || null,
  };
}

/** Type de la charge utile produite par `versChargeUtile`. */
export type CreateMissionInput = ReturnType<typeof versChargeUtile>;