import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common';
import {
  ActionTile,
  Badge,
  BandeauNavy,
  Button,
  Card,
  SectionHeader,
  StatTile,
  Typography,
} from '@/components/ui';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_VARIANTS,
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  HAIRLINE,
  SCREEN_PADDING,
  SHADOWS,
  SPACING,
} from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { useMesAffectations, useRepondreAffectation } from '@/features/missions';
import { usePortefeuille } from '@/features/portefeuille';
import { useChangerDisponibilite, useMaFicheAgent } from '@/features/prestataires';
import { logTechnicalError } from '@/lib/supabase/errors';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';

/**
 * Accueil de l'agent indépendant — reconstruction de
 * `design/secuguard_accueil_agent_ind_pendant.html`.
 *
 * LA MAQUETTE EST UN POSTE DE SUPERVISION, L'APPLICATION EST UNE PLACE DE
 * MARCHÉ. CHAQUE BLOC EST DONC RECONSTRUIT SUR CE QUE LA BASE DIT RÉELLEMENT.
 *
 *   - « Karim Mansouri / Agent de Sécurité Privée » → nom de `profiles`, zone de
 *     `agent_profiles.zone`, agrément de `certification_number`.
 *   - « Portefeuille du mois · 2 840,00 € » → `wallets.balance` et
 *     `blocked_balance`, qui sont des soldes RÉELS. En revanche « Cumul net
 *     avant prélèvement » et « Taux horaire moy. » supposeraient une règle de
 *     commission, encore à confirmer (étape 10) : l'écran affiche donc les deux
 *     soldes et le tarif horaire réellement saisi par l'agent.
 *   - « Vacation Confirmée » → l'affectation dont l'arrivée est pointée et le
 *     départ non, avec ses horaires de pointage.
 *   - « Missions en direct · 220 € » → les affectations `pending` reçues. Le
 *     montant n'apparaît que si `proposed_rate` le porte : aucun prix inventé.
 *   - « Conformité CNAPS & Diplômes » → statut réel de la fiche et
 *     certification, quand elle est renseignée.
 *   - NFC, Waze, astreinte, « 14 PC de sécurité » → fonctions absentes du
 *     modèle. Retirées, pas simulées.
 *
 * AUCUN CHIFFRE N'EST FIGÉ DANS CE FICHIER : tout vient d'une lecture, et un
 * compteur à zéro est un compteur à zéro.
 */
