import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/components/common';
import {
  ActionTile,
  Badge,
  Button,
  Card,
  CatalogueRow,
  Puce,
  SectionHeader,
  Typography,
} from '@/components/ui';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  HAIRLINE,
  MISSION_STATUS_LABELS,
  SCREEN_PADDING,
  SHADOWS,
  SPACING,
} from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { useClientMissions } from '@/features/missions';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { Mission } from '@/types';

/**
 * Accueil du client — reconstruction de `design/secuguard_accueil_client.html`.
 *
 * LA MAQUETTE FIXE LA FORME, PAS LE CONTENU.
 *
 * L'original est un tableau de bord de « SOC lead » : flux vidéo, caméra
 * CAM-04, badge NFC lu, agent en poste, journal horodaté. L'application est une
 * place de marché : elle n'a ni caméra, ni télémétrie, ni pointage NFC en base.
 *
 * Chaque bloc est donc reconstruit sur ce que la base sait RÉELLEMENT dire.
 * Là où la maquette affiche une donnée inexistante chez nous, elle est
 * remplacée par son équivalent vérifiable, ou retirée. Aucun chiffre n'est
 * inventé pour « remplir » le design : afficher « 4 périmètres sous
 * surveillance » sur une base vide est exactement le défaut que ce projet a
 * déjà corrigé une fois sur cet écran.
 */

/**
 * Typologies de prestations.
 *
 * Contenu ÉDITORIAL : ces quatre lignes décrivent l'offre et ne revendiquent
 * aucun chiffre. Elles ne sont pas lues en base et ne doivent pas l'être : un
 * catalogue tarifé est une décision métier, pas une constante de rendu.
 */
const PRESTATIONS: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
}[] = [
  {
    icon: 'shield-outline',
    title: 'Gardiennage & filtrage',
    description: "Contrôle d'accès, rondes de fermeture",
  },
  {
    icon: 'fire-extinguisher',
    title: 'Sécurité incendie SSIAP',
    description: 'IGH / ERP, maintenance extincteurs',
  },
  {
    icon: 'dog-side',
    title: 'Maitre-chien / cynophile',
    description: 'Dissuasion périmétrique, grands espaces',
  },
  {
    icon: 'shield-account-outline',
    title: 'Protection rapprochée',
    description: 'Escorte de personnalités, frameworks',
  },
];

