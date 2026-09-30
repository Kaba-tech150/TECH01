import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Typography } from '@/components/ui';
import {
  COLORS,
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_VARIANTS,
  SCREEN_PADDING,
  SPACING,
} from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { useMaFicheSociete } from '@/features/companies';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/utils';
import { toUserFacingError } from '@/lib/supabase/errors';

/**
 * Profil de l'espace société.
 *
 * LA FICHE SOCIÉTÉ EST AFFICHÉE, ET C'ÉTAIT LE MANQUE PRINCIPAL.
 *
 * L'écran ne montrait que le nom du titulaire et son rôle, lus dans `profiles`.
 * Il n'affichait pas `company_profiles` — raison sociale, SIRET, adresse, site —
 * alors que `useMaFicheSociete` existe, est écrit, et n'était appelé que par
 * l'accueil. Un gérant de société ouvrait son profil et n'y voyait rien de sa
 * société.
 *
 * AUCUNE ÉCRITURE N'EST PROPOSÉE.
 *
 * `companies.service.ts` le dit dans son en-tête : l'écriture de
 * `company_profiles` n'a jamais été validée de bout en bout, et la lecture reste
 * le seul chemin prouvé. Un formulaire d'édition afficherait des champs que
 * personne n'a jamais enregistrés. L'écran affiche, et rien de plus.
 *
 * L'ABSENCE DE FICHE EST UN ÉTAT, PAS UNE ERREUR.
 *
 * `getMyCompanyProfile` renvoie `null` — et non une erreur — tant que la société
 * n'existe pas : `maybeSingle()` est utilisé pour cela. C'est l'état de départ
 * normal d'un compte inscrit, pas une panne.
 */
export default function CompanyProfile() {
  const { user, profile, roles, signOut } = useAuthContext();
  const { data: fiche, isPending, isError, error, refetch, isFetching } = useMaFicheSociete(
    user?.id,
  );

  const messageErreur = toUserFacingError(
    error,
    'Impossible de charger la fiche de votre société.',
  ).message;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Typography variant="h2">Profil société</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.sousTitre}>
        Votre compte et vos accès
      </Typography>

      <Card style={styles.carte}>
        <Typography variant="h3">Identité</Typography>

        <Typography variant="label" color={COLORS.textSecondary} style={styles.champ}>
          Email
        </Typography>
        <Typography variant="body">{user?.email ?? 'Non renseigné'}</Typography>

        <Typography variant="label" color={COLORS.textSecondary} style={styles.champ}>
          Titulaire
        </Typography>
        <Typography variant="body">{profile?.full_name || 'Non renseigné'}</Typography>
      </Card>

      <Typography variant="overline" color={COLORS.textLight} uppercase>
        fiche société
      </Typography>
      {isPending ? (
        <Card style={styles.carte}>
          <Typography variant="caption" color={COLORS.textSecondary}>
            Chargement de votre fiche…
          </Typography>
        </Card>
      ) : null}

      {isError ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Fiche indisponible</Typography>
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

      {!isPending && !isError && fiche === null ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Aucune fiche société</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
            Ce compte n&apos;a pas encore de société rattachée. Tant qu&apos;il
            n&apos;en a pas, il ne peut pas recevoir de mission.
          </Typography>
        </Card>
      ) : null}

      {fiche ? (
        <Card style={styles.carte}>
          <View style={styles.raisonHaut}>
            <Typography variant="h3" style={styles.raison}>
              {fiche.companyName}
            </Typography>
            <Badge
              text={PROVIDER_STATUS_LABELS[fiche.status]}
              variant={PROVIDER_STATUS_VARIANTS[fiche.status]}
            />
          </View>

          {/*
           * LES CHAMPS VIDE SONT OMIS, ET NON REMPLIS PAR UN TIRET.
           *
           * `siret`, `address`, `city`, `postal_code`, `website` et
           * `description` sont tous facultatifs en base. Afficher « SIRET : — »
           * ferait croire à un champ vide dans un formulaire, alors que rien
           * n'est éditable ici : la ligne est simplement absente.
           */}
          {fiche.siret ? (
            <>
              <Typography variant="label" color={COLORS.textSecondary} style={styles.champ}>
                SIRET
              </Typography>
              <Typography variant="body">{fiche.siret}</Typography>
            </>
          ) : null}

          {fiche.address ? (
            <>
              <Typography variant="label" color={COLORS.textSecondary} style={styles.champ}>
                Adresse
              </Typography>
              <Typography variant="body">
                {[
                  fiche.address,
                  [fiche.postalCode, fiche.city].filter(Boolean).join(' '),
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
            </>
          ) : null}

          {fiche.website ? (
            <>
              <Typography variant="label" color={COLORS.textSecondary} style={styles.champ}>
                Site
              </Typography>
              <Typography variant="body">{fiche.website}</Typography>
            </>
          ) : null}

          {fiche.description ? (
            <>
              <Typography variant="label" color={COLORS.textSecondary} style={styles.champ}>
                Présentation
              </Typography>
              <Typography variant="body">{fiche.description}</Typography>
            </>
          ) : null}

          <Typography variant="caption" color={COLORS.textLight} style={styles.note}>
            Cette fiche est en lecture seule. La modification n&apos;est pas
            encore disponible dans l&apos;application.
          </Typography>
        </Card>
      ) : null}

      <Card style={styles.carte}>
        <Typography variant="h3">Accès</Typography>
        {roles.length > 0 ? (
          roles.map((role) => (
            <View key={role} style={styles.role}>
              <Badge text={ROLE_LABELS[role]} variant="primary" />
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.roleTexte}>
                {ROLE_DESCRIPTIONS[role]}
              </Typography>
            </View>
          ))
        ) : (
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.champ}>
            Aucun rôle attribué à ce compte.
          </Typography>
        )}
      </Card>

      <Button title="Se déconnecter" icon="logout" variant="outline" onPress={() => void signOut()} />
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
  raisonHaut: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  raison: {
    flex: 1,
  },
  champ: {
    marginTop: SPACING.md,
  },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  roleTexte: {
    flex: 1,
  },
  note: {
    marginTop: SPACING.lg,
  },
});
