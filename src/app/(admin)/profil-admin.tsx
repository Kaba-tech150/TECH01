import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Typography } from '@/components/ui';
import { COLORS, SCREEN_PADDING, SPACING } from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/utils';

/**
 * Profil de l'espace administrateur.
 *
 * `profile.role` EST REMPLACÉ PAR `roles[0]`, ET C'EST UN CHOIX.
 *
 * La colonne `profiles.role` existe encore en base, mais le rapport de référence
 * la décrit comme fusionnée dans `profile_roles`, et `AuthContext` expose
 * `roles` — la fusion dédupliquée des deux tables, via un `Set`. Un écran qui
 * lit `profile.role` afficherait le rôle par défaut de l'inscription, alors que
 * l'utilisateur peut en porter plusieurs : un administrateur dont le rôle
 * principal a été ajouté ensuite verrait un libellé faux.
 *
 * Même traitement que `(client)/profil-client.tsx`, qui lit déjà `roles[0]`.
 */
export default function AdminProfile() {
  const { user, profile, roles, signOut } = useAuthContext();

  const rolePrincipal = roles[0];
  const qualification = rolePrincipal ? ROLE_DESCRIPTIONS[rolePrincipal] : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Typography variant="h2">Profil administrateur</Typography>
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
          Nom
        </Typography>
        <Typography variant="body">{profile?.full_name || 'Non renseigné'}</Typography>
      </Card>

      <Card style={styles.carte}>
        <Typography variant="h3">Accès</Typography>

        {/*
         * TOUS LES RÔLES SONT LISTÉS, PAS SEULEMENT LE PREMIER.
         *
         * Un compte peut porter plusieurs rôles, et l'écran d'accueil le
         * demande alors lequel utiliser. N'en montrer qu'un ferait croire que
         * les autres n'existent pas. Le premier est mis en avant parce que c'est
         * vers lui que `StartupGate` renvoie.
         */}
        {roles.length > 0 ? (
          roles.map((role) => (
            <View key={role} style={styles.role}>
              <Badge
                text={ROLE_LABELS[role]}
                variant={role === rolePrincipal ? 'primary' : 'neutral'}
              />
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

        {qualification ? (
          <Typography variant="caption" color={COLORS.textLight} style={styles.note}>
            Les droits effectifs sont appliqués par la base, pas par cet écran.
          </Typography>
        ) : null}
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