export default function ClientIndex() {
  const router = useRouter();
  const { profile } = useAuthContext();
  const { data: missions, isPending } = useClientMissions();

  /*
   * MISSION LA PLUS AVANCÉE.
   *
   * La maquette affiche « Surveillance en cours » avec un agent en poste. Nous
   * n'avons ni agent affecté ni télémétrie : nous avons des missions et un
   * statut. On montre donc la mission la plus avancée, avec son statut réel.
   *
   * L'ordre de priorité suit le cycle de vie de `mission_status` et non
   * l'ordre alphabétique : `in_progress` avant `accepted` avant `published`.
   * Une mission en cours est plus instructive qu'une autre en attente.
   */
  const missionCourante: Mission | undefined = (() => {
    if (!missions) return undefined;
    return (
      missions.find((m) => m.status === 'in_progress') ??
      missions.find((m) => m.status === 'accepted') ??
      missions.find((m) => m.status === 'published')
    );
  })();

  /*
   * Tous les compteurs sont DÉRIVÉS de la liste réellement chargée. Aucun n'est
   * codé en dur : une statistique figée affichant « 142 » sur une base vide est
   * le meilleur moyen de faire croire à un backend fonctionnel qui ne l'est pas.
   */
  const total = missions?.length ?? 0;
  const enCours = missions?.filter((m) => m.status === 'in_progress').length ?? 0;
  const brouillons = missions?.filter((m) => m.status === 'draft').length ?? 0;
  const recentes = missions?.slice(0, 3) ?? [];

  /*
   * PRÉNOM DE ACCUEIL.
   *
   * `full_name` est la seule donnée d'affichage dont nous disposons, et elle
   * est facultative. On affiche donc « Bonjour » seul quand elle manque, plutôt
   * que « Bonjour  » avec une espace orpheline, ou « Bonjour Inconnu ».
   */
  const prenom = (profile?.full_name ?? '').trim().split(/\s+/)[0] ?? '';
  const salut = prenom ? `Bonjour ${prenom}` : 'Bonjour';

  return (
    <View style={styles.root}>
      <AppHeader onPressProfile={() => router.push('/(client)/profil-client')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/*
         * BANDEAU D'IDENTITÉ : pastilles + salutation.
         *
         * La maquette écrit « CNAPS #75-9832 ». Ce numéro d'agrément n'existe
         * nulle part dans la base : l'afficher serait inventer une donnée. Il est
         * remplacé par le nombre RÉEL de missions du client.
         */}
        <View style={styles.bandeau}>
          <View style={styles.chipLigne}>
            <Puce label="Espace donneur d’ordre" pulsante />
            <Puce label={`${total} mission${total > 1 ? 's' : ''}`} variant="neutral" />
          </View>

          <View style={styles.salutationLigne}>
            <View style={styles.salutationTexte}>
              <Text style={styles.salutation}>{salut}</Text>
              <Text style={styles.sousSalutation} numberOfLines={2}>
                {isPending
                  ? 'Chargement de vos opérations'
                  : total === 0
                    ? 'Aucune mission enregistrée'
                    : `${enCours} en cours · ${brouillons} brouillon${brouillons > 1 ? 's' : ''}`}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/(client)/profil-client')}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir mon profil"
              style={({ pressed }) => [styles.boutonAvatar, pressed && styles.presse]}
            >
              <MaterialCommunityIcons name="shield" size={20} color={COLORS.primary} />
            </Pressable>
          </View>
        </View>

        {/*
         * BLOC NAVY — écrit à la main, et non via `Card`.
         *
         * La maquette pose ce bloc sur `bg-primary-container`. `Card` ne propose
         * aucune surface navy, et lui ajouter une cinquième variante pour un
         * seul écran serait disproportionné.
         */}
        <View style={styles.navy}>
          <View style={styles.navyHaut}>
            <View style={styles.navyCopie}>
              <View style={styles.navyPipLigne}>
                <View style={styles.navyPip} />
                <Text style={styles.navySurTitre}>Déploiement rapide</Text>
              </View>

              <Text style={styles.navyTitre}>Mission Express</Text>
              <Text style={styles.navyCorps} numberOfLines={3}>
                Publiez votre besoin, recevez des propositions de prestataires
                certifiés.
              </Text>
            </View>

            <View style={styles.navyIcone}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={28}
                color={COLORS.secondaryContainer}
              />
            </View>
          </View>

          <View style={styles.navyActions}>
            <Button
              title="Créer une mission"
              icon="plus"
              variant="secondary"
              onPress={() => router.push('/(client)/mission/new')}
              style={styles.navyBouton}
            />
            <Pressable
              onPress={() => router.push('/(client)/missions-client')}
              accessibilityRole="button"
              accessibilityLabel="Voir mes missions"
              style={({ pressed }) => [styles.navyIconeBouton, pressed && styles.presse]}
            >
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={20}
                color={COLORS.onWhite}
              />
            </Pressable>
          </View>
        </View>

        {/* =================================================
            MISSION EN COURS
            ================================================= */}

        <View style={styles.section}>
          <SectionHeader
            title="Mission en cours"
            trailing={missionCourante ? 'En direct' : undefined}
          />

          {missionCourante ? (
            <Card
              variant="secondary"
              style={styles.carteMission}
              onPress={() =>
                router.push({
                  pathname: '/(client)/mission-suivi/[id]',
                  params: { id: missionCourante.id },
                })
              }
              accessibilityLabel={`Suivre la mission ${missionCourante.title}`}
            >
              <View style={styles.missionHaut}>
                <Text style={styles.missionTitre} numberOfLines={2}>
                  {missionCourante.title}
                </Text>
                <Badge
                  text={MISSION_STATUS_LABELS[missionCourante.status]}
                  variant="primary"
                />
              </View>

              <View style={styles.missionMeta}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={14}
                  color={COLORS.textLight}
                />
                <Text style={styles.missionMetaTexte} numberOfLines={1}>
                  {missionCourante.address}, {missionCourante.city}
                </Text>
              </View>

              <View style={styles.missionMeta}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color={COLORS.textLight}
                />
                <Text style={styles.missionMetaTexte} numberOfLines={1}>
                  Début {formatDate(missionCourante.start_time, 'short')} ·{' '}
                  {missionCourante.agent_count} agent
                  {missionCourante.agent_count > 1 ? 's' : ''} demandé
                  {missionCourante.agent_count > 1 ? 's' : ''}
                </Text>
              </View>

              {/* Budget affiché seulement s'il est renseigné. */}
              {missionCourante.budget !== null &&
              missionCourante.budget !== undefined ? (
                <View style={styles.missionMeta}>
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={14}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.missionMetaTexte}>
                    Budget {missionCourante.budget} €
                  </Text>
                </View>
              ) : null}
            </Card>
          ) : (
            /*
             * ÉTAT VIDE EXPLICITE, et non un bloc masqué : le retirer ferait
             * disparaître le seul rappel qu'une mission est possible ici.
             */
            <Card variant="secondary" style={styles.carteVide}>
              <Typography variant="h3">Aucune mission en cours</Typography>
              <Typography
                variant="caption"
                color={COLORS.textSecondary}
                style={styles.carteVideTexte}
              >
                {isPending
                  ? 'Lecture de vos opérations en cours…'
                  : 'Créez une mission pour recevoir des propositions de prestataires certifiés.'}
              </Typography>
              <Button
                title="Créer une mission"
                icon="plus"
                onPress={() => router.push('/(client)/mission/new')}
                style={styles.carteVideBouton}
              />
            </Card>
          )}
        </View>
        {/* =================================================
            ACTIONS RAPIDES
            ================================================= */}

        <View style={styles.section}>
          <SectionHeader title="Actions rapides" />

          <View style={styles.grille}>
            <ActionTile
              title="Commander un agent"
              subtitle="Publier un besoin"
              icon="account-plus-outline"
              iconVariant="secondary"
              onPress={() => router.push('/(client)/mission/new')}
            />
            <ActionTile
              title="Annuaire"
              subtitle="Prestataires certifiés"
              icon="badge-account-outline"
              onPress={() => router.push('/(client)/search')}
            />
            <ActionTile
              title="Mes missions"
              subtitle={`${total} enregistrée${total > 1 ? 's' : ''}`}
              icon="clipboard-text-outline"
              onPress={() => router.push('/(client)/missions-client')}
            />
            <ActionTile
              title="Mon profil"
              subtitle="Identité & accès"
              icon="account-outline"
              iconVariant="accent"
              onPress={() => router.push('/(client)/profil-client')}
            />
          </View>
        </View>

        {/* =================================================
            CATALOGUE
            ================================================= */}

        <View style={styles.section}>
          <SectionHeader title="Catalogue prestations" />
          <Text style={styles.sectionSousTitre}>
            Typologies de missions disponibles sur la plateforme
          </Text>

          <View style={styles.liste}>
            {PRESTATIONS.map((prestation) => (
              <CatalogueRow
                key={prestation.title}
                title={prestation.title}
                description={prestation.description}
                icon={prestation.icon}
                onPress={() => router.push('/(client)/mission/new')}
              />
            ))}
          </View>
        </View>

        {/* =================================================
            ACTIVITÉ RÉCENTE
            ================================================= */}

        {recentes.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Activité récente"
              actionLabel="Tout voir"
              onPressAction={() => router.push('/(client)/missions-client')}
            />

            <Card variant="default" style={styles.journal}>
              {recentes.map((mission, index) => (
                <View
                  key={mission.id}
                  style={[
                    styles.journalLigne,
                    /*
                     * Filet entre les lignes, jamais sous la dernière : sinon la
                     * carte se termine sur un trait qui ne sépare rien.
                     */
                    index < recentes.length - 1 && styles.journalSeparateur,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="clipboard-check-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <View style={styles.journalTexte}>
                    <Text style={styles.journalTitre} numberOfLines={1}>
                      {mission.title}
                    </Text>
                    <Text style={styles.journalDate} numberOfLines={1}>
                      {formatRelativeTime(mission.created_at)} · {mission.city}
                    </Text>
                  </View>
                  <Badge text={MISSION_STATUS_LABELS[mission.status]} variant="neutral" />
                </View>
              ))}
            </Card>
          </View>
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
    // `SCREEN_PADDING` = 24, soit le `px-gutter` de 1.5rem de la maquette.
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },

  /* --- Bandeau d'identite --- */

  bandeau: {
    gap: SPACING.sm,
  },
  chipLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  salutationLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  salutationTexte: {
    flex: 1,
    minWidth: 0,
  },
  salutation: {
    fontFamily: FONT_FAMILIES.display,
    // `headline-md` de la maquette : 24px, interlettrage -0.01em.
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 32,
    letterSpacing: -0.24,
    color: COLORS.text,
  },
  sousSalutation: {
    marginTop: 2,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
    color: COLORS.textSecondary,
  },
  boutonAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presse: {
    opacity: 0.7,
  },

  /* --- Bloc navy --- */

  navy: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryContainer,
    padding: SPACING.lg,
    gap: SPACING.lg,
    ...SHADOWS.raised,
  },
  navyHaut: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  navyCopie: {
    flex: 1,
    minWidth: 0,
  },
  navyPipLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  navyPip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  navySurTitre: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.secondaryContainer,
  },
  navyTitre: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.xl,
    lineHeight: 24,
    color: COLORS.onWhite,
  },
  navyCorps: {
    marginTop: 2,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 18,
    color: COLORS.onPrimaryContainer,
  },
  navyIcone: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    /*
     * Voile blanc a 10% : la maquette ecrit `bg-surface-container-lowest/10`.
     * `rgba` est le seul moyen d'exprimer une opacite sur un aplat sans
     * inventer une huitieme teinte de surface dans les tokens.
     */
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navyActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  navyBouton: {
    flex: 1,
  },
  navyIconeBouton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* --- Sections --- */

  section: {
    gap: SPACING.md,
  },
  sectionSousTitre: {
    // Remonte le sous-titre sous l'en-tete de section, qui porte deja sa marge.
    marginTop: -SPACING.xs,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
    color: COLORS.textSecondary,
  },

  /* --- Mission en cours --- */

  carteMission: {
    gap: SPACING.sm,
  },
  missionHaut: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  missionTitre: {
    flex: 1,
    fontFamily: FONT_FAMILIES.displaySemibold,
    fontSize: FONT_SIZES.lg,
    lineHeight: 22,
    color: COLORS.text,
  },
  missionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  missionMetaTexte: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },
  carteVide: {
    gap: SPACING.sm,
  },
  carteVideTexte: {
    marginBottom: SPACING.sm,
  },
  carteVideBouton: {
    alignSelf: 'flex-start',
  },

  /* --- Grille d'actions --- */

  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },

  /* --- Catalogue --- */

  liste: {
    gap: SPACING.sm,
  },

  /* --- Activite recente --- */

  journal: {
    padding: SPACING.md,
    gap: 0,
  },
  journalLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  journalSeparateur: {
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  journalTexte: {
    flex: 1,
    minWidth: 0,
  },
  journalTitre: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.text,
  },
  journalDate: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 14,
    color: COLORS.textSecondary,
  },
});

