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

export type { Json };
