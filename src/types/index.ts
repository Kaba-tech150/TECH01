import type { Database, Json } from '@/lib/supabase/types';

type PublicTables = Database['public']['Tables'];
type PublicEnums = Database['public']['Enums'];

export type UserRole = PublicEnums['user_role'];
export type MissionStatus = PublicEnums['mission_status'];
export type ProviderStatus = PublicEnums['provider_status'];
export type PaymentStatus = PublicEnums['payment_status'];
export type AssignmentStatus = PublicEnums['assignment_status'];
export type DocumentType = PublicEnums['document_type'];

export type Profile = PublicTables['profiles']['Row'];
export type ProfileRole = PublicTables['profile_roles']['Row'];
export type AgentProfile = PublicTables['agent_profiles']['Row'];
export type CompanyProfile = PublicTables['company_profiles']['Row'];
export type Document = PublicTables['documents']['Row'];
export type Mission = PublicTables['missions']['Row'];
export type Ville = PublicTables['villes']['Row'];
export type MissionAssignment = PublicTables['mission_assignments']['Row'];
export type Wallet = PublicTables['wallets']['Row'];
export type Transaction = PublicTables['transactions']['Row'];
export type Review = PublicTables['reviews']['Row'];
export type Message = PublicTables['messages']['Row'];
export type Notification = PublicTables['notifications']['Row'];

export type TableRow<TableName extends keyof PublicTables> =
  PublicTables[TableName]['Row'];
export type TableInsert<TableName extends keyof PublicTables> =
  PublicTables[TableName]['Insert'];
export type TableUpdate<TableName extends keyof PublicTables> =
  PublicTables[TableName]['Update'];

/**
 * Colonnes qu'un client est autorisé à modifier sur une mission.
 *
 * CE TYPE EST LA CONTREPARTIE EXACTE D'UN `GRANT`, PAS UNE CONVENIENCE.
 *
 * La migration `20260925000300_rls_policies.sql` n'accorde au rôle
 * `authenticated` que :
 *
 *   grant update (title, description, address, city, postal_code,
 *                  start_time, end_time, agent_count, budget,
 *                  special_requirements) on table public.missions ...
 *
 * `TableUpdate<'missions'>` est plus large : il autorise aussi `status` et
 * `client_id`, que la base refuse. Un appelant aurait donc pu compiler un
 * `{ status: 'published' }` que le serveur rejette à l'exécution.
 *
 * `status` est hors de portée du client par construction : il ne change que
 * par les fonctions de transition de la migration `20260925000400`.
 * `client_id` est hors de portée pour la même raison : une mission appartient
 * définitivement à son auteur.
 *
 * Toute évolution du `grant` doit être répercutée ici, dans les deux sens.
 * C'est le seul endroit où le contrat TypeScript reflète la base pour
 * l'écriture, donc le seul endroit où une divergence serait silencieuse.
 */
export type MissionUpdatableFields = Pick<
  TableUpdate<'missions'>,
  | 'title'
  | 'description'
  | 'address'
  | 'city'
  | 'postal_code'
  | 'start_time'
  | 'end_time'
  | 'agent_count'
  | 'budget'
  | 'special_requirements'
>;

/**
 * Colonnes qu'un agent est autorisé à INSÉRER sur sa fiche.
 *
 * CONTREPARTIE EXACTE du `grant insert` de `20260925000300_rls_policies.sql` :
 *
 *   grant insert (profile_id, certification_number, certification_expiry,
 *                 hourly_rate, zone, bio) on table public.agent_profiles ...
 *
 * `profile_id` EST ici. Il ne l'est PAS dans le type d'UPDATE ci-dessous, et
 * c'est tout l'objet de cette paire.
 */
export type AgentProfileInsertableFields = Pick<
  TableInsert<'agent_profiles'>,
  'profile_id' | 'certification_number' | 'hourly_rate' | 'zone' | 'bio'
>;

/**
 * Colonnes qu'un agent est autorisé à MODIFIER sur sa fiche.
 *
 * CONTREPARTIE EXACTE du `grant update` de `20260925000300_rls_policies.sql` :
 *
 *   grant update (certification_number, certification_expiry, hourly_rate,
 *                 zone, bio, is_available) on table public.agent_profiles ...
 *
 * `profile_id` N'EST PAS ICI, et son absence est volontaire : le `grant` ne
 * l'accorde pas, et la politique « Agents can update own profile details »
 * refuse qu'un agent change le titulaire de sa fiche. Il n'y a qu'une seule
 * fiche par compte — son identité n'a pas à bouger.
 *
 * BUG RÉEL DU 2026-09-27, À NE PAS REPRODUIRE
 *
 * Une fonction unique renvoyait la même charge utile pour les deux cas,
 * `profile_id` compris. La CRÉATION passait ; toute MODIFICATION renvoyait
 *
 *   permission denied for table agent_profiles
 *
 * Le message ne nomme pas la colonne fautive, il dit seulement « table » — et
 * le `SELECT` répondait 200. On a donc cherché un problème de DROIT pendant une
 * demi-journée, alors que la lecture était parfaite et que le défaut était dans
 * la charge utile. `TableUpdate<'agent_profiles'>` avait laissé passer la
 * colonne parce qu'il reproduit le schéma complet, pas le `grant`.
 *
 * CORRECTION APPORTÉE LE 2026-09-28 : ce type ne listait que 4 colonnes alors que
 * le `grant` en accorde 6. Il était donc plus étroit que le droit — ce qui est
 * sans danger — mais ce n'était PAS la « contrepartie exacte » qu'il prétendait
 * être, et `is_available` manquant rendait la gestion des disponibilités
 * impossible à écrire sans élargir ce type ailleurs.
 *
 * Toute évolution du `grant` doit être répercutée ici, dans les deux sens.
 */
export type AgentProfileUpdatableFields = Pick<
  TableUpdate<'agent_profiles'>,
  | 'certification_number'
  | 'certification_expiry'
  | 'hourly_rate'
  | 'zone'
  | 'bio'
  | 'is_available'
>;

export type { Json };
