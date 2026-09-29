import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import {
  ASSIGNMENT_STATUS_LABELS,
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  HAIRLINE,
  MISSION_STATUS_LABELS,
  MISSION_STATUS_VARIANTS,
  SCREEN_PADDING,
  SPACING,
} from '@/constants';
import {
  useEnregistrerRapport,
  useMesAffectations,
  useMissionErrorMessage,
  usePointerAffectation,
  type Pointage,
} from '@/features/missions';
import { useMaFicheAgent } from '@/features/prestataires';
import { logTechnicalError, toUserFacingError } from '@/lib/supabase/errors';
import { useAuthContext } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Exécution d'une mission par l'agent, d'après
 * `design/secuguard_ex_cution_mission_agent.html`.
 *
 * LA MAQUETTE EST UN POSTE DE SUPERVISION DE SÛRETÉ. ELLE DÉCRIT DES CAPTEURS
 * ET DES PROCÉDURES QUI N'EXISTENT PAS DANS LE MODÈLE. AUCUN N'EST SIMULÉ.
 *
 * Retirés, faute de source :
 *
 *   - « MATRICULE AG-7842 » : `agent_profiles` n'a pas de matricule ;
 *   - « BATTERIE GPS 94 % » : `expo-battery` n'est pas installé ;
 *   - « DISPOSITIF PTI ARMÉ » : aucune table, aucune fonction ;
 *   - « Scan NFC Validé » : `expo-nfc` n'est pas installé ;
 *   - « Ronde 02 », « 0/8 pts », « LANCER RONDE #2 » : aucune table de rondes,
 *     aucun point de passage, aucune fonction de lancement ;
 *   - « Journal d'Événements (MCE) » horodaté : aucun historique d'événements
 *     n'est stocké. Le rapport de fin, lui, existe — c'est `report` ;
 *   - « Aperçu Caméra Périmétrique » : `expo-camera` n'est pas installé ;
 *   - « Code Portail #4912* » et le téléphone du responsable : aucune colonne
 *     ne les porte.
 *
 * LA PARTIE SOS EST ABSENTE ENTIÈREMENT, À LA DEMANDE DU COMMANDITAIRE.
 *
 * Le bouton « DÉCLENCHER » est le seul élément de cet écran qui ait un poids
 * humain : un agent en danger le presse et quelqu'un doit partir. Le retirer
 * sans avertissement évite d'afficher un mécanisme qui n'existe pas.
 *
 * CE QUI EST CONSERVÉ, ET QUI EST VRAI :
 *
 *   - le poste actif et son chrono, calculé depuis `check_in_time` ;
 *   - l'identité de la mission, son adresse, son créneau ;
 *   - les consignes du site, que le client saisit dans
 *     `missions.special_requirements` ;
 *   - le rapport intermédiaire, écrit dans `mission_assignments.report` ;
 *   - le pointage d'arrivée, le pointage de départ, et les deux boutons dans
 *     l'ordre où la base les autorise.
 *
 * LE BOUTON « TRANSMETTRE RAPPORT INTERMÉDIAIRE » EST CONSERVÉ, ET IL ÉCRIT
 * VRAIMENT. C'était le bouton le plus douteux de la maquette : un `alert()` ne
 * fait rien, et l'apporter tel quel aurait été un mensonge. `report` fait
 * partie des colonnes accordées par
 * `grant update (… , report) on table public.mission_assignments`, et la
 * politique « Assigned agents can update mission reports » n'ouvre la ligne qu'à
 * l'agent affecté. Le contrôle 23 mesure ce droit.
 *
 * AUCUNE CONFIRMATION N'EST DEMANDÉE AVANT LE DÉPART, ET C'EST DÉLIBÉRÉ :
 * `Alert.alert` n'est supporté par `react-native-web` que de façon rudimentaire,
 * et une confirmation qui ne s'affiche pas transforme le bouton en bouton mort.
 * Le libellé du bouton dit ce qu'il fait, et le départ est réversible par le
 * client seul, jamais par l'agent.
 */
