import { ScrollView, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';
import { Typography, Card } from '@/components/ui';

export default function AdminUsers() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Utilisateurs</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Gérez les utilisateurs et leurs validations
      </Typography>

      <Card style={styles.card}>
        <Typography variant="h3">Liste des utilisateurs</Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.cardText}>
          Bientôt disponible : liste des utilisateurs en attente de validation
        </Typography>
      </Card>
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
  cardText: {
    marginTop: SPACING.sm,
  },
});
