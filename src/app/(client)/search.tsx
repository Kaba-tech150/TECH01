import { ScrollView, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';
import { Typography, Card } from '@/components/ui';

export default function ClientSearch() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Rechercher</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Trouvez des agents et sociétés de sécurité
      </Typography>

      <Card style={styles.card}>
        <Typography variant="h3">Filtres de recherche</Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.cardText}>
          Bientôt disponible : filtres par zone, tarif, disponibilité...
        </Typography>
      </Card>

      <Card style={styles.card}>
        <Typography variant="h3">Résultats</Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.cardText}>
          Aucun résultat pour le moment
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
