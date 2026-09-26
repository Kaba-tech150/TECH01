import { Button, Card, Typography } from '@/components/ui';
import { COLORS, SPACING } from '@/constants';
import { ScrollView, StyleSheet } from 'react-native';

export default function CompanyMissions() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Missions</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Gérez les missions de votre société
      </Typography>

      <Card style={styles.card}>
        <Typography variant="h3">Aucune mission</Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.cardText}>
          Aucune mission assignée à votre société.
        </Typography>
        <Button title="Rechercher des missions" onPress={() => {}} style={styles.button} />
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
