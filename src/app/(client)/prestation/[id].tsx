import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, Card, Typography } from '@/components/ui';
import {
  BORDER_RADIUS,
  COLORS,
  SPACING,
} from '@/constants';
import {
  useAffectationsMission,
  useClientMissions,
  useMissionErrorMessage,
  useReserverPrestataire,
} from '@/features/missions';
import { formatDate } from '@/lib/utils';
import type { AssignmentStatus, Mission } from '@/types';

/** Libellés d'une affectation, pour ne jamais afficher un statut brut. */
const AFFECTATION_LABELS: Record<AssignmentStatus, string> = {
  pending: 'En attente de réponse',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  completed: 'Terminée',
};

/**
 * Réserver un prestataire sur une mission publiée.
 *
 * LE PARCOURS EST IMPOSÉ PAR LA BASE, PAS PAR L'INTERFACE.
 *
 * La politique « Mission owners can create assignments » exige que la mission
 * appartienne au client ET soit `published`. Une affectation sur un brouillon
 * est refusée. L'écran ne propose donc que des missions publiées, et explique
 * pourquoi quand il n'y en a aucune — plutôt que d'afficher un bouton qui
 * échouerait.
 *
 * CE QUE CET ÉCRAN NE FAIT PAS
 *
 * Il n'envoie aucun tarif. Le montant d'une mission est une décision métier non
 * confirmée ; `proposed_rate` reste donc `null` et le tarif du prestataire est
 * affiché sans être proposé en face. Inventer une règle de prix ici la figerait
 * dans le code avant d'avoir été décidée.
 */
