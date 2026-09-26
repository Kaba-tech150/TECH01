import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Typography } from '@/components/ui';
import { COLORS, SPACING } from '@/constants';
import { MissionCard, useClientMissions, useMissionErrorMessage } from '@/features/missions';

export default function ClientMissions() {
  const router = useRouter();
  const { data: missions, isPending, isError, error, refetch } = useClientMissions();
  const messageErreur = useMissionErrorMessage();

  const afficherChargement = () => (
    <View style={styles.centred}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  const afficherErreur = () => (
    <View style={styles.centred}>
      <Card style={styles.card}>
        <Typography variant="h3">Chargement impossible</Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.cardText}>
          {messageErreur(error, 'charger')}
        </Typography>
        <Button title="Réessayer" onPress={() => void refetch()} />
      </Card>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>
        Mes missions
      </Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Gérez vos demandes de sécurité
      </Typography>

      <Button
        title="Créer une mission"
        onPress={() => router.push('/(client)/mission/new')}
        style={styles.create}
      />

      {/*
        L'ordre des états est délibéré : chargement, puis erreur, puis liste.
        Inverser l'erreur et le chargement afficherait brièvement « Aucune
        mission » pendant la requête, ce qui ferait croire à une perte de
        données alors que la liste arrive une seconde plus tard.
      */}
      {isPending ? afficherChargement() : null}
      {isError ? afficherErreur() : null}

      {!isPending && !isError && missions && missions.length === 0 ? (
        <Card style={styles.card}>
          <Typography variant="h3">Aucune mission</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.cardText}>
            Vous n’avez pas encore créé de demande de sécurité.
          </Typography>
        </Card>
      ) : null}

      {!isPending && !isError && missions && missions.length > 0
        ? missions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))
        : null}
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
    paddingBottom: SPACING.xxxl,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  subtitle: {
    marginBottom: SPACING.lg,
  },
  create: {
    marginBottom: SPACING.lg,
  },
  centred: {
    paddingVertical: SPACING.xxl,
  },
  card: {
    padding: SPACING.lg,
  },
  cardText: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
});
