/**
 * Validation de la fiche prestataire.
 *
 * CE SCHÉMA REPRODUIT LES CONTRAINTES DE LA BASE — il ne les invente pas.
 *
 * La politique « Agents can create own pending profile » impose :
 *
 *     with check (profile_id = auth.uid()qqq
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
 * Convertit le formulaire en charge utile.
 *
 * `profile_id` vient de la session : le client ne le choisit pas, et la base le
 * refuserait s’il-différait — mais l’envoyer systématiquement évite de dépendre
 * d’une valeur absente.
 */
export function versChargeAgent(
  valeurs: AgentProfileValues,
  userId: string,
): Record<string, unknown> {
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
