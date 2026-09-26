import type { Href } from 'expo-router';
import type { UserRole } from '@/types';

export const ROLE_ROUTES = {
  client: '/(client)',
  agent: '/(agent)',
  company: '/(company)',
  admin: '/(admin)',
} as const satisfies Record<UserRole, Href>;

export const ROLE_LABELS = {
  client: 'Espace client',
  agent: 'Espace agent',
  company: 'Espace société',
  admin: 'Espace administrateur',
} as const satisfies Record<UserRole, string>;

export const ROLE_DESCRIPTIONS = {
  client: 'Créez et suivez vos demandes de sécurité.',
  agent: 'Gérez vos missions et disponibilités.',
  company: 'Pilotez votre équipe et vos affectations.',
  admin: 'Supervisez la plateforme et ses utilisateurs.',
} as const satisfies Record<UserRole, string>;

export function getRoleHomeRoute(role: UserRole): Href {
  return ROLE_ROUTES[role];
}