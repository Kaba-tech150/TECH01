import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, StatTile, Typography } from '@/components/ui';
import { COLORS, SCREEN_PADDING, SPACING } from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { useStatistiquesPlateforme } from '@/features/administration';
import { toUserFacingError } from '@/lib/supabase/errors';

/**
 * Accueil de l'espace administrateur.
 *
 * LECTURE RÉELLE DEPUIS LE 2026-09-30. L'écran affichait `value="0"` en dur pour
 * les deux compteurs, avec un emoji en icône et deux boutons sans effet.
 *
 * LE « 0 » EN DUR DISAIT UN FAIT QUI N'EXISTAIT PAS.
 *
 * `administrationService.getStatistiques` comptait déjà missions, agents,
 * sociétés et clients par de vraies lectures `head: true`. Ce chiffre était
 * disponible et n'était pas appelé. Afficher « 0 » était donc une affirmation
 * fausse : la plateforme pouvait être vide, ou pleine — l'écran disait la même
 * chose dans les deux cas. C'est le même défaut que les écrans qui écrivaient
 * « aucune mission » avant de lire.
 *
 * LES BOUTONS SONT DEVENUS DES NAVUATIONS, ET NON DES PROMESSES.
 *
 * « Superviser les missions » mène désormais à `/(admin)/missions-admin`, qui
 * existe. « Valider les utilisateurs » mène à `/(admin)/users`, qui liste la
 * file — mais qui ne VALIDE rien, aucune des 11 RPC ne changeant un statut de
 * prestataire. Le libellé dit donc « Voir la file de validation », ce qui est
 * exactement ce que fait la destination. Un bouton qui promet une décision et
 * ouvre une liste est un mensonge d'interface.
 *
 * `StatCard` n'est plus utilisé ici : il prend une icône **emoji** et porte
 * des couleurs en dur, ce que `AGENTS.md` interdit. `StatTile` prend une icône
 * Material et lit ses couleurs dans `src/constants`.
 */
export default function AdminIndex() {
  const router = useRouter();
  const { profile } = useAuthContext();
  const { data: stats, isPending, isError, error, refetch, isFetching } =
    useStatistiquesPlateforme();

  const messageErreur = toUserFacingError(
    error,
    'Impossible de charger les compteurs de la plateforme.',
  ).message;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Typography variant="h2">Bonjour, {profile?.full_name || 'Administrateur'}</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.sousTitre}>
        Supervision de la plateforme
      </Typography>

      {isPending ? (
        <Card style={styles.carte}>
          <Typography variant="caption" color={COLORS.textSecondary}>
            Chargement des compteurs…
          </Typography>
        </Card>
      ) : null}

      {isError ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Compteurs indisponibles</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
            {messageErreur}
          </Typography>
          <Button
            title="Réessayer"
            variant="outline"
            size="md"
            onPress={() => void refetch()}
            disabled={isFetching}
            style={styles.action}
          />
        </Card>
      ) : null}

      {stats ? (
        <>
          <View style={styles.tuiles}>
            {/*
             * « MISSIONS OUVERTES » EST UN SOUS-ENSEMBLE, ET C'EST DIT.
             *
             * `missionsOuvertes` compte les statuts `published`, `accepted` et
             * `in_progress`. Le libellé le dit, pour que « 3 missions » ne se
             * lise pas comme le total de la plateforme — le total est la tuile
             * voisine, et il est différent.
             */}
            <StatTile
              value={String(stats.missionsOuvertes)}
              label="Missions ouvertes"
              hint={`sur ${stats.missionsTotal} au total`}
              icon="briefcase-clock-outline"
              iconVariant="primary"
            />
            <StatTile
              value={String(stats.documentsEnValidation)}
              label="Dossiers à examiner"
              icon="file-clock-outline"
              iconVariant="accent"
            />
          </View>

          <View style={styles.tuiles}>
            <StatTile
              value={String(stats.agentsDisponibles)}
              label="Agents disponibles"
              hint={`sur ${stats.agentsTotal} prestataires`}
              icon="shield-account-outline"
            />
            <StatTile
              value={String(stats.societesTotal)}
              label="Sociétés"
              icon="domain"
            />
          </View>

          <View style={styles.tuiles}>
            <StatTile
              value={String(stats.clientsTotal)}
              label="Clients"
              icon="account-multiple-outline"
            />
            <StatTile
              value={String(stats.missionsTotal)}
              label="Missions"
              icon="clipboard-list-outline"
            />
          </View>
        </>
      ) : null}

      {stats ? (
        <Card style={styles.carte}>
          <Typography variant="h3">File de validation</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
            {stats.documentsEnValidation > 0
              ? `${stats.documentsEnValidation} dossier${stats.documentsEnValidation > 1 ? 's' : ''} de pièces justificatives attend${stats.documentsEnValidation > 1 ? 'ent' : ''} un examen.`
              : 'Aucun dossier de pièces justificatives en cours d’examen.'}
          </Typography>

          {/*
           * LE LIBELLÉ DIT CE QUE LA DESTINATION FAIT, ET NON CE QU'ELLE
           * PROMET.
           *
           * `/(admin)/users` liste la file et ne la vide pas : aucune des 11 RPC
           * ne change un statut de prestataire. « Voir la file de validation »
           * est donc exact, là où « Valider les utilisateurs » aurait promis une
           * décision que l'application ne sait pas prendre.
           */}
          <Button
            title="Voir la file de validation"
            icon="inbox-full-outline"
            onPress={() => router.push('/(admin)/users')}
            style={styles.action}
          />
          <Button
            title="Superviser les missions"
            icon="clipboard-list-outline"
            variant="outline"
            onPress={() => router.push('/(admin)/missions-admin')}
            style={styles.action}
          />
        </Card>
      ) : null}

      {isFetching && !isPending ? (
        <Typography variant="caption" color={COLORS.textLight} style={styles.rafraichit}>
          Actualisation en cours…
        </Typography>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SCREEN_PADDING,
    gap: SPACING.md,
  },
  sousTitre: {
    marginBottom: SPACING.sm,
  },
  carte: {
    padding: SPACING.lg,
  },
  texte: {
    marginTop: SPACING.sm,
  },
  action: {
    marginTop: SPACING.md,
  },
  /*
   * DEUX TUILES PAR LIGNE.
   *
   * `StatTile` a `flex: 1`, donc une ligne en contient deux de largeur égale.
   * Sur un écran plus étroit elles resteraient côte à côte et le chiffre serait
   * tronqué — `StatTile` applique `adjustsFontSizeToFit` par prudence, mais
   * « 1424 » dans une colonne de 150 px n'est pas un chiffre lisible.
   */
  tuiles: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  rafraichit: {
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
