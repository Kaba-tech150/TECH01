import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Typography } from '@/components/ui';
import {
  BORDER_RADIUS,
  COLORS,
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_VARIANTS,
  SPACING,
} from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { useMonEquipe } from '@/features/companies';
import { toUserFacingError } from '@/lib/supabase/errors';

/**
 * Écran « Équipe » de l'espace société.
 *
 * LECTURE RÉELLE DEPUIS LE 2026-09-30. Avant, l'écran affichait « Vous n'avez
 * pas encore d'agents » et un bouton « Inviter un agent » sans effet : le texte
 * était écrit AVANT la requête, donc il annonçait un fait jamais vérifié. Un
 * compte qui avait trois agents lisait « aucun agent ».
 *
 * `companiesService.getMyTeam` existait déjà et n'était appelé par aucun écran.
 * Il est branché ici, sans être modifié.
 *
 * L'INVITATION N'EST PAS PROPOSÉE, ET CE N'EST PAS UNE LIMITE D'AFFICHAGE.
 *
 * `getMyTeam` le dit dans son en-tête : aucune fonction serveur ne permet de
 * rattacher un agent à une société, donc il n'existe aucun chemin d'écriture. Un
 * bouton « Inviter un agent » qui ne fait rien est pire que son absence — il
 * promet une action que l'application ne sait pas faire.
 */
export default function CompanyTeam() {
  const { user } = useAuthContext();
  const { data: equipe, isPending, isError, error, refetch, isFetching } = useMonEquipe(
    user?.id,
  );

  /*
   * LE MESSAGE EST SPÉCIFIQUE À L'ÉCRAN, ET LE DÉTAIL TECHNIQUE EST JOURNALISÉ.
   *
   * Même traitement que `availability.tsx` et `search.tsx` : `toUserFacingError`
   * renvoie un objet `{ message, technical, isServiceIssue }`, et c'est le
   * `message` qui s'affiche. Un message générique — « le service est
   * indisponible » — ne dirait pas à l'utilisateur que c'est SON équipe qui n'a
   * pas pu être lue.
   */
  const messageErreur = toUserFacingError(
    error,
    'Impossible de charger la liste de vos agents.',
  ).message;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Typography variant="h2">Équipe</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.sousTitre}>
        Les agents rattachés à votre société
      </Typography>

      {isPending ? (
        <Card style={styles.carte}>
          <Typography variant="caption" color={COLORS.textSecondary}>
            Chargement de votre équipe…
          </Typography>
        </Card>
      ) : null}

      {isError ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Équipe indisponible</Typography>
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

      {!isPending && !isError && equipe && equipe.length === 0 ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Aucun agent rattaché</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
            {/*
             * L'ÉTAT VIDE DISTINGUE CE QU'ON SAIT, SANS L'INVENTER.
             *
             * `getMyTeam` renvoie `[]` dans deux cas différents : la société
             * n'existe pas encore, ou elle existe sans agent. Écrire « ajoutez vos
             * agents » supposerait un lien de rattachement qui n'existe pas.
             */}
            Aucun agent n&apos;est rattaché à votre société pour le moment. Le
            rattachement se fait depuis la fiche de chaque agent.
          </Typography>
        </Card>
      ) : null}
      {!isPending && !isError && equipe && equipe.length > 0 ? (
        <>
          <View style={styles.compteur}>
            <MaterialCommunityIcons name="account-group-outline" size={18} color={COLORS.textSecondary} />
            <Typography variant="label" color={COLORS.textSecondary}>
              {`${equipe.length} agent${equipe.length > 1 ? 's' : ''}`}
            </Typography>
          </View>

          {equipe.map((membre) => (
            <View key={membre.id} style={styles.membre}>
              <View style={styles.membreHaut}>
                {/*
                 * LE NOM PEUT ÊTRE ABSENT, ET L'ÉCRAN LE DIT.
                 *
                 * `MembreEquipe.nom` vaut `null` quand la jointure `profiles` est
                 * masquée par la RLS : l'agent existe, son nom n'est pas lisible.
                 * Écrire « Agent inconnu » le ferait disparaître de l'écran.
                 */}
                <View style={styles.membreTextes}>
                  <Typography variant="h3" numberOfLines={1}>
                    {membre.nom ?? `Agent · ${membre.profileId.slice(0, 8)}`}
                  </Typography>
                  {membre.nom === null ? (
                    <Typography variant="caption" color={COLORS.textLight} style={styles.membreMeta}>
                      Compte non lisible par votre espace
                    </Typography>
                  ) : null}
                </View>

                <Badge
                  text={PROVIDER_STATUS_LABELS[membre.status]}
                  variant={PROVIDER_STATUS_VARIANTS[membre.status]}
                />
              </View>

              <View style={styles.membrePuces}>
                {membre.zone ? (
                  <View style={styles.puce}>
                    <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.textSecondary} />
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      {membre.zone}
                    </Typography>
                  </View>
                ) : null}

                {/*
                 * LA DISPONIBILITÉ EST UN ÉTAT DE LA BASE, PAS UNE PROMESSE.
                 *
                 * `is_available` est le champ posé par l'agent. L'afficher est
                 * exact ; en déduire qu'il est joignable maintenant serait une
                 * promesse que rien ne garantit.
                 */}
                <View style={styles.puce}>
                  <MaterialCommunityIcons
                    name={membre.isAvailable ? 'check-circle-outline' : 'pause-circle-outline'}
                    size={14}
                    color={membre.isAvailable ? COLORS.success : COLORS.textSecondary}
                  />
                  <Typography
                    variant="caption"
                    color={membre.isAvailable ? COLORS.success : COLORS.textSecondary}
                  >
                    {membre.isAvailable ? 'Disponible' : 'Indisponible'}
                  </Typography>
                </View>

                {membre.certificationNumber ? (
                  <View style={styles.puce}>
                    <MaterialCommunityIcons name="certificate-outline" size={14} color={COLORS.textSecondary} />
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      {membre.certificationNumber}
                    </Typography>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </>
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
    padding: SPACING.lg,
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
    marginTop: SPACING.lg,
  },
  compteur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  membre: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    gap: SPACING.md,
  },
  membreHaut: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  membreTextes: {
    flex: 1,
    minWidth: 0,
  },
  membreMeta: {
    marginTop: 2,
  },
  membrePuces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  puce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  rafraichit: {
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
