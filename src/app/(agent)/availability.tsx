import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Badge, Button, Card, Typography } from '@/components/ui';
import { COLORS, SPACING } from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { useChangerDisponibilite, useMaFicheAgent } from '@/features/prestataires';
import { logTechnicalError, toUserFacingError } from '@/lib/supabase/errors';

/**
 * Disponibilité de l'agent.
 *
 * UN INTERRUPTEUR, ET UNE SEULE DONNÉE : `is_available`.
 *
 * La colonne existe depuis le schéma, elle est lue par la recherche — c'est
 * elle qui produit le badge « Disponible » — et elle est accordée en ÉCRITURE
 * par le `grant update` de `00300`. L'écran manquait, et rien d'autre.
 *
 * LE STATUT EST VISIBLE PAR LES CLIENTS. C'est la seule chose que cet écran
 * change, et c'est écrit à l'écran : un agent qui se met « disponible » sans
 * le savoir comprendrait pourquoi il reçoit des demandes.
 *
 * CE QUE CET ÉCRAN NE FAIT PAS
 *
 * Il ne gère pas un calendrier, ni des créneaux, ni des indisponibilités
 * ponctuelles. `agent_profiles` n'a qu'un booléen, et une plage horaire
 * imaginaire serait pire qu'une absence : elle afficherait une précision que la
 * base ne peut pas garantir.
 */
export default function AgentAvailability() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { data: fiche, isPending, isError, error } = useMaFicheAgent(user?.id);
  const changer = useChangerDisponibilite();

  /*
   * L'ÉTAT AFFICHÉ EST LOCAL, ET NON RELU DE LA BASE.
   *
   * L'invalidation du cache est asynchrone : l'écran changerait de couleur une
   * fraction de seconde après le geste, ou pas du tout si la requête échouait.
   * En l'écrivant localement, l'interrupteur répond tout de suite, et la base
   * suit.
   *
   * C'est pourquoi l'écriture n'est pas optimiste : l'utilisateur peut attendre
   * la confirmation du serveur avant de croire que c'est enregistré.
   */
  const [affiche, setAffiche] = useState<boolean | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const disponible = affiche ?? fiche?.isAvailable ?? false;
  const enGeste = changer.isPending;

  if (isPending) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (isError) {
    logTechnicalError('lire la fiche agent', error);
    return (
      <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
        <Card style={styles.carte}>
          <Typography variant="h3">Chargement impossible</Typography>
          <Typography
            variant="caption"
            color={COLORS.textSecondary}
            style={styles.texte}
          >
            {toUserFacingError(error, 'Impossible de charger votre fiche.').message}
          </Typography>
        </Card>
      </ScrollView>
    );
  }

  if (!fiche) {
    return (
      <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
        <Card style={styles.carte}>
          <Typography variant="h3">Aucune fiche professionnelle</Typography>
          <Typography
            variant="caption"
            color={COLORS.textSecondary}
            style={styles.texte}
          >
            Renseignez d’abord votre fiche : la disponibilité s’applique à un
            prestataire, et un compte sans fiche n’existe pas du côté des
            clients.
          </Typography>
          <Button
            title="Créer ma fiche"
            onPress={() => router.push('/(agent)/profil-agent')}
          />
        </Card>
      </ScrollView>
    );
  }

  const basculer = async (valeur: boolean) => {
    setErreur(null);
    setAffiche(valeur);
    try {
      await changer.mutateAsync({ ficheId: fiche.id, isAvailable: valeur });
    } catch (e) {
      // L'affichage revient à sa valeur précédente : laisser l'interrupteur sur
      // une valeur que la base n'a pas enregistrée serait un mensonge.
      setAffiche(null);
      logTechnicalError('changer la disponibilité', e);
      setErreur(
        toUserFacingError(e, 'Impossible d’enregistrer votre disponibilité.').message,
      );
    }
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Typography variant="h2" style={styles.titre}>
        Disponibilités
      </Typography>
      <Typography
        variant="caption"
        color={COLORS.textSecondary}
        style={styles.sousTitre}
      >
        Les clients voient ce statut dans les résultats de recherche
      </Typography>

      <Card style={styles.carte}>
        <View style={styles.ligne}>
          <View style={styles.texteLigne}>
            <Typography variant="h3">Disponible</Typography>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.legende}
            >
              {disponible
                ? 'Vous apparaissez comme disponible. Vous pouvez être reservé.'
                : 'Vous n’apparaissez pas comme disponible dans les recherches.'}
            </Typography>
          </View>
          <Switch
            value={disponible}
            onValueChange={(valeur) => void basculer(valeur)}
            disabled={enGeste}
            accessibilityLabel="Passer disponible ou indisponible"
            trackColor={{ false: COLORS.border, true: COLORS.success }}
            thumbColor={COLORS.surfaceContainerLowest}
          />
        </View>

        <View style={styles.badge}>
          <Badge
            text={disponible ? 'Disponible' : 'Indisponible'}
            variant={disponible ? 'success' : 'neutral'}
          />
        </View>

        {erreur ? (
          <Typography
            variant="caption"
            color={COLORS.error}
            style={styles.erreur}
          >
            {erreur}
          </Typography>
        ) : null}
      </Card>

      <Card style={styles.carte}>
        <Typography variant="h3">Ce que cet écran ne gère pas</Typography>
        <Typography
          variant="caption"
          color={COLORS.textSecondary}
          style={styles.texte}
        >
          Les créneaux, les jours de repos et les indisponibilités
          ponctuelles. Le modèle ne les contient pas encore : n’afficher qu’un
          oui ou qu’un non est plus honnête qu’un calendrier qui ne réfléchirait
          rien.
        </Typography>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contenu: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  titre: {
    marginBottom: SPACING.sm,
  },
  sousTitre: {
    marginBottom: SPACING.lg,
  },
  carte: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  texteLigne: {
    flex: 1,
  },
  legende: {
    marginTop: 2,
    lineHeight: 18,
  },
  badge: {
    flexDirection: 'row',
  },
  erreur: {
    marginTop: SPACING.xs,
  },
  texte: {
    lineHeight: 20,
  },
});

