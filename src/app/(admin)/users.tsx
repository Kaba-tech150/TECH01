import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Typography } from '@/components/ui';
import {
  BORDER_RADIUS,
  COLORS,
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_VARIANTS,
  SCREEN_PADDING,
  SPACING,
} from '@/constants';
import { useDossiersEnAttente, useStatistiquesPlateforme } from '@/features/administration';
import { formatDate } from '@/lib/utils';
import { toUserFacingError } from '@/lib/supabase/errors';

/**
 * Écran « Utilisateurs » : la file de validation des prestataires.
 *
 * LECTURE RÉELLE DEPUIS LE 2026-09-30. L'écran affichait « Bientôt disponible :
 * liste des utilisateurs en attente de validation » — c'est-à-dire rien. Les
 * deux hooks existaient, écrits, et n'étaient appelés par aucun écran.
 *
 * L'ADMINISTRATEUR NE DÉCIDE DE RIEN ICI, ET CE N'EST PAS UN MANQUE D'UI.
 *
 * `administrationService` ne fait que lire : `getStatistiques` compte,
 * `getDossiersEnAttente` liste. Il n'existe aucune fonction serveur de validation
 * ni de rejet dans les 11 RPC du projet. Un écran qui afficherait « Valider » ou
 * « Rejeter » proposerait deux boutons dont on sait qu'ils échoueront — ou pire,
 * dont on ne sait pas ce qu'ils écrivent. L'écran montre donc la file, et
 * indique où la décision se prendra : ce n'est pas ici.
 *
 * LES NOMS D'AGENTS SONT DES IDENTIFIANTS, ET C'EST DÉLIBÉRÉ.
 *
 * `getDossiersEnAttente` construit `Agent · <8 premiers caractères>` parce que
 * `agent_profiles` ne porte pas de nom : il est dans `profiles`. Afficher un
 * identifiant est moins élégant qu'un nom, et plus honnête qu'un nom inventé.
 */
