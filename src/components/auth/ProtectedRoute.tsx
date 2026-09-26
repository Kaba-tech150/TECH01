import { Button, Typography } from '@/components/ui';
import { COLORS, SPACING } from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireRole?: UserRole;
}

function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

function AccessErrorState({ message, isServiceIssue }: { message: string; isServiceIssue: boolean }) {
  const { signOut, refreshProfile } = useAuthContext();
  const [refreshing, setRefreshing] = useState(false);

  const handleRetry = async () => {
    try {
      setRefreshing(true);
      await refreshProfile();
    } catch {
      // L'erreur reste affichée telle quelle : refreshProfile alimente le
      // contexte, qui ré-affichera un message à jour si nécessaire.
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="h3" style={styles.errorTitle}>
        Accès indisponible
      </Typography>
      <Typography variant="body" color={COLORS.textSecondary} style={styles.errorText}>
        {message}
      </Typography>
      {isServiceIssue ? (
        <Button
          title={refreshing ? 'Nouvelle tentative...' : 'Réessayer'}
          onPress={() => void handleRetry()}
          disabled={refreshing}
          style={styles.retryButton}
        />
      ) : null}
      <Button
        title="Se déconnecter"
        variant="secondary"
        onPress={() => void signOut()}
        style={styles.signOutButton}
      />
    </View>
  );
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
}: ProtectedRouteProps) {
  const { user, profile, roles, loading, error, hasRole, isServiceIssue } = useAuthContext();

  if (loading) {
    return <LoadingState />;
  }

  if ((requireAuth || requireRole) && !user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (requireRole) {
    if (error || !profile || roles.length === 0) {
      return (
        <AccessErrorState
          message={
            error?.message ??
            'Votre profil ne contient aucun rôle autorisé. Vérifiez votre compte avant de réessayer.'
          }
          isServiceIssue={isServiceIssue}
        />
      );
    }

    if (!hasRole(requireRole)) {
      return <Redirect href="/(auth)/role-selection" />;
    }
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  retryButton: {
    marginBottom: SPACING.md,
  },
  signOutButton: {
    marginTop: SPACING.xs,
  },
});
