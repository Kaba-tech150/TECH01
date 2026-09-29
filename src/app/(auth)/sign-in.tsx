import { Header } from '@/components/common';
import { SignInForm } from '@/components/forms';
import { COLORS, FONT_FAMILIES, SCREEN_PADDING, SPACING } from '@/constants';
import { isPublicProfile } from '@/lib/storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Écran de connexion, d'après `design/secuguard_connexion.html`.
 *
 * LE TITRE EST DANS LE FORMULAIRE, ET NON ICI.
 *
 * La maquette place « Bon retour parmi nous » juste sous le logo. Le
 * formulaire porte ce titre, pour qu'il ne soit pas coupé quand le clavier
 * s'ouvre et que l'écran défile.
 */
export default function SignInScreen() {
  const router = useRouter();
  const { profile } = useLocalSearchParams<{ profile?: string }>();
  const selectedProfile = isPublicProfile(profile) ? profile : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header showLogin={false} />

        <View style={styles.entete}>
          <Text style={styles.titre}>Bon retour parmi nous</Text>
          <Text style={styles.sousTitre}>
            Connectez-vous à votre console opérationnelle SecuGuard.
          </Text>
        </View>

        <SignInForm
          initialProfile={selectedProfile}
          onSuccess={() => router.replace('/(auth)/role-selection')}
          onSignUpPress={(profil) =>
            router.push({ pathname: '/(auth)/sign-up', params: { profile: profil } })
          }
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SCREEN_PADDING,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },
  entete: {
    gap: SPACING.xs,
  },
  titre: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: FONT_FAMILIES.display,
    color: COLORS.text,
  },
  sousTitre: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FONT_FAMILIES.regular,
    color: COLORS.textSecondary,
  },
});