export default function AgentIndex() {
  const router = useRouter();
  const { user, profile } = useAuthContext();

  const {
    data: fiche,
    isPending: ficheEnCours,
    isError: ficheEnErreur,
    error: erreurFiche,
  } = useMaFicheAgent(user?.id);
  const { data: affectations, isPending: missionsEnCours } = useMesAffectations();
  const { data: portefeuille, isPending: portefeuilleEnCours } = usePortefeuille(user?.id);
  const repondre = useRepondreAffectation();
  const disponibilite = useChangerDisponibilite();

  /*
   * L'AGENT PEUT N'AVOIR ENCORE DE FICHE.
   *
   * `resolveProviderId` lève alors « Aucun profil agent n'est associé à ce
   * compte ». C'est un état de DÉPART normal — un compte peut être créé avant que
   * sa fiche ne soit renseignée — et non une panne. L'écran affiche donc un
   * appel à l'action, et le détail technique reste au journal.
   */
  useEffect(() => {
    if (ficheEnErreur) {
      logTechnicalError('lire la fiche agent (accueil)', erreurFiche);
    }
  }, [ficheEnErreur, erreurFiche]);

  const pasDeFiche =
    ficheEnErreur &&
    typeof erreurFiche === 'object' &&
    erreurFiche !== null &&
    'message' in erreurFiche &&
    String(erreurFiche.message).includes('profil agent');

  /*
   * LA VACATION EN COURS EST CELLE DONT L'ARRIVÉE EST POINTÉE ET LE DÉPART NON.
   *
   * C'est la seule définition qu'on puisse tirer de `check_in_time` et
   * `check_out_time`. Une affectation `accepted` sans arrivée n'est pas « en
   * vacation » : l'agent ne s'est pas encore présenté. Une affectation terminée
   * n'y est plus.
   */
  const vacationEnCours = useMemo(
    () =>
      (affectations ?? []).find(
        (affectation) =>
          affectation.status === 'accepted' &&
          Boolean(affectation.check_in_time) &&
          !affectation.check_out_time,
      ),
    [affectations],
  );

  /* Les demandes qui attendent une réponse. */
  const demandes = useMemo(
    () => (affectations ?? []).filter((affectation) => affectation.status === 'pending'),
    [affectations],
  );

  const total = affectations?.length ?? 0;
  const terminees =
    affectations?.filter((affectation) => affectation.status === 'completed').length ?? 0;

  const nomAffiche = profile?.full_name?.trim() || 'Agent de sécurité';

  /*
   * LE TARIF EST AFFICHÉ SEULEMENT S'IL EST RENSEIGNÉ.
   *
   * `hourly_rate` est facultatif. Écrire « 0,00 €/h » pour une fiche sans tarif
   * donnerait l'impression d'une gratuité, alors que c'est une absence
   * d'information — que l'agent peut corriger depuis son profil.
   */
  const tarifSaisi = fiche?.hourlyRate ? Number.parseFloat(fiche.hourlyRate) : Number.NaN;
  const tarif =
    Number.isFinite(tarifSaisi) && tarifSaisi > 0 ? `${formatCurrency(tarifSaisi)}/h` : null;

  const estDisponible = fiche?.isAvailable ?? false;
  const chargement = ficheEnCours || missionsEnCours;

  /*
   * LE SOLDE N'EST ÉCRIT QUE SI LA LIGNE EXISTE.
   *
   * `getPortefeuille` renvoie `null` quand le trigger d'inscription n'a rien
   * créé — ce n'est pas un solde à zéro, c'est une absence de ligne. On affiche
   * donc un tiret tant que la lecture n'a abouti, et un tiret aussi quand elle
   * a abouti sur `null` : sans cela, un compte sans portefeuille afficherait
   * « 0,00 € », ce qui est un mensonge sur son argent.
   */
  const soldeDisponible =
    portefeuille && !portefeuilleEnCours ? formatCurrency(portefeuille.balance) : '—';
  const soldeBloque =
    portefeuille && !portefeuilleEnCours ? formatCurrency(portefeuille.blockedBalance) : '—';

  /**
   * Bascule la disponibilité depuis la tuile d'action.
   *
   * L'ERREUR EST JOURNALISÉE ET NON AFFICHÉE ICI, VOLONTAIREMENT.
   *
   * L'accueil n'a pas de bandeau d'erreur et n'en faut pas : la tuile affiche
   * l'état réel relu de la base après l'invalidation. Un message ici
   * disparaîtrait au rendu suivant sans rien apprendre, alors que l'utilisateur
   * voit déjà l'interrupteur ne pas bouger.
   */
  const basculerDisponibilite = async (actuelle: boolean) => {
    if (!fiche) return;

    try {
      await disponibilite.mutateAsync({ ficheId: fiche.id, isAvailable: !actuelle });
    } catch (erreur) {
      logTechnicalError('basculer la disponibilité', erreur);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader onPressProfile={() => router.push('/(agent)/profile')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* =================================================
            IDENTITÉ ET DISPONIBILITÉ
            ================================================= */}

        <View style={styles.identite}>
          <View style={styles.identiteLigne}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitiale}>
                {nomAffiche.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.identiteTexte}>
              <Text style={styles.identiteNom} numberOfLines={1}>
                {nomAffiche}
              </Text>
              <Text style={styles.identiteQualite} numberOfLines={1}>
                {fiche?.zone ? `Zone ${fiche.zone}` : 'Zone non renseignée'}
              </Text>
            </View>
          </View>

          {/* Numéro d'agrément : affiché s'il existe, jamais remplacé. */}
          {fiche?.certificationNumber ? (
            <View style={styles.agrement}>
              <MaterialCommunityIcons
                name="shield"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.agrementTexte} numberOfLines={1}>
                {fiche.certificationNumber}
              </Text>
            </View>
          ) : null}

          <View style={styles.disponibilite}>
            <View style={styles.disponibilitePip} />
            <View style={styles.disponibiliteTexte}>
              <Text style={styles.disponibiliteTitre}>
                {estDisponible ? 'Disponible' : 'Indisponible'}
              </Text>
              <Text style={styles.disponibiliteLegende} numberOfLines={2}>
                {ficheEnCours
                  ? 'Lecture de votre fiche…'
                  : estDisponible
                    ? 'Vous apparaissez dans les recherches clients.'
                    : 'Vous n’apparaissez pas dans les recherches clients.'}
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            FICHE ABSENTE : ÉTAT DE DÉPART, PAS D'ERREUR
            ================================================= */}

        {pasDeFiche ? (
          <Card variant="secondary" style={styles.carte}>
            <Typography variant="h3">Complétez votre fiche</Typography>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.texte}>
              Tant que votre fiche professionnelle n’existe pas, aucune mission ne
              peut vous être proposée. Elle prend deux minutes.
            </Typography>
            <Button
              title="Renseigner ma fiche"
              icon="card-account-details-outline"
              onPress={() => router.push('/(agent)/profile')}
              fullWidth={false}
            />
          </Card>
        ) : null}

        {/* =================================================
            BANDEAU D'ACTION
            ================================================= */}

        <BandeauNavy
          eyebrow="Espace prestataire"
          title="Missions entrantes"
          description="Consultez les demandes que les clients vous adressent, et répondez en un geste."
          icon="radar"
          primaryAction={{
            label: 'Voir mes demandes',
            icon: 'clipboard-text-outline',
            onPress: () => router.push('/(agent)/missions'),
            accessibilityLabel: `Voir mes demandes, ${demandes.length} en attente`,
          }}
          secondaryAction={{
            label: 'Gérer mes disponibilités',
            icon: 'calendar-clock-outline',
            onPress: () => router.push('/(agent)/availability'),
          }}
          pulsante={demandes.length > 0}
        />

        {/* =================================================
            COMPTEURS
            ================================================= */}

        <View style={styles.compteurs}>
          <StatTile
            value={String(demandes.length)}
            label="Demandes en attente"
            icon="bell-ring-outline"
            iconVariant={demandes.length > 0 ? 'accent' : 'neutral'}
          />
          <StatTile
            value={String(terminees)}
            label="Missions terminées"
            icon="check-decagram-outline"
          />
          <StatTile
            value={String(total)}
            label="Missions reçues"
            icon="clipboard-check-outline"
          />
        </View>

        {/* =================================================
            VACATION EN COURS
            ================================================= */}

        <View style={styles.section}>
          <SectionHeader
            title="Vacation en cours"
            trailing={vacationEnCours ? 'En poste' : undefined}
          />

          {vacationEnCours ? (
            <Card variant="secondary" style={styles.carte}>
              <View style={styles.carteHaut}>
                <Text style={styles.carteTitre} numberOfLines={2}>
                  {vacationEnCours.missions?.title ?? 'Mission affectée'}
                </Text>
                <Badge
                  text={ASSIGNMENT_STATUS_LABELS[vacationEnCours.status]}
                  variant={ASSIGNMENT_STATUS_VARIANTS[vacationEnCours.status]}
                />
              </View>

              {vacationEnCours.missions?.address ? (
                <View style={styles.meta}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={14}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.metaTexte} numberOfLines={1}>
                    {vacationEnCours.missions.address}, {vacationEnCours.missions.city}
                  </Text>
                </View>
              ) : null}

              {vacationEnCours.check_in_time ? (
                <View style={styles.meta}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={14}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.metaTexte}>
                    Arrivée pointée à {formatDate(vacationEnCours.check_in_time, 'time')}
                  </Text>
                </View>
              ) : null}

              <View style={styles.creneau}>
                <Text style={styles.creneauLibelle}>Créneau prévu</Text>
                <Text style={styles.creneauValeur}>
                  {vacationEnCours.missions
                    ? `${formatDate(vacationEnCours.missions.start_time, 'short')} → ${formatDate(vacationEnCours.missions.end_time, 'short')}`
                    : 'Non renseigné'}
                </Text>
              </View>

              {/*
               * LE SEUL ACCÈS À L'ÉCRAN D'EXÉCUTION, DEPUIS L'ACCUEIL.
               *
               * C'est la vacation en cours qui s'y rattache : l'affectation dont
               * l'arrivée est pointée et le départ non. Les autres s'ouvrent
               * depuis la liste des missions, où l'agent répond d'abord à la
               * demande.
               */}
              <Button
                title="Ouvrir le poste"
                icon="shield-check-outline"
                variant="secondary"
                size="md"
                onPress={() =>
                  router.push({
                    pathname: '/(agent)/mission/[id]',
                    params: { id: vacationEnCours.id },
                  })
                }
              />
            </Card>
          ) : (
            /*
             * ÉTAT VIDE EXPLICITE, ET NON UN BLOC MASQUÉ.
             *
             * « Aucune vacation en cours » est une information : c'est l'absence
             * de pointage. Le retirer laisserait croire que la section a échoué
             * à s'afficher.
             */
            <Card variant="secondary" style={styles.carte}>
              <Typography variant="h3">Aucune vacation en cours</Typography>
              <Typography
                variant="caption"
                color={COLORS.textSecondary}
                style={styles.texte}
              >
                {missionsEnCours
                  ? 'Lecture de vos affectations…'
                  : 'Vos pointages d’arrivée et de départ apparaîtront ici.'}
              </Typography>
            </Card>
          )}
        </View>

        {/* =================================================
            DEMANDES EN ATTENTE
            ================================================= */}

        {demandes.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Demandes à traiter"
              actionLabel="Tout voir"
              onPressAction={() => router.push('/(agent)/missions')}
            />

            {demandes.map((affectation) => (
              <Card key={affectation.id} variant="secondary" style={styles.carte}>
                <View style={styles.carteHaut}>
                  <Text style={styles.carteTitre} numberOfLines={2}>
                    {affectation.missions?.title ?? 'Mission'}
                  </Text>
                  {/*
                   * LE MONTANT N'EST AFFICHÉ QUE SI `proposed_rate` EST RENSEIGNÉ.
                   *
                   * `missions.budget` est un budget global saisi par le client, et
                   * `proposed_rate` un tarif proposé. Ni l'un ni l'autre n'est un
                   * prix ferme : la facturation est l'étape 10, non confirmée.
                   * Afficher un prix qui n'existe pas en base serait inventer la
                   * première décision de cette étape.
                   */}
                  {affectation.proposed_rate !== null &&
                  affectation.proposed_rate !== undefined ? (
                    <Text style={styles.montant}>
                      {formatCurrency(affectation.proposed_rate)}
                    </Text>
                  ) : null}
                </View>

                {affectation.missions ? (
                  <View style={styles.meta}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={14}
                      color={COLORS.textLight}
                    />
                    <Text style={styles.metaTexte} numberOfLines={1}>
                      {affectation.missions.city} ·{' '}
                      {formatDate(affectation.missions.start_time, 'short')}
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.relative}>
                  Reçue {formatRelativeTime(affectation.created_at)}
                </Text>

                <View style={styles.actions}>
                  <Button
                    title="Accepter"
                    icon="check"
                    size="md"
                    onPress={() =>
                      void repondre
                        .mutateAsync({
                          affectationId: affectation.id,
                          reponse: 'accepter',
                        })
                        .catch((erreur: unknown) => {
                          logTechnicalError('accepter une affectation', erreur);
                        })
                    }
                    disabled={repondre.isPending}
                    style={styles.actionPrincipale}
                  />
                  <Button
                    title="Refuser"
                    variant="outline"
                    size="md"
                    fullWidth={false}
                    onPress={() =>
                      void repondre
                        .mutateAsync({
                          affectationId: affectation.id,
                          reponse: 'refuser',
                        })
                        .catch((erreur: unknown) => {
                          logTechnicalError('refuser une affectation', erreur);
                        })
                    }
                    disabled={repondre.isPending}
                  />
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* =================================================
            PORTEFEUILLE
            ================================================= */}

        <View style={styles.section}>
          <SectionHeader title="Mon portefeuille" />

          <Card variant="secondary" style={styles.carte}>
            <View style={styles.soldeLigne}>
              <View style={styles.soldeBloc}>
                <Text style={styles.soldeLibelle}>Solde disponible</Text>
                <Text style={styles.soldeValeur}>{soldeDisponible}</Text>
              </View>

              <View style={styles.soldeBloc}>
                <Text style={styles.soldeLibelle}>Sous séquestre</Text>
                <Text style={styles.soldeValeur}>{soldeBloque}</Text>
              </View>
            </View>

            {tarif ? (
              <View style={styles.tarif}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={14}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.tarifTexte}>Tarif horaire {tarif}</Text>
              </View>
            ) : null}

            {/*
             * LE PAIEMENT N'EST PAS ENCORE CÂBLÉ, ET L'ÉCRAN LE DIT.
             *
             * Les fonds existent en base — `blocked_balance` est un vrai solde —
             * mais aucune fonction serveur ne les libère : l'étape 10 n'est pas
             * faite. Un « encaisser » qui ne ferait rien serait le pire des
             * écrans, alors qu'annoncer ce qui manque est exact.
             */}
            <Text style={styles.mention}>
              Le versement des sommes reste manuel tant que le module de paiement
              n’est pas activé.
            </Text>
          </Card>
        </View>

        {/* =================================================
            ACTIONS RAPIDES
            ================================================= */}

        <View style={styles.section}>
          <SectionHeader title="Actions rapides" />
          <View style={styles.grille}>
            <ActionTile
              title="Mes missions"
              subtitle={`${total} reçue${total > 1 ? 's' : ''}`}
              icon="clipboard-text-outline"
              iconVariant="secondary"
              onPress={() => router.push('/(agent)/missions')}
            />
            <ActionTile
              title="Disponibilités"
              subtitle={estDisponible ? 'Disponible' : 'Indisponible'}
              icon="calendar-clock-outline"
              onPress={() => router.push('/(agent)/availability')}
            />
            <ActionTile
              title="Ma fiche"
              subtitle="Zone, tarif, bio"
              icon="card-account-details-outline"
              onPress={() => router.push('/(agent)/profile')}
            />
            <ActionTile
              title="Ma disponibilité"
              subtitle={estDisponible ? 'En service' : 'Hors service'}
              icon={estDisponible ? 'power' : 'power-sleep'}
              onPress={() => void basculerDisponibilite(estDisponible)}
            />
          </View>
        </View>

        {chargement ? (
          <Text style={styles.chargement}>Lecture de votre espace…</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },

  /* --- Identité --- */

  identite: {
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  identiteLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitiale: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.onWhite,
  },
  identiteTexte: {
    flex: 1,
    minWidth: 0,
  },
  identiteNom: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.xxl,
    lineHeight: 26,
    color: COLORS.text,
  },
  identiteQualite: {
    marginTop: 2,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  agrement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agrementTexte: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  disponibilite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  disponibilitePip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  disponibiliteTexte: {
    flex: 1,
    minWidth: 0,
  },
  disponibiliteTitre: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  disponibiliteLegende: {
    marginTop: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
    color: COLORS.textSecondary,
  },

  /* --- Sections et cartes --- */

  section: {
    gap: SPACING.md,
  },
  carte: {
    gap: SPACING.xs,
  },
  carteHaut: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  carteTitre: {
    flex: 1,
    fontFamily: FONT_FAMILIES.displaySemibold,
    fontSize: FONT_SIZES.lg,
    lineHeight: 22,
    color: COLORS.text,
  },
  montant: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaTexte: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  relative: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  creneau: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
  },
  creneauLibelle: {
    width: 96,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  creneauValeur: {
    flex: 1,
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  texte: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionPrincipale: {
    flex: 1,
  },

  /* --- Compteurs --- */

  compteurs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  /* --- Portefeuille --- */

  soldeLigne: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  soldeBloc: {
    flex: 1,
    gap: 2,
  },
  soldeLibelle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  soldeValeur: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 32,
    color: COLORS.text,
  },
  tarif: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tarifTexte: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  mention: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    color: COLORS.textLight,
  },

  /* --- Grille et pied --- */

  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  chargement: {
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
});
