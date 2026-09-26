import { Button, Card, Typography } from '@/components/ui';
import { COLORS, SPACING } from '@/constants';
import { ScrollView, StyleSheet } from 'react-native';

export default function CompanyTeam() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Équipe</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Gérez vos agents
      </Typography>

      <Card style={styles.card}>
        <Typography variant="h3">Aucun agent</Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.cardText}>
          Vous n&apos;avez pas encore d&apos;agents dans votre équipe.
        </Typography>
        <Button title="Inviter un agent" onPress={() => {}} style={styles.button} />
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
