import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Typography } from '@/components/ui';
import {
  BORDER_RADIUS,
  COLORS,
  HAIRLINE,
  SCREEN_PADDING,
  SPACING,
} from '@/constants';
import { getRoleHomeRoute } from '@/lib/utils';
import { useAuthContext } from '@/context/AuthContext';

/**
 * Écran « page introuvable », rendu par Expo Router pour toute URL qui ne
 * correspond à aucune route.
 *
 * CE QUI L'A RENDU NÉCESSAIRE — un défaut constaté à l'écran, pas relu.
 *
 * Le 2026-09-30, quatre fichiers `profile.tsx` — un par groupe — produisaient
 * la même URL publique `/profile`, parce qu'un groupe entre parenthèses n'entre
 * pas dans l'URL. Le commanditaire a ouvert `localhost:8081/profile` et n'a
 * rien vu. Le lien a été désambiguïsé, mais **la classe de problème est
 * restée** : toute URL erronée, faute de frappe ou de lien périmé, affichait
 * un écran vide sans explication. Un écran qui ne dit rien fait perdre du temps
 * à celui qui le regarde, et lui laisse croire à un bug.
 *
 * CE QUE CET ÉCRAN NE FAIT PAS.
 *
 * Il n'imagine rien. Il ne dit pas « la page demandée n'existe pas » parce que
 * ce serait une affirmation : l'URL est peut-être valide et le code cassé. Il
 * constate, propose les deux issues réelles — revenir chez soi, ou se
 * déconnecter — et affiche l'URL fautive pour que l'utilisateur puisse la
 * transmettre. C'est la différence entre une erreur et un mur.
 *
 * AUCUN ÉCRAN DE CE TYPE N'EXISTAIT. Le dossier `src/app` ne contenait aucun
 * fichier `+not-found.tsx` : vérifié le 2026-09-30.
 */
export default function NotFoundScreen() {
  const router = useRouter();
  const { user, roles } = useAuthContext();
  const params = useLocalSearchParams<{ path?: string }>();

  /*
   * LE CHEMIN REÇU N'EST PAS RÉAFFICHÉ BRUT.
   *
   * `useLocalSearchParams` renvoie un objet dont chaque valeur peut être un
   * tableau si le segment est répétitif : l'afficher tel quel laisserait
   * « sujet,objet » dans l'écran, et `[object Object]` si la valeur est un objet.
   * On n'en garde que la première occurrence, et on la nettoie.
   */
  const brut = Array.isArray(params.path) ? params.path[0] : params.path;
  const chemin = typeof brut === 'string' ? brut.replace(/^\/+/, '') : '';

  /*
   * LA DESTINATION PAR DÉFAUT DÉPEND DE LA SESSION, PAS DU HASARD.
   *
   * Un utilisateur connecté n'a rien à faire sur l'écran de connexion : le
   * renvoyer vers `/(client)` le laisserait devant une garde qui le refuserait
   * s'il est prestataire, et il retomberait ici — une boucle. `getRoleHomeRoute`
   * renvoie l'accueil du bon rôle, celui vers lequel `StartupGate` envoie
   * lui-même. Sans session, il n'y a rien d'autre à proposer que la connexion.
   */
  const rolePrincipal = roles[0];
  const destination = user && rolePrincipal ? getRoleHomeRoute(rolePrincipal) : '/(auth)/sign-in';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pictogramme}>
        <MaterialCommunityIcons name="compass-off-outline" size={34} color={COLORS.accent} />
      </View>

      <Typography variant="overline" color={COLORS.textLight} uppercase>
        Erreur 404
      </Typography>

      <Typography variant="h1" style={styles.titre}>
        Cette page n&apos;existe pas
      </Typography>

      <Typography variant="body" color={COLORS.textSecondary} style={styles.explication}>
        L&apos;adresse demandée ne correspond à aucun écran de SecuGuard. Elle a
        peut-être été mal saisie, ou le lien que vous avez suivi n&apos;est plus
        à jour.
      </Typography>

      {/*
       * L'ADRESSE EST REPRÉSENTÉE, ET NON DÉCLINÉE EN « /profil » OU
       * « /profile ».
       *
       * L'utilisateur a saisi quelque chose. Lui dire « voici les pages
       * possibles » l'oblige à deviner, et c'est précisément l'effort qu'on
       * cherche à lui éviter. La chaîne est affichée telle qu'elle a été
       * reçue : c'est la seule information qui lui permette de comprendre ce
       * qui s'est passé, et de le signaler.
       */}
      <View style={styles.adresse}>
        <MaterialCommunityIcons name="link-variant-off" size={16} color={COLORS.textLight} />
        <Typography variant="label" color={COLORS.textSecondary} style={styles.adresseTexte}>
          {chemin ? `/${chemin}` : 'Adresse inconnue'}
        </Typography>
      </View>

      <View style={styles.actions}>
        <Button
          title="Revenir à l'accueil"
          icon="home-outline"
          onPress={() => router.replace(destination)}
        />
        <Button
          title="Se déconnecter"
          variant="outline"
          icon="logout"
          onPress={() => router.replace('/(auth)/sign-in')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: SPACING.xxxl,
  },
  pictogramme: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  titre: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  explication: {
    marginBottom: SPACING.xl,
  },
  adresse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: HAIRLINE,
    marginBottom: SPACING.xl,
  },
  adresseTexte: {
    flex: 1,
  },
  actions: {
    gap: SPACING.md,
  },
});