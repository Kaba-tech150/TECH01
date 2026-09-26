import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
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
   * Les polices ne sont chargées qu'une fois sur les cinq graisses réellement
   * utilisées par les primitives. Charger les 14 graisses de Plus Jakarta Sans
   * ferait gagner quelques Ko pour des usages qui n'existent pas.
   */
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
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

