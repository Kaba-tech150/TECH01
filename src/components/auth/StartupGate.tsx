import { COLORS } from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { getSelectedProfile, hasCompletedOnboarding, type PublicProfile } from '@/lib/storage';
import { getRoleHomeRoute } from '@/lib/utils';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export function StartupGate() {
  const router = useRouter();
  const { user, profile, roles, loading, error } = useAuthContext();
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      try {
        const [completed, profilePreference] = await Promise.all([
          hasCompletedOnboarding(),
          getSelectedProfile(),
        ]);
        if (!active) return;
        setOnboardingCompleted(completed);
        setSelectedProfile(profilePreference);
      } catch {
        if (active) setOnboardingCompleted(false);
      } finally {
        if (active) setPreferencesReady(true);
      }
    };

    void loadPreferences();
    return () => {
      active = false;
    };
  }, []);

  const ready = !loading && preferencesReady;

  useEffect(() => {
    if (!ready) return;

    let active = true;
    void SplashScreen.hideAsync().catch(() => undefined);

    if (user) {
      if (error || !profile || roles.length === 0) {
        if (active) router.replace('/(auth)/role-selection');
      } else if (roles.length === 1) {
        if (active) router.replace(getRoleHomeRoute(roles[0]));
      } else if (active) {
        router.replace('/(auth)/role-selection');
      }
    } else if (!onboardingCompleted) {
      if (active) router.replace('/(startup)/onboarding');
    } else if (active) {
      router.replace(
        selectedProfile
          ? { pathname: '/(auth)/sign-in', params: { profile: selectedProfile } }
          : '/(auth)/sign-in',
      );
    }

    return () => {
      active = false;
    };
  }, [error, onboardingCompleted, profile, ready, roles, router, selectedProfile, user]);

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
