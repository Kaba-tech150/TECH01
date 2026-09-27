/**
 * Validation de la fiche prestataire.
 *
 * CE SCHÉMA REPRODUIT LES CONTRAINTES DE LA BASE — il ne les invente pas.
 *
 * La politique « Agents can create own pending profile » impose :
 *
 *     with check (profile_id = auth.uid()
 *                 and company_id is null
 *                 and status = 'registered')
 *
 * et la politique « Companies can create own pending profile » :
 *
 *     with check (profile_id = auth.uid() and status = 'registered')
 *
 * `profile_id` vient de la session, jamais du formulaire. `company_id` et
 * `status` ne sont jamais envoyés : la colonne `status` n'est pas dans le
 * `grant insert` de 00300, et la laisser par défaut évite une erreur dont le
 * message ne dit pas la cause.
 */
import { z } from 'zod';

/*
 * Les deux contrats de colonnes vivent dans `src/types`, à côté de
 * `MissionUpdatableFields` : ce sont des traductions de `grant`, et ils
 * doivent être lus à côté des `grant` qu'ils reproduisent.
 *
 * Le fait de les déclarer dans ce fichier, auprès du formulaire, aurait permis
 * qu'ils divergent du `grant` sans que rien le remarque — ce qui est
 * précisément arrivé le 2026-09-27.
 */
import type {
  AgentProfileInsertableFields,
  AgentProfileUpdatableFields,
} from '@/types';

export type {
  AgentProfileInsertableFields,
  AgentProfileUpdatableFields,
};

/** Champs libres de la fiche agent. */
export const agentProfileSchema = z.object({
  zone: z
    .string()
    .trim()
    .min(2, 'Indiquez au moins une zone d’intervention')
    .max(120, 'La zone ne peut pas dépasser 120 caractères'),

  bio: z
    .string()
    .trim()
    .max(2000, 'La présentation ne peut pas dépasser 2000 caractères')
    .optional()
    .or(z.literal('')),

  hourlyRate: z
    .string()
    .trim()
    .refine(
      (valeur) => valeur === '' || (!Number.isNaN(Number(valeur)) && Number(valeur) >= 0),
      'Le tarif doit être un nombre positif',
    )
    .optional()
    .or(z.literal('')),

  certificationNumber: z
    .string()
    .trim()
    .max(60, 'Le numéro ne peut pas dépasser 60 caractères')
    .optional()
    .or(z.literal('')),
});

export type AgentProfileValues = z.infer<typeof agentProfileSchema>;

/** Valeurs initiales du formulaire. */
export const AGENT_PROFILE_DEFAULTS: AgentProfileValues = {
  zone: '',
  bio: '',
  hourlyRate: '',
  certificationNumber: '',
};

/**
 * Colonnes acceptées à l'INSERT : `profile_id` est accordée.
 *
 * C'est la CONTREPARTIE EXACTE des `grant` de 00300 :
 *
 *   INSERT (profile_id, certification_number, certification_expiry,
 *           hourly_rate, zone, bio)
 *   UPDATE (certification_number, certification_expiry, hourly_rate,
 *           zone, bio, is_available)
 *
 * `profile_id` est dans la première liste et PAS dans la seconde. C'est tout
 * l'objet de ce module.
 *
 * BUG CORRIGÉ LE 2026-09-27. Une seule fonction renvoyait la MÊME charge
 * utile pour la création et pour la modification, `profile_id` compris.
 *
 * Résultat : la fiche se CRÉAIT sans problème, et toute MODIFICATION
 * renvoyait `permission denied for table agent_profiles` — parce que la
 * charge utile contenait une colonne sans droit. Le message ne nomme pas la
 * colonne fautive, et le `SELECT` répondait 200 : on cherchait un problème
 * de lecture alors que la lecture marchait parfaitement.
 *
 * Deux fonctions distinctes, et non une fonction paramétrée : la différence
 * est structurelle, et un paramètre serait une nouvelle occasion de se
 * tromper.
 */

/** Charge utile de CRÉATION. `profile_id` vient de la session. */
export function versChargeCreation(
  valeurs: AgentProfileValues,
  userId: string,
): AgentProfileInsertableFields {
  return {
    profile_id: userId,
    zone: valeurs.zone.trim(),
    bio: valeurs.bio?.trim() ? valeurs.bio.trim() : null,
    hourly_rate: valeurs.hourlyRate?.trim() ? Number(valeurs.hourlyRate.trim()) : null,
    certification_number: valeurs.certificationNumber?.trim()
      ? valeurs.certificationNumber.trim()
      : null,
  };
}

/**
 * Charge utile de MODIFICATION.
 *
 * `profile_id` en est délibérément ABSENT : la politique « Agents can update
 * own profile details » n'accorde que les colonnes listées, et l'identité du
 * titulaire n'a pas à changer — il n'y a qu'une seule fiche par compte.
 */
export function versChargeMiseAJour(
  valeurs: AgentProfileValues,
): AgentProfileUpdatableFields {
  return {
    zone: valeurs.zone.trim(),
    bio: valeurs.bio?.trim() ? valeurs.bio.trim() : null,
    hourly_rate: valeurs.hourlyRate?.trim() ? Number(valeurs.hourlyRate.trim()) : null,
    certification_number: valeurs.certificationNumber?.trim()
      ? valeurs.certificationNumber.trim()
      : null,
  };
}