export default function AgentMissionEnCours() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthContext();

  const { data: affectations, isPending, isError, error } = useMesAffectations();
  const { data: fiche } = useMaFicheAgent(user?.id);
  const pointer = usePointerAffectation();
  const enregistrer = useEnregistrerRapport();
  const messageErreur = useMissionErrorMessage();

  const [rapport, setRapport] = useState('');
  const [rapportPour, setRapportPour] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const affectation = useMemo(
    () => (affectations ?? []).find((item) => item.id === id),
    [affectations, id],
  );

  /*
   * LE BROUILLON SUIT L'AFFECTATION, ET PAS LA DONNEE.
   *
   * Il était réinitialisé par un effet dépendant de `report`, ce qui écrasait la
   * saisie en cours à chaque invalidation du cache : l'agent qui rédigeait son
   * rapport perdait une ligne à chaque lecture, et l'écran se vidait sous ses
   * doigts. La réinitialisation ne porte donc que sur un CHANGEMENT
   * D'AFFECTATION, et elle se fait pendant le rendu — le motif documenté par
   * React pour un état dérivé d'une donnée, et la seule forme que la règle
   * `react-hooks/set-state-in-effect` accepte.
   *
   * Conséquence voulue : après « Enregistrer le rapport », le texte local
   * reste, et il est de toute façon identique à celui que la base renvoie.
   */
  if (affectation && rapportPour !== affectation.id) {
    setRapportPour(affectation.id);
    setRapport(affectation.report ?? '');
  }

  if (isPending) {
    return (
      <View style={styles.centre}>
        <Text style={styles.chargement}>Lecture de la mission…</Text>
      </View>
    );
  }

  if (isError) {
    logTechnicalError('lire la mission en cours', error);
    return (
      <View style={styles.centre}>
        <Text style={styles.erreurTitre}>Mission inaccessible</Text>
        <Text style={styles.texte}>
          {toUserFacingError(error, 'Impossible de charger cette mission.').message}
        </Text>
        <Button title="Retour" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  if (!affectation) {
    /*
     * L'AFFECTATION N'EST PLUS DANS LA LISTE DE L'AGENT.
     *
     * Cela arrive après un départ pointé, ou si l'agent n'est pas le titulaire.
     * L'écran ne devine pas : il le dit et propose de revenir à la liste, où
     * l'état réel se lit.
     */
    return (
      <View style={styles.centre}>
        <Text style={styles.erreurTitre}>Mission introuvable</Text>
        <Text style={styles.texte}>
          Cette mission ne figure plus dans vos affectations.
        </Text>
        <Button title="Voir mes missions" onPress={() => router.replace('/(agent)/missions')} />
      </View>
    );
  }

  const mission = affectation.missions;
  const arrivee = affectation.check_in_time;
  const depart = affectation.check_out_time;
  const pointe = Boolean(arrivee);
  const sorti = Boolean(depart);

  /*
   * LES MÊMES DEUX VALEURS QUE DANS LA LISTE DES MISSIONS.
   *
   * `is_assignment_agent` exige le statut `accepted` ou `completed` : proposer
   * un pointage sur une demande en attente serait un bouton qui échoue. Les
   * deux écrans lisent la même ligne, et il n'y a pas de raison qu'ils n'aient
   * pas la même condition.
   */
  const acceptee =
    affectation.status === 'accepted' || affectation.status === 'completed';

  /*
   * LE TEXTE ÉCRIT EST COMPARÉ À CELUI DE LA BASE, À CHAQUE RENDU.
   *
   * Un `useState<boolean> modifie` se désynchronise de la donnée : il reste vrai
   * après un enregistrement réussi, et il ment au retour sur l'écran. La
   * comparaison est refaite ici, donc elle ne peut pas mentir.
   */
  const rapportEnBase = affectation.report ?? '';
  const rapportModifie = rapport !== rapportEnBase;

  /*
   * LE TARIF EST LU COMME UNE CHAÎNE ET CONVERTI ICI, ET NON DANS LE JSX.
   *
   * `getMyAgentProfile` renvoie `hourlyRate` en chaîne, chaîne vide quand le
   * tarif n'est pas saisi. `Number.parseFloat` de cette valeur donne `NaN`, et
   * `NaN` est faux : un tarif illisible affiche donc « Non renseigné » au lieu
   * de `NaN €`. C'est le même calcul que celui de l'accueil agent.
   */
  const tarifSaisi = fiche?.hourlyRate
    ? Number.parseFloat(fiche.hourlyRate)
    : Number.NaN;

  /*
   * LA DURÉE PRÉVUE EST CALCULÉE SUR LE CRÉNEAU DU CLIENT, JAMAIS INVENTÉE.
   *
   * C'est ce que la pastille du chrono oppose au temps écoulé : sans elle,
   * l'agent ne sait pas s'il tient. Le « / 10h00 » de la maquette vient donc de
   * `end_time - start_time`, et non d'une constante.
   */
  const dureePrevue = minutesEntre(mission?.start_time, mission?.end_time);

  /*
   * LE RETARD SE MESURE DEPUIS L'ARRIVÉE RÉELLE, ET NON DEPUIS LE DÉBUT DU
   * CRÉNEAU. Un agent qui se présente une heure en avance n'est pas en retard,
   * et l'inverse est vrai aussi : un créneau dépassé alors que l'agent vient
   * d'arriver n'est pas une faute.
   */
  const minutesRestantes = minutesEntre(arrivee, mission?.end_time);
  const horsDelai = minutesRestantes !== null && minutesRestantes <= 0;

  const pointerVacation = async (pointage: Pointage) => {
    setErreur(null);
    try {
      await pointer.mutateAsync({
        affectationId: affectation.id,
        pointage,
        // Le rapport part AVEC le départ : `pointer_depart` l'attend, et le
        // demander à l'agent de revenir l'écrire plus tard serait lui faire
        // faire deux fois le même travail.
        rapport,
      });
    } catch (e) {
      setErreur(
        messageErreur(e, 'enregistrer', 'Impossible d’enregistrer votre pointage.'),
      );
    }
  };

  const enregistrerRapport = async () => {
    setErreur(null);
    try {
      await enregistrer.mutateAsync({
        affectationId: affectation.id,
        rapport,
      });
    } catch (e) {
      setErreur(
        messageErreur(e, 'enregistrer', 'Impossible d’enregistrer votre rapport.'),
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Mission en cours' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* =================================================
            POSTE ACTIF

            LE CHRONO EST CALCULÉ, ET N'EST AFFICHÉ QUE SI L'ARRIVÉE EST
            POINTÉE. Avant le pointage, il n'y a pas de poste : afficher 00:00:00
            ferait croire à une prise de poste qui n'a pas eu lieu.
            ================================================= */}

        <View style={styles.poste}>
          <View style={styles.posteHaut}>
            <View style={styles.posteEtatLigne}>
              <View style={styles.postePip} />
              <Text style={styles.posteEtat}>
                {sorti
                  ? 'MISSION TERMINÉE'
                  : pointe
                    ? 'EN POSTE ACTIF'
                    : 'EN ATTENTE DE POINTAGE'}
              </Text>
            </View>

            {/*
             * LE CHRONO EST UN COMPOSANT À PART ENTIÈRE, ET C'EST LA SEULE
             * RAISON.
             *
             * Il rejoue le composant chaque seconde. Placé dans cet écran, il
             * rejouerait aussi le `TextInput` du rapport — et un champ contrôlé
             * rejoué chaque seconde perd le curseur sur Android. Isolé, il ne
             * réveille que lui.
             */}
            {pointe ? (
              <View style={styles.chrono}>
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={14}
                  color={horsDelai ? COLORS.accentSurface : COLORS.onNavy}
                />
                <Text
                  style={[
                    styles.chronoTexte,
                    horsDelai ? styles.chronoHorsDelai : null,
                  ]}
                >
                  <Chrono debut={arrivee} fin={depart} />
                </Text>

                {/*
                 * LA DURÉE PRÉVUE N'EST ÉCRITE QUE SI ELLE EXISTE.
                 *
                 * « / 10h00 » sans créneau lisible serait une durée plaquée par
                 * l'écran. `minutesEntre` renvoie `null` plutôt que `0`, donc le
                 * cas « aucune durée » disparaît au lieu d'afficher « 00 min ».
                 *
                 * LE TEXTE « DÉPASSÉE » EST ÉCRIT, PAS SEULEMENT COLORÉ : un
                 * ambre sur un fond navy se voit, mais il ne se prouve pas au
                 * lecteur d'écran, et il ne se prouve pas non plus à celui qui
                 * a un daltonisme.
                 */}
                {dureePrevue !== null ? (
                  <Text
                    style={[
                      styles.chronoPrevu,
                      horsDelai ? styles.chronoHorsDelai : null,
                    ]}
                  >
                    / {formaterDureeCourte(dureePrevue)}
                    {horsDelai ? ' · dépassée' : ''}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.posteTitreLigne}>
            <Text style={styles.posteTitre} numberOfLines={2}>
              {mission?.title ?? 'Mission affectée'}
            </Text>

            {/*
             * LE STATUT DE LA MISSION EST DISTINCT DE CELUI DE L'AFFECTATION.
             *
             * Pointer l'arrivée fait passer la mission `accepted` →
             * `in_progress` dans la même opération. C'est donc le seul endroit
             * où l'agent voit que SON GESTE a démarré la mission chez le
             * client, et pas seulement chez lui.
             */}
            {mission ? (
              <Badge
                text={MISSION_STATUS_LABELS[mission.status]}
                variant={MISSION_STATUS_VARIANTS[mission.status]}
              />
            ) : null}
          </View>

          {mission?.address ? (
            <View style={styles.posteMeta}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={COLORS.onPrimaryContainer}
              />
              <Text style={styles.posteMetaTexte} numberOfLines={1}>
                {mission.address}, {mission.city}
              </Text>
            </View>
          ) : null}

          {mission ? (
            <View style={styles.posteMeta}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={COLORS.onPrimaryContainer}
              />
              <Text style={styles.posteMetaTexte}>
                {formatDate(mission.start_time, 'short')} →{' '}
                {formatDate(mission.end_time, 'time')}
              </Text>
            </View>
          ) : null}

          <View style={styles.posteStats}>
            <View style={styles.posteStat}>
              <Text style={styles.posteStatLibelle}>Arrivée</Text>
              <Text style={styles.posteStatValeur}>
                {affectation.check_in_time
                  ? formatDate(affectation.check_in_time, 'time')
                  : 'Non pointée'}
              </Text>
            </View>
            <View style={styles.posteStat}>
              <Text style={styles.posteStatLibelle}>Départ</Text>
              <Text style={styles.posteStatValeur}>
                {affectation.check_out_time
                  ? formatDate(affectation.check_out_time, 'time')
                  : 'Non pointé'}
              </Text>
            </View>
            <View style={styles.posteStat}>
              <Text style={styles.posteStatLibelle}>Statut</Text>
              <Text style={styles.posteStatValeur} numberOfLines={1}>
                {ASSIGNMENT_STATUS_LABELS[affectation.status]}
              </Text>
            </View>
          </View>
        </View>

        {/*
         * =================================================
         * CONSIGNES DU CLIENT
         *
         * LES DEUX TEXTES SONT RÉUNIS, ET ILS PASSENT EN TÊTE.
         *
         * La maquette réservait une carte aux consignes du site, et n'avait nulle
         * part où placer le code de portail ni le téléphone du responsable : ce
         * sont deux lignes de la maquette sans colonne derrière elles. Le client
         * les écrit dans sa description et dans ses consignes, et c'est donc là
         * qu'elles se lisent.
         *
         * L'écran le DIT, pour que l'agent sache où les trouver — et pour que
         * personne n'aille chercher une colonne manquante.
         * =================================================
         */}

        <View style={styles.section}>
          <SectionHeader title="Consignes du client" />
          <Card variant="secondary" accent style={styles.carte}>
            {mission?.description ? (
              <View style={styles.consignePartie}>
                <Text style={styles.consigneLibelle}>La mission</Text>
                <Text style={styles.texte}>{mission.description}</Text>
              </View>
            ) : null}

            {mission?.special_requirements ? (
              <View style={styles.consignePartie}>
                <Text style={styles.consigneLibelle}>Sur place</Text>
                <Text style={styles.texte}>{mission.special_requirements}</Text>
              </View>
            ) : null}

            {!mission?.description && !mission?.special_requirements ? (
              <Text style={styles.texte}>
                Le client n’a saisi aucune consigne. Renseignez-vous auprès du
                responsable du site avant de prendre votre poste.
              </Text>
            ) : null}

            <Text style={styles.consigneNote}>
              Le code de portail, le nom et le téléphone du responsable du site
              sont attendus dans ces textes : le modèle ne leur réserve aucune
              colonne.
            </Text>
          </Card>
        </View>

        {/*
         * =================================================
         * RAPPORT DE VACATION
         *
         * `report` EST UN TEXTE LIBRE DE L'AGENT. Il part AVEC le départ, et il
         * peut être enregistré AVANT — c'est le seul endroit de l'application où
         * une écriture directe depuis l'écran est légitime ;
         * `missionsService.enregistrerRapport` dit pourquoi, et le contrôle 23
         * mesure le droit.
         * =================================================
         */}

        <View style={styles.section}>
          <SectionHeader
            title="Rapport de vacation"
            trailing={
              sorti ? 'Envoyé' : rapportModifie ? 'Non enregistré' : undefined
            }
          />
          <Card variant="secondary" style={styles.carte}>
            {pointe && !sorti ? (
              <TextInput
                style={styles.rapport}
                placeholder="Contrôles effectués, anomalies constatées, passages notables…"
                placeholderTextColor={COLORS.textLight}
                value={rapport}
                onChangeText={setRapport}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                accessibilityLabel="Rapport de vacation"
              />
            ) : (
              <Text style={styles.texte}>
                {rapportEnBase
                  ? rapportEnBase
                  : 'Aucun rapport n’a été déposé pour cette vacation.'}
              </Text>
            )}

            {erreur ? <Text style={styles.erreurTexte}>{erreur}</Text> : null}
          </Card>
        </View>

        {/* =================================================
            ACTIONS DE VACATION

            UN SEUL GESTE À LA FOIS, ET DANS L'ORDRE OÙ LA BASE LES AUTORISE.
            ================================================= */}

        <View style={styles.actions}>
          {!acceptee ? (
            <Text style={styles.note}>
              {affectation.status === 'pending'
                ? 'Cette demande attend votre réponse. Acceptez-la depuis l’onglet Missions : un pointage n’est possible qu’après acceptation, la base refuserait toute autre.'
                : 'Vous avez refusé cette demande. Elle ne peut plus être pointée.'}
            </Text>
          ) : null}

          {acceptee && !pointe ? (
            <Button
              title="Pointer mon arrivée"
              icon="login"
              onPress={() => void pointerVacation('arrivee')}
              disabled={pointer.isPending}
            />
          ) : null}

          {acceptee && pointe && !sorti ? (
            <>
              <Button
                title={rapportModifie ? 'Enregistrer le rapport' : 'Rapport enregistré'}
                icon="content-save-outline"
                variant="secondary"
                onPress={() => void enregistrerRapport()}
                disabled={!rapportModifie || enregistrer.isPending}
              />
              <Button
                title="Pointer mon départ et envoyer le rapport"
                icon="logout"
                onPress={() => void pointerVacation('depart')}
                disabled={pointer.isPending || enregistrer.isPending}
              />
            </>
          ) : null}

          {sorti ? (
            <Text style={styles.note}>
              Votre départ est pointé et le rapport est parti avec lui. C’est
              désormais au client de confirmer que la prestation est terminée :
              l’agent ne clôt jamais sa propre mission.
            </Text>
          ) : null}
        </View>

        {/*
         * =================================================
         * JOURNAL DE VACATION
         *
         * TROIS LIGNES, ET CE SONT LES TROIS SEULS HORODATAGES QUI EXISTENT
         * POUR CETTE AFFECTATION.
         *
         * CE N'EST PAS LE « Journal d'Événements (MCE) » de la maquette. Il n'y a
         * pas de table d'événements, et il n'y en aura pas tant qu'aucun modèle
         * ne la portera. `updated_at` n'est volontairement pas utilisé : il bouge
         * à chaque écriture, y compris à chaque pointage, et en faire un journal
         * produirait un journal qui mentirait sur l'heure de ses propres lignes.
         *
         * L'ÉCART EST ÉCRIT À L'ÉCRAN. Un journal de trois lignes sous un titre
         * qui en promet dix se lirait comme un bug.
         * =================================================
         */}

        <View style={styles.section}>
          <SectionHeader title="Journal de vacation" />
          <Card variant="secondary" style={styles.carte}>
            <View style={styles.journalLigne}>
              <Text style={styles.journalHeure}>
                {horodatage(affectation.created_at)}
              </Text>
              <Text style={styles.journalTexte}>Demande reçue</Text>
            </View>

            {arrivee ? (
              <View style={styles.journalLigne}>
                <Text style={styles.journalHeure}>{horodatage(arrivee)}</Text>
                <Text style={styles.journalTexte}>Prise de poste pointée</Text>
              </View>
            ) : null}

            {depart ? (
              <View style={styles.journalLigne}>
                <Text style={styles.journalHeure}>{horodatage(depart)}</Text>
                <Text style={styles.journalTexte}>Départ pointé</Text>
              </View>
            ) : null}

            <Text style={styles.consigneNote}>
              Ce journal ne contient que les pointages enregistrés. Les
              observations, anomalies et passages se saisissent dans le rapport
              ci-dessus : le modèle ne conserve aucun événement horodaté.
            </Text>
          </Card>
        </View>

        {/* =================================================
            VOTRE FICHE

            ELLE EST AFFICHÉE PARCE QU'ELLE L'EST RÉELLEMENT, ET ELNE CALCULE
            RIEN. La maquette y plaçait un « cumul net avant prélèvement » et un
            taux moyen : ces deux lignes supposeraient une règle de commission
            qui n'est pas prise (étape 10). Aucun montant n'est donc dérivé ici
            — ni durée, ni revenu.
            ================================================= */}

        {fiche && (fiche.zone !== '' || fiche.hourlyRate !== '') ? (
          <View style={styles.section}>
            <SectionHeader title="Votre intervention" />
            <Card variant="secondary" style={styles.carte}>
              <View style={styles.recapLigne}>
                <Text style={styles.recapLibelle}>Zone</Text>
                <Text style={styles.recapValeur}>
                  {fiche.zone !== '' ? fiche.zone : 'Non renseignée'}
                </Text>
              </View>
              <View style={styles.recapLigne}>
                <Text style={styles.recapLibelle}>Tarif horaire</Text>
                <Text style={styles.recapValeur}>
                  {tarifSaisi ? `${formatCurrency(tarifSaisi)} / h` : 'Non renseigné'}
                </Text>
              </View>
            </Card>
          </View>
        ) : null}

      </ScrollView>
    </>
  );
}

/**
 * Une durée en secondes, écrite comme la maquette l'écrit : `HH:MM:SS`.
 *
 * Les parties sont complétées par `padStart` et non par une condition : un
 * `0${minutes}` donnerait « 0:5:3 » à la sixième minute de vacation.
 */
function formaterDuree(secondes: number): string {
  const heures = Math.floor(secondes / 3600);
  const minutes = Math.floor((secondes % 3600) / 60);
  const reste = secondes % 60;

  return [heures, minutes, reste]
    .map((partie) => String(partie).padStart(2, '0'))
    .join(':');
}

/**
 * Minutes entre deux horodatages, ou `null` si l'un des deux manque ou est
 * illisible.
 *
 * `null` ET NON `0` : un créneau absent n'est pas un créneau d'une minute, et
 * une durée nulle affichée « 00:00 » ferait croire à une mission sans durée.
 */
function minutesEntre(debut?: string | null, fin?: string | null): number | null {
  if (!debut || !fin) return null;

  const d = new Date(debut).getTime();
  const f = new Date(fin).getTime();
  if (!Number.isFinite(d) || !Number.isFinite(f)) return null;

  return Math.floor((f - d) / 60000);
}

/** Une durée en minutes, écrite comme la maquette : « 10h00 », « 45 min ». */
function formaterDureeCourte(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return `${heures}h${String(reste).padStart(2, '0')}`;
}

/** Un horodatage lisible : « 28/09/2026 · 21:45 ». */
function horodatage(date: string): string {
  return `${formatDate(date, 'short')} · ${formatDate(date, 'time')}`;
}

/**
 * Durée écoulée depuis l'arrivée, FIGÉE au départ pointé.
 *
 * ELLE EST UN COMPOSANT, ET NON UN `useState` DE L'ÉCRAN.
 *
 * Le minuteur rejoue son composant chaque seconde. Dans l'écran parent, il
 * rejouerait aussi le `TextInput` du rapport, et un champ contrôlé rejoué chaque
 * seconde perd le curseur sur Android. Isolé ici, il ne réveille que lui.
 *
 * ELLE S'ARRÊTE AU DÉPART, ET CONTINUE PAS : sans `check_out_time`, une
 * vacation terminée afficherait une durée qui grossit toute la nuit.
 */
function Chrono({ debut, fin }: { debut: string | null; fin: string | null }) {
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    if (fin) return;

    const minuteur = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(minuteur);
  }, [fin]);

  const debutMs = debut ? new Date(debut).getTime() : Number.NaN;
  const finMs = fin ? new Date(fin).getTime() : maintenant;
  const secondes = Math.floor((finMs - debutMs) / 1000);

  /*
   * UNE DATE ILLISIBLE NE DOIT PAS AFFICHER « NaN:NaN:NaN ».
   *
   * Elle ne s'affiche d'ailleurs pas : `pointe` est faux sans
   * `check_in_time`, donc ce cas n'arrive que par une valeur corrompue. On
   * renvoie un tiret plutôt qu'un `NaN` qui se lirait comme un chrono cassé.
   */
  if (!Number.isFinite(secondes)) return '—';

  return formaterDuree(Math.max(0, secondes));
}
/*
 * LE BLOC « POSTE ACTIF » EST LE SEUL APLAT NAVY DE L'ÉCRAN.
 *
 * C'est celui de la maquette (`bg-primary-container`), et c'est aussi le seul
 * endroit où l'on écrit en `onNavy`. Les textes secondaires y sont en
 * `onPrimaryContainer` — le jeton prévu par le design pour un texte posé sur du
 * navy — et non en `textLight`, qui n'a pas été prévu pour ce fond.
 */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SCREEN_PADDING,
    paddingBottom: SPACING.xxxl,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    padding: SCREEN_PADDING,
  },
  chargement: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  erreurTitre: {
    fontFamily: FONT_FAMILIES.displayBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: 26,
    color: COLORS.text,
    textAlign: 'center',
  },
  texte: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    color: COLORS.text,
  },
  poste: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  posteHaut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  posteEtatLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 1,
  },
  postePip: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.secondaryContainer,
  },
  posteEtat: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 1,
    color: COLORS.secondaryContainer,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  chrono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  chronoTexte: {
    fontFamily: FONT_FAMILIES.displayBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onNavy,
  },
  chronoPrevu: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.onPrimaryContainer,
  },
  /*
   * LE RETARD EST SIGNALÉ PAR LE TEXTE ET PAR LA COULEUR, JAMAIS PAR LA
   * COULEUR SEULE. `accentSurface` est l'ambre pâle du design, lisible sur le
   * navy, et non `accent` qui le serait à peine.
   */
  chronoHorsDelai: {
    color: COLORS.accentSurface,
  },
  consignePartie: {
    gap: SPACING.xs,
  },
  consigneLibelle: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.textLight,
  },
  consigneNote: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    color: COLORS.textLight,
  },
  journalLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
  },
  journalHeure: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  journalTexte: {
    flex: 1,
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  posteTitreLigne: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  posteTitre: {
    flex: 1,
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.xl,
    lineHeight: 26,
    color: COLORS.onNavy,
  },
  posteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  posteMetaTexte: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onPrimaryContainer,
  },
  posteStats: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  posteStat: {
    flex: 1,
    gap: 2,
  },
  posteStatLibelle: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.onPrimaryContainer,
  },
  posteStatValeur: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.onNavy,
  },
  section: {
    marginTop: SPACING.lg,
  },
  carte: {
    gap: SPACING.sm,
  },
  rapport: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    textAlignVertical: 'top',
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  erreurTexte: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    color: COLORS.error,
  },
  actions: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  note: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  recapLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  recapLibelle: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  recapValeur: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
});