export default function AdminUsers() {
  const { data: dossiers, isPending, isError, error, refetch, isFetching } =
    useDossiersEnAttente();
  /*
   * LES COMPTEURS SONT LUS SÉPARÉMENT, ET LEUR ÉCHEC EST DISTINGUÉ.
   *
   * `useStatistiques` et `useDossiersEnAttente` sont deux requêtes distinctes,
   * précisément pour qu'une qui échoue n'entraîne pas l'autre. Seul l'état
   * d'erreur est récupéré ici : afficher un « 0 » quand la lecture a échoué se
   * lirait comme un fait, et c'est exactement ce que le service refuse de
   * produire en propageant ses erreurs.
   */
  const { isError: compteursEnErreur } = useStatistiquesPlateforme();

  const messageErreur = toUserFacingError(
    error,
    'Impossible de charger la file de validation.',
  ).message;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Typography variant="h2">Utilisateurs</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.sousTitre}>
        Dossiers de validation en attente de décision
      </Typography>

      {isPending ? (
        <Card style={styles.carte}>
          <Typography variant="caption" color={COLORS.textSecondary}>
            Chargement de la file…
          </Typography>
        </Card>
      ) : null}

      {isError ? (
        <Card style={styles.carte}>
          <Typography variant="h3">File indisponible</Typography>
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
      {!isPending && !isError && dossiers && dossiers.length === 0 ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Aucun dossier en attente</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
            {/*
             * « AUCUN DOSSIER » EST UN ÉTAT RÉEL, PAS UNE ABSENCE D'INFORMATION.
             *
             * La file ne se remplit que si une lecture a réussi. Le cas
             * `dossiers === []` n'est rendu que lorsque `isError` est faux, donc
             * quand la lecture a abouti : l'affirmation est donc fondée.
             */}
            Tous les dossiers de validation ont été traités. Rien n&apos;attend
            de décision pour le moment.
          </Typography>
        </Card>
      ) : null}

      {!isPending && !isError && dossiers && dossiers.length > 0 ? (
        <>
          <View style={styles.compteur}>
            <MaterialCommunityIcons name="inbox-full-outline" size={18} color={COLORS.accent} />
            <Typography variant="label" color={COLORS.textSecondary}>
              {`${dossiers.length} dossier${dossiers.length > 1 ? 's' : ''} en attente`}
            </Typography>
          </View>

          {dossiers.map((dossier) => (
            <View key={`${dossier.kind}-${dossier.id}`} style={styles.dossier}>
              <View style={styles.dossierHaut}>
                <View style={styles.dossierTextes}>
                  <Typography variant="h3" numberOfLines={1}>
                    {dossier.nom}
                  </Typography>
                  <Typography variant="caption" color={COLORS.textLight} style={styles.meta}>
                    {`Déposé le ${formatDate(dossier.createdAt)}`}
                  </Typography>
                </View>

                <Badge
                  text={PROVIDER_STATUS_LABELS[dossier.status]}
                  variant={PROVIDER_STATUS_VARIANTS[dossier.status]}
                />
              </View>

              <View style={styles.puces}>
                <View style={styles.puce}>
                  <MaterialCommunityIcons
                    name={dossier.kind === 'company' ? 'domain' : 'account-badge-outline'}
                    size={14}
                    color={COLORS.textSecondary}
                  />
                  <Typography variant="caption" color={COLORS.textSecondary}>
                    {dossier.kind === 'company' ? 'Société' : 'Agent'}
                  </Typography>
                </View>

                {/*
                 * LA RÉFÉRENCE PEUT ÊTRE VIDE : ELLE EST ALORS OMISE.
                 *
                 * `certification_number` et `siret` sont facultatifs en base. Écrire
                 * « Référence : — » laisserait croire à une référence absente de la
                 * fiche ; ne rien écrire dit la même chose sans inventer de
                 * ligne.
                 */}
                {dossier.reference ? (
                  <View style={styles.puce}>
                    <MaterialCommunityIcons name="certificate-outline" size={14} color={COLORS.textSecondary} />
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      {dossier.reference}
                    </Typography>
                  </View>
                ) : null}
              </View>
            </View>
          ))}

          {/*
           * L'ABSENCE DE DÉCISION EST ANNONCÉE, ET NON DISSIMULÉE.
           *
           * Le tableau `providers` n'a que des statuts, et aucune des 11 RPC ne
           * les fait changer. Un écran de validation sans moyen de valider
           * afficherait une file que rien ne peut vider — l'administrateur
           * reviendrait, retrouverait la même file, et croirait à une panne.
           */}
          <Card style={styles.carte}>
            <Typography variant="h3">Décision hors application</Typography>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
              Cette version lit la file mais ne la modifie pas : aucune fonction
              serveur ne change un statut de prestataire. La validation se fait
              aujourd&apos;hui directement en base.
            </Typography>
          </Card>
        </>
      ) : null}

      {/*
       * LES COMPTEURS SONT INDÉPENDANTS DE LA FILE, ET LEURS ÉCHECS NE SE
       * CONFONDENT PAS.
       *
       * `useStatistiques` et `useDossiersEnAttente` sont deux requêtes
       * séparées, précisément pour qu'une qui échoue n'entraîne pas l'autre. Un
       * compteur affiché en « 0 » quand la lecture a échoué se lirait comme un
       * fait : c'est la faute que `administrationService` refuse par construction.
       */}
      {compteursEnErreur ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Compteurs indisponibles</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
            La file ci-dessus reste fiable, mais les comptements de la plateforme
            n&apos;ont pas pu être lus.
          </Typography>
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
    marginTop: SPACING.lg,
  },
  compteur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  dossier: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    gap: SPACING.md,
  },
  dossierHaut: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  dossierTextes: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    marginTop: 2,
  },
  puces: {
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
