import { Button, Card, Typography } from '@/components/ui';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { getRoleHomeRoute, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/utils';
import { Redirect, Stack, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { user, profile, roles, loading, error, signOut, isServiceIssue } = useAuthContext();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (error || !profile || roles.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Typography variant="h3" style={styles.centeredTitle}>
            Accès indisponible
          </Typography>
          <Typography variant="body" color={COLORS.textSecondary} style={styles.centeredText}>
            {error?.message ?? 'Aucun rôle autorisé n’a été trouvé pour ce compte.'}
          </Typography>
          {isServiceIssue ? (
            <Text style={styles.hint}>
              Incident technique probable. Réessayez dans quelques instants.
            </Text>
          ) : null}
          <Button title="Se déconnecter" variant="secondary" onPress={() => void signOut()} />
        </View>
      </SafeAreaView>
    );
  }

  if (roles.length === 1) {
    return <Redirect href={getRoleHomeRoute(roles[0])} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h2" style={styles.title}>
          Choisissez votre espace
        </Typography>
        <Typography variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
          Votre compte {profile.email} possède plusieurs rôles. Sélectionnez celui que vous souhaitez ouvrir.
        </Typography>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <Card key={role} variant="secondary" style={styles.roleCard}>
              <Typography variant="h3">{ROLE_LABELS[role]}</Typography>
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.roleDescription}>
                {ROLE_DESCRIPTIONS[role]}
              </Typography>
              <Button
                title="Ouvrir cet espace"
                onPress={() => router.replace(getRoleHomeRoute(role))}
                style={styles.roleButton}
              />
            </Card>
          ))}
        </View>

        <Button
          title="Se déconnecter"
          variant="secondary"
          onPress={() => void signOut()}
          style={styles.signOutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  subtitle: {
    marginBottom: SPACING.xl,
  },
  rolesContainer: {
    gap: SPACING.md,
  },
  roleCard: {
    padding: SPACING.lg,
  },
  roleDescription: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  roleButton: {
    marginTop: SPACING.sm,
  },
  signOutButton: {
    marginTop: SPACING.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  centeredTitle: {
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  centeredText: {
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  hint: {
    color: COLORS.textLight,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
});