export default function ReservationScreen() {
  const router = useRouter();
  const { id, kind, nom, taux } = useLocalSearchParams<{
    id: string;
    kind: string;
    nom?: string;
    taux?: string;
  }>();

  /*
   * `kind` PROVIENT DE L'URL, DONC C'EST UNE DONNÉE NON FIABLE.
   *
   * On ne lui applique pas de valeur par défaut : un `kind` inattendu doit
   * produire un écran d'erreur lisible, pas une réservation dont la moitié des
   * colonnes serait fausse. La validation est une comparaison explicite, et
   * l'absence de `as` est délibérée — un transtype here rendrait le contrôle
   * silencieusement faux.
   */
  const typePrestataire = kind === 'agent' || kind === 'company' ? kind : null;
  const nomAffiche = nom && nom.length > 0 ? nom : 'Prestataire';
  const tarifAffiche = taux && taux.length > 0 ? taux : null;

  const [missionId, setMissionId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reussi, setReussi] = useState(false);

  const {
    data: missions,
    isPending,
    isError,
    error,
    refetch,
  } = useClientMissions();
  const reserver = useReserverPrestataire();
  const messageErreur = useMissionErrorMessage();
  const { data: affectations, isPending: affectationsEnCours } =
    useAffectationsMission(missionId);

  /*
   * LE FILTRE EST FAIT ICI, ET NON DANS UNE REQUÊTE DÉDIÉE.
   *
   * Une clé de cache séparée aurait oublié deux choses : la publication d'une
   * mission invalide `CLIENT_MISSIONS_KEY` et pas l'autre, donc une mission
   * venant d'être publiée resterait invisible ici. Réutiliser la même clé
   * garantit qu'un seul écran fait autorité sur la liste du client.
   */
  const publiees = useMemo(
    () => (missions ?? []).filter((mission: Mission) => mission.status === 'published'),
    [missions],
  );

  /*
   * LE PRESTATAIRE EST-IL DÉJÀ AFFECTÉ À CETTE MISSION ?
   *
   * On pose la question au client AVANT de lui laisser cliquer, plutôt que de
   * laisser PostgreSQL refuser l'écriture et d'afficher une erreur ensuite.
   *
   * L'index unique `mission_assignments_agent_unique` rend le doublon
   * impossible ; cet état sert donc à éviter une tentative connue d'échouer. Le
   * message d'erreur reste malgré tout traduit dans `errors.ts`, parce qu'une
   * race reste possible : deux onglets ouverts, ou un autre appareil.
   *
   * La liste n'est lisible que par le client propriétaire, grâce à
   * `can_view_assignment` — c'est donc exactement les affectations qu'il a
   * lui-même créées, et rien d'autre.
   */
  const dejaAffecte = useMemo(() => {
    if (typePrestataire === null || !affectations) return false;
    return affectations.some((affectation) =>
      typePrestataire === 'agent'
        ? affectation.agent_id === id
        : affectation.company_id === id,
    );
  }, [affectations, typePrestataire, id]);

  const lienInvalide = typePrestataire === null || id.length === 0;

  const confirmer = async () => {
    if (typePrestataire === null || missionId === null) return;
    setErreur(null);
    try {
      await reserver.mutateAsync({
        missionId,
        kind: typePrestataire,
        prestataireId: id,
      });
      setReussi(true);
    } catch (e) {
      setErreur(messageErreur(e, 'réserver', 'Impossible de créer la réservation.'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Typography variant="h2" style={styles.titre}>
          Réserver
        </Typography>
        <Typography variant="caption" color={COLORS.textSecondary} style={styles.sousTitre}>
          {nomAffiche}
          {tarifAffiche
            ? ` — ${Number(tarifAffiche).toLocaleString('fr-FR')} € / heure`
            : ''}
        </Typography>

        {lienInvalide ? (
          <Card style={styles.carte}>
            <Typography variant="h3">Lien de réservation invalide</Typography>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.texte}
            >
              Revenez à la recherche et choisissez un prestataire.
            </Typography>
            <Button
              title="Retour à la recherche"
              variant="secondary"
              onPress={() => router.replace('/(client)/search')}
            />
          </Card>
        ) : null}

        {!lienInvalide && reussi ? (
          <Card style={styles.carteSucces}>
            <Typography variant="h3">Réservation envoyée</Typography>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.texte}
            >
              {nomAffiche} doit maintenant accepter la mission. Vous serez
              prévenu dès sa réponse.
            </Typography>
          </Card>
        ) : null}

        {!lienInvalide && !reussi && isPending ? (
          <View style={styles.centre}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : null}

        {!lienInvalide && !reussi && isError ? (
          <Card style={styles.carte}>
            <Typography variant="h3">Chargement impossible</Typography>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.texte}
            >
              {messageErreur(error, 'charger')}
            </Typography>
            <Button title="Réessayer" onPress={() => void refetch()} />
          </Card>
        ) : null}

        {!lienInvalide && !reussi && !isPending && !isError && publiees.length === 0 ? (
          <Card style={styles.carte}>
            <Typography variant="h3">Aucune mission publiée</Typography>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.texte}
            >
              Une réservation se porte sur une mission publiée, et non sur un
              brouillon. Publiez d’abord une de vos missions, puis revenez ici.
            </Typography>
            <Button
              title="Voir mes missions"
              variant="secondary"
              onPress={() => router.replace('/(client)/missions-client')}
            />
          </Card>
        ) : null}

        {!lienInvalide && !reussi && publiees.length > 0 ? (
          <>
            <Typography variant="h3" style={styles.sousTitreListe}>
              Sur quelle mission ?
            </Typography>

            {publiees.map((mission) => {
              const choisie = mission.id === missionId;
              return (
                <Pressable
                  key={mission.id}
                  onPress={() => setMissionId(mission.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: choisie }}
                  style={[styles.mission, choisie && styles.missionChoisie]}
                >
                  <Typography variant="h3" numberOfLines={2}>
                    {mission.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={COLORS.textSecondary}
                    style={styles.texte}
                  >
                    {mission.city} · {formatDate(mission.start_time, 'long')}
                  </Typography>
                  {choisie ? <Badge text="Sélectionnée" variant="primary" /> : null}
                </Pressable>
              );
            })}

            {/*
             * LE FILET `23505` EST UN FILET, PAS UNE VOIE NORMALE.
             *
             * Il ne devrait jamais s'afficher : le garde d'avant-clic
             * ci-dessus connaît déjà la réponse. Il s'est pourtant produit le
             * 2026-09-28, parce que le bouton restait actif tant que la
             * requête des affectations n'avait pas RÉPONDU — et non pas tant
             * qu'elle n'avait pas trouvé de doublon.
             *
             * Sélectionner une mission puis cliquer immédiatement suffisait à
             * déclencher le filet à chaque fois. Le message est donc exact, mais
             * il était présenté comme une erreur alors que c'était une course
             * entre l'affichage et le clic.
             */}
            {erreur ? (
              <Card style={styles.carteErreur}>
                <Typography
                  variant="caption"
                  color={COLORS.textSecondary}
                  style={styles.texte}
                >
                  {erreur}
                </Typography>
              </Card>
            ) : null}

            {dejaAffecte ? (
              <Card style={styles.carte}>
                <Typography variant="h3">Déjà affecté</Typography>
                <Typography
                  variant="caption"
                  color={COLORS.textSecondary}
                  style={styles.texte}
                >
                  {nomAffiche} est déjà rattaché à cette mission. Choisissez
                  une autre mission, ou un autre prestataire.
                </Typography>
              </Card>
            ) : null}

            <Button
              title="Réserver"
              icon="calendar-check"
              onPress={() => void confirmer()}
              disabled={
                missionId === null ||
                reserver.isPending ||
                dejaAffecte ||
                affectationsEnCours
              }
            />
          </>
        ) : null}

        {!lienInvalide && reussi && missionId && affectations && affectations.length > 0 ? (
          <>
            <Typography variant="h3" style={styles.sousTitreListe}>
              Affectations de la mission
            </Typography>
            {affectations.map((affectation) => (
              <Card key={affectation.id} style={styles.carte}>
                <View style={styles.ligneAffectation}>
                  <Typography variant="h3">
                    {AFFECTATION_LABELS[affectation.status]}
                  </Typography>
                  <Badge
                    text={affectation.status === 'pending' ? 'En attente' : 'Confirmée'}
                    variant={affectation.status === 'pending' ? 'warning' : 'success'}
                  />
                </View>
                <Typography
                  variant="caption"
                  color={COLORS.textSecondary}
                  style={styles.texte}
                >
                  Demandée le {formatDate(affectation.created_at, 'short')}
                </Typography>
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  titre: {
    marginBottom: SPACING.sm,
  },
  sousTitre: {
    marginBottom: SPACING.lg,
  },
  sousTitreListe: {
    marginBottom: SPACING.md,
  },
  centre: {
    paddingVertical: SPACING.xxl,
  },
  carte: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  carteSucces: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  carteErreur: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  texte: {
    lineHeight: 20,
  },
  mission: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  missionChoisie: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  ligneAffectation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
});

