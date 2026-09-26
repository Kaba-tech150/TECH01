import { ScrollView, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';
import { Button, Typography, Card } from '@/components/ui';
import { useAuthContext } from '@/context/AuthContext';

export default function ClientProfile() {
  const { user, profile, signOut } = useAuthContext();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Mon Profil</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Gérez vos informations personnelles
      </Typography>

      <Card style={styles.card}>
        <Typography variant="h3">Informations</Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.infoText}>
          Email: {user?.email}
        </Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.infoText}>
          Nom: {profile?.full_name || 'Non renseigné'}
        </Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.infoText}>
          Rôle: {profile?.role || 'Non renseigné'}
        </Typography>
      </Card>

      <Button title="Se déconnecter" onPress={signOut} style={styles.button} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  subtitle: {
    marginBottom: SPACING.xl,
  },
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  infoText: {
    marginTop: SPACING.sm,
  },
  button: {
    marginTop: SPACING.md,
  },
});
