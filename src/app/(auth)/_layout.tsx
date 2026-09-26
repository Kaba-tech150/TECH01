import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: 'Connexion' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Inscription' }} />
      <Stack.Screen name="role-selection" options={{ title: 'Choix de l’espace' }} />
    </Stack>
  );
}
