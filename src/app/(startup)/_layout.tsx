import { Stack } from 'expo-router';

export default function StartupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" options={{ title: 'Bienvenue' }} />
      <Stack.Screen name="profile-selection" options={{ title: 'Votre profil' }} />
    </Stack>
  );
}
