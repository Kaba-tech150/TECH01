import { appStorage } from '@/lib/supabase/storage';

export const ONBOARDING_COMPLETED_KEY = 'secuguard_onboarding_completed';
export const SELECTED_PROFILE_KEY = 'secuguard_selected_profile';

export const PUBLIC_PROFILES = ['client', 'agent', 'company'] as const;
export type PublicProfile = (typeof PUBLIC_PROFILES)[number];

export function isPublicProfile(value: unknown): value is PublicProfile {
  return typeof value === 'string' && (PUBLIC_PROFILES as readonly string[]).includes(value);
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await appStorage.getItem(ONBOARDING_COMPLETED_KEY)) === 'true';
}

export async function completeOnboarding(): Promise<void> {
  await appStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}

export async function getSelectedProfile(): Promise<PublicProfile | null> {
  const value = await appStorage.getItem(SELECTED_PROFILE_KEY);
  return isPublicProfile(value) ? value : null;
}

export async function setSelectedProfile(profile: PublicProfile): Promise<void> {
  await appStorage.setItem(SELECTED_PROFILE_KEY, profile);
}
