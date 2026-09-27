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

export type { Json };
