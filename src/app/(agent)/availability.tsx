import { Button, Card, Typography } from '@/components/ui';
import { COLORS, SPACING } from '@/constants';
import { ScrollView, StyleSheet } from 'react-native';

export default function AgentAvailability() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Disponibilités</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Gérez vos disponibilités
      </Typography>

      <Card style={styles.card}>
        <Typography variant="h3">Statut actuel</Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.cardText}>
          Disponible
        </Typography>
        <Button title="Changer le statut" onPress={() => {}} style={styles.button} />
      </Card>

      <Card style={styles.card}>
        <Typography variant="h3">Calendrier</Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.cardText}>
          Bientôt disponible : gestion de votre calendrier
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
    marginBottom: SPACING.lg,
  },
  button: {
    marginTop: SPACING.md,
  },
});
