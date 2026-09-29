import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Typography } from '@/components/ui';
import { COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';
import {
  CarteAffectation,
  indexerPrestataires,
  useMesAffectations,
  useMissionErrorMessage,
  useNomsPrestataires,
  usePointerAffectation,
  useRepondreAffectation,
  type Pointage,
  type ReponseAffectation,
} from '@/features/missions';

/**
 * Missions reçues par l'agent, et réponse aux demandes.
 *
 * PREMIER ÉCRAN DU CÔTÉ PRESTATAIRE QUI INTERROGE RÉELLEMENT LA BASE.
 *
 * L'espace agent n'affichait jusqu'ici que du texte statique et un bouton vide.
 * C'est ici que la politique `can_view_assignment` est mise à l'épreuve pour la
 * première fois du côté agent, et que `accept_assignment` et
 * `reject_assignment` sont appelées pour la première fois.
 *
 * L'ordre compte : la LECTURE d'abord, la réponse ensuite. Si la liste ne
 * s'affiche pas, le problème est dans la lecture, et le diagnostic n'a qu'une
 * cause. Répondre à une affectation qu'on ne voit pas supposerait l'inverse.
 */
export default function AgentMissions() {
  const router = useRouter();
  const messageErreur = useMissionErrorMessage();
  const [erreurReponse, setErreurReponse] = useState<string | null>(null);

  const { data: affectations, isPending, isError, error, refetch } =
    useMesAffectations();
  const repondre = useRepondreAffectation();
  const pointer = usePointerAffectation();

  /*
   * UN BROUILLON DE RAPPORT PAR AFFECTATION, ET NON UN TEXTE UNIQUE.
   *
   * L'agent peut avoir deux vacations ouvertes. Un `useState<string>` unique
   * lui ferait perdre le rapport du premier au moment où il écrit le second.
   */
  const [rapports, setRapports] = useState<Record<string, string>>({});

  /*
   * LES IDENTIFIANTS SONT EXTRAITS AVANT LA REQUÊTE DE NOMS.
   *
   * La liste est stable tant que les affectations ne changent pas : la clé de
   * cache ne bouge donc pas d'un rendu à l'autre. La reconstruire à chaque
   * rendu — sur un tableau filtré, par exemple — enverrait la requête à chaque
   * fois, et l'écran clignoterait.
   */
  const ids = useMemo(() => {
    const liste: string[] = [];
    for (const affectation of affectations ?? []) {
      const identifiant = affectation.agent_id ?? affectation.company_id;
      if (identifiant) liste.push(identifiant);
    }
    return liste;
  }, [affectations]);

  const noms = useNomsPrestataires(ids);
  const index = useMemo(() => indexerPrestataires(noms.data), [noms.data]);

  /*
   * L'AGENT N'A PEUT-ÊTRE PAS ENCORE DE FICHE.
   *
   * `resolveProviderId` lève alors « Aucun profil agent n'est associé à ce
   * compte ». C'est un état NORMAL, pas une panne : un compte peut être créé
   * avant que sa fiche professionnelle ne soit renseignée.
   *
   * Sans ce cas, l'écran afficherait « Impossible de charger vos missions » et
   * enverrait l'utilisateur chercher une panne qui n'existe pas.
   */
  const pasDeFiche =
    isError &&
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    String(error.message).includes('profil agent');

  const repondreA = async (
    affectationId: string,
    reponse: ReponseAffectation,
  ) => {
    setErreurReponse(null);
    try {
      await repondre.mutateAsync({ affectationId, reponse });
    } catch (e) {
      setErreurReponse(
        messageErreur(e, 'enregistrer', 'Impossible d’enregistrer votre réponse.'),
      );
    }
  };

  const pointerVacation = async (affectationId: string, pointage: Pointage) => {
    setErreurReponse(null);
    try {
      await pointer.mutateAsync({
        affectationId,
        pointage,
        rapport: rapports[affectationId],
      });
      // Le brouillon est effacé APRÈS l'écriture réussie : le conserver
      // donnerait l'illusion que le rapport n'est pas encore parti.
      setRapports((actuels) => {
        const suite = { ...actuels };
        delete suite[affectationId];
        return suite;
      });
    } catch (e) {
      setErreurReponse(
        messageErreur(e, 'enregistrer', 'Impossible d’enregistrer votre pointage.'),
      );
    }
  };

  const enCours = repondre.isPending
    ? repondre.variables?.affectationId
    : pointer.isPending
      ? pointer.variables?.affectationId
      : undefined;

  const enTete = (
    <>
      <Typography variant="h2" style={styles.titre}>
        Mes missions
      </Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.sousTitre}>
        Les demandes que vous avez reçues
      </Typography>
    </>
  );

  if (pasDeFiche) {
    return (
      <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
        {enTete}
        <Card style={styles.carte}>
          <Typography variant="h3">Fiche professionnelle manquante</Typography>
          <Typography
            variant="caption"
            color={COLORS.textSecondary}
            style={styles.texte}
          >
            Renseignez d’abord votre fiche professionnelle : elle est
            obligatoire pour recevoir des missions.
          </Typography>
          <Button
            title="Créer ma fiche"
            onPress={() => router.push('/(agent)/profile')}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      {enTete}

      {isPending ? (
        <View style={styles.centre}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : null}

      {isError ? (
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

      {erreurReponse ? (
        <Card style={styles.carteErreur}>
          <Typography
            variant="caption"
            color={COLORS.textSecondary}
            style={styles.texte}
          >
            {erreurReponse}
          </Typography>
        </Card>
      ) : null}

      {!isPending && !isError && affectations && affectations.length === 0 ? (
        <Card style={styles.carte}>
          <Typography variant="h3">Aucune demande</Typography>
          <Typography
            variant="caption"
            color={COLORS.textSecondary}
            style={styles.texte}
          >
            Vous n’avez pour l’instant reçu aucune mission. Les demandes des
            clients apparaissent ici.
          </Typography>
        </Card>
      ) : null}

      {!isPending && !isError
        ? affectations?.map((affectation) => {
            const prestataireId =
              affectation.agent_id ?? affectation.company_id ?? '';
            const mission = affectation.missions;
            const enAttente = affectation.status === 'pending';
            const acceptee =
              affectation.status === 'accepted' ||
              affectation.status === 'completed';
            const pointe = Boolean(affectation.check_in_time);
            const sorti = Boolean(affectation.check_out_time);
            const occupe = enCours !== undefined;

            return (
              <CarteAffectation
                key={affectation.id}
                status={affectation.status}
                createdAt={affectation.created_at}
                prestataireId={prestataireId}
                prestataire={
                  prestataireId ? index[prestataireId] : undefined
                }
                titreMission={mission?.title}
                lieu={mission ? `${mission.city} · ${mission.address}` : undefined}
                checkInTime={affectation.check_in_time}
                checkOutTime={affectation.check_out_time}
                rapport={affectation.report}
              >
                {/*
                 * LES BOUTONS SUIVENT L'ÉTAT RÉEL DE LA VACATION.
                 *
                 * `is_assignment_agent` refuse toute écriture tant que le
                 * statut n'est pas `accepted` : proposer « Pointer mon arrivée »
                 * sur une demande en attente serait un bouton qui échoue.
                 *
                 * Un seul pointage est proposé à la fois : arrivée, puis départ.
                 * Les deux ensemble permettraient de sortir d'une vacation qu'on
                 * n'a jamais commencée.
                 */}
                {enAttente ? (
                  <>
                    <Button
                      title="Accepter"
                      icon="check"
                      onPress={() => void repondreA(affectation.id, 'accepter')}
                      disabled={occupe}
                    />
                    <Button
                      title="Refuser"
                      variant="outline"
                      onPress={() => void repondreA(affectation.id, 'refuser')}
                      disabled={occupe}
                    />
                  </>
                ) : null}

                {acceptee && !pointe && !sorti ? (
                  <Button
                    title="Pointer mon arrivée"
                    icon="login"
                    onPress={() => void pointerVacation(affectation.id, 'arrivee')}
                    disabled={occupe}
                  />
                ) : null}

                {acceptee && pointe && !sorti ? (
                  <>
                    <TextInput
                      style={styles.rapport}
                      placeholder="Rapport de fin de vacation (facultatif)"
                      placeholderTextColor={COLORS.textLight}
                      value={rapports[affectation.id] ?? ''}
                      onChangeText={(texte) =>
                        setRapports((actuels) => ({
                          ...actuels,
                          [affectation.id]: texte,
                        }))
                      }
                      multiline
                      numberOfLines={3}
                    />
                    <Button
                      title="Pointer mon départ"
                      icon="logout"
                      onPress={() => void pointerVacation(affectation.id, 'depart')}
                      disabled={occupe}
                    />
                  </>
                ) : null}

                {/*
                 * UN BOUTON, ET NON UNE CARTE ENTIÈRE ACTIONNABLE.
                 *
                 * `CarteAffectation` reçoit des boutons en `children` : en faire
                 * une carte cliquable poserait un bouton dans un bouton. Sur
                 * native le geste interne l'emporte, sur le web les deux
                 * déclenchent — un pointage partirait deux fois. Le lien est donc
                 * explicite, et il mène au même écran que celui de l'accueil.
                 */}
                <Button
                  title="Ouvrir la mission"
                  icon="arrow-expand-all"
                  variant="ghost"
                  size="md"
                  onPress={() =>
                    router.push({
                      pathname: '/(agent)/mission/[id]',
                      params: { id: affectation.id },
                    })
                  }
                  disabled={occupe}
                />
              </CarteAffectation>
            );
          })
        : null}
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
  titre: {
    marginBottom: SPACING.sm,
  },
  sousTitre: {
    marginBottom: SPACING.lg,
  },
  centre: {
    paddingVertical: SPACING.xxl,
  },
  carte: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
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
  rapport: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    textAlignVertical: 'top',
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
});

