import {
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '@/constants';
import { AuthProvider } from '@/context/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  /*
   * Cinq graisses au total, soit exactement les cinq désignées par
   * `FONT_FAMILIES` : Hanken Grotesk 600 et 700 pour les titres et libellés,
   * Plus Jakarta Sans 400 et 500 pour le texte courant. Le nombre est stable :
   * chaque clé doit correspondre à une entrée de `FONT_FAMILIES`, sinon un
   * écran afficherait la fonte système.
   */
  const [fontsLoaded] = useFonts({
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  /*
   * Tant que les polices ne sont pas prêtes, le splash reste affiché : sans
   * cette garde, la navigation se monterait en fonte système puis basculerait
   * sur Plus Jakarta Sans sous les yeux de l'utilisateur.
   */
  if (!fontsLoaded) {
    return <View style={styles.loading} />;
  }

  return (
    /*
     * `SafeAreaProvider` doit envelopper toute l'application : sans lui,
     * `useSafeAreaInsets()` renvoie `{ top: 0 }` et les `SafeAreaView` des
     * écrans ne protègent rien. L'en-tête se retrouverait dessiné sous la
     * barre d'état et l'encoche.
     */
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: COLORS.background,
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

