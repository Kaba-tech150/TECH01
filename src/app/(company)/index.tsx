import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common';
import { Badge, BandeauNavy, Card, SectionHeader, StatTile } from '@/components/ui';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_VARIANTS,
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  HAIRLINE,
  PROVIDER_STATUS_LABELS,
  PROVIDER_STATUS_VARIANTS,
  SCREEN_PADDING,
  SHADOWS,
  SPACING,
} from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { useMaFicheSociete, useMonEquipe } from '@/features/companies';
import { useMesAffectationsSociete, usePortefeuille } from '@/features/portefeuille';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Accueil de la société de sécurité, d'après
 * `design/secuguard_accueil_soci_t.html`.
 *
 * TOUT VIENT DE LA BASE, ET LES DEUX BOUTONS VIDE DE LA MAQUETTE SONT
 * RÉSOLUS.
 *
 * La maquette propose « Rechercher des missions » et « Gérer l'équipe » avec des
 * gestionnaires vides. La première action n'a pas de route : une société ne
 * recherche pas des missions à pourvoir, elle reçoit des affectations. L'écran
 * affiche donc les missions reçues et l'équipe réelle, et « Gérer l'équipe »
 * mène à l'écran qui les liste.
 *
 * LES COMPTEURS SONT RECOMPTÉS, ET LE PORTFEUILLE EST CELUI DE LA SOCIÉTÉ.
 *
 * `useMesAffectationsSociete` lit les affectations rattachées à la société, pas
 * celles de l'agent : un compte multi-rôle ne doit pas voir la liste de l'autre
 * espace écraser la sienne. Le portefeuille est celui du compte connecté, et il
 * n'est affiché qu'en lecture — `wallets` n'autorise aucun `update`.
 */
export default function CompanyIndex() {
  const router = useRouter();
  const { user, profile } = useAuthContext();

  const { data: fiche, isPending: ficheEnCours } = useMaFicheSociete(user?.id);
  const { data: equipe, isPending: equipeEnCours } = useMonEquipe(user?.id);
  const { data: affectations, isPending: missionsEnCours } = useMesAffectationsSociete();
  const { data: portefeuille, isPending: portefeuilleEnCours } = usePortefeuille(user?.id);

  /*
   * LE NOM AFFICHÉ EST CELUI DE LA SOCIÉTÉ, ET NON CELUI DU GÉRANT.
   *
   * `profiles.full_name` est la personne qui se connecte ; `company_name` est
   * l'entité que l'écran représente. Les confondre afficherait l'espace d'une
   * personne pour une société qui porte un autre nom.
   */
  const nomSociete = fiche?.companyName ?? profile?.full_name?.trim() ?? 'Votre société';

  const total = affectations?.length ?? 0;
  const enCours = useMemo(
    () =>
      (affectations ?? []).filter((affectation) => affectation.status !== 'completed').length,
    [affectations],
  );
  const disponibles = useMemo(
    () => (equipe ?? []).filter((membre) => membre.isAvailable).length,
    [equipe],
  );

  const chargement = ficheEnCours || missionsEnCours;

  return (
    <View style={styles.root}>
      <AppHeader onPressProfile={() => router.push('/(company)/profil-societe')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* =================================================
            IDENTITÉ DE LA SOCIÉTÉ
            ================================================= */}

        <View style={styles.identite}>
          <View style={styles.identiteLigne}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="domain" size={28} color={COLORS.onWhite} />
            </View>

            <View style={styles.identiteTexte}>
              <Text style={styles.identiteNom} numberOfLines={1}>
                {nomSociete}
              </Text>
              {fiche?.status ? (
                <Badge
                  text={PROVIDER_STATUS_LABELS[fiche.status]}
                  variant={PROVIDER_STATUS_VARIANTS[fiche.status]}
                />
              ) : null}
            </View>
          </View>

          {fiche?.city ? (
            <View style={styles.meta}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={COLORS.textLight}
              />
              <Text style={styles.metaTexte} numberOfLines={1}>
                {fiche.address ? `${fiche.address}, ` : ''}
                {fiche.postalCode ? `${fiche.postalCode} ` : ''}
                {fiche.city}
              </Text>
            </View>
          ) : null}

          {/*
           * LE SIRET N'EST AFFICHÉ QUE S'IL EST RENSEIGNÉ.
           *
           * `siret` est une colonne `text unique` et donc facultative. Un
           * « non renseigné » serait exact, mais un tiret au milieu d'une fiche
           * pleine attire l'œil sur une absence banale.
           */}
          {fiche?.siret ? (
            <View style={styles.meta}>
              <MaterialCommunityIcons name="identifier" size={14} color={COLORS.textLight} />
              <Text style={styles.metaTexte} numberOfLines={1}>
                SIRET {fiche.siret}
              </Text>
            </View>
          ) : null}
        </View>

        <BandeauNavy
          eyebrow="Espace société"
          title="Missions reçues"
          description="Consultez les missions qui vous sont affectées et suivez l’activité de vos agents."
          icon="domain"
          primaryAction={{
            label: 'Voir mes missions',
            icon: 'clipboard-text-outline',
            onPress: () => router.push('/(company)/missions-societe'),
            accessibilityLabel: `Voir mes missions, ${total} au total`,
          }}
          secondaryAction={{
            label: 'Gérer mon équipe',
            icon: 'account-group-outline',
            onPress: () => router.push('/(company)/team'),
          }}
        />

        <View style={styles.compteurs}>
          <StatTile
            value={String(enCours)}
            label="Missions en cours"
            icon="clipboard-pulse-outline"
            iconVariant={enCours > 0 ? 'accent' : 'neutral'}
          />
          <StatTile
            value={String(total)}
            label="Missions reçues"
            icon="clipboard-check-outline"
          />
          <StatTile
            value={String(equipe?.length ?? 0)}
            label="Agents"
            icon="account-group-outline"
          />
        </View>

        {/* =================================================
            ÉQUIPE
            ================================================= */}

        <View style={styles.section}>
          <SectionHeader
            title="Mon équipe"
            actionLabel="Gérer"
            onPressAction={() => router.push('/(company)/team')}
          />

          {/*
           * LES AGENTS SONT LISTÉS PAR LEUR NOM, OU UN REPLI.
           *
           * `useMonEquipe` joint `profiles` en LEFT : un agent dont le compte
           * n'est pas lisible reste dans la liste. Sans le repli, l'écran
           * afficherait moins d'agents qu'il n'y en a, et le compteur du
           * bandeau contredirait la liste juste en dessous.
           */}
          {equipeEnCours ? (
            <Card variant="secondary" style={styles.carte}>
              <Text style={styles.texte}>Lecture de votre équipe…</Text>
            </Card>
          ) : equipe && equipe.length > 0 ? (
            <Card variant="secondary" padding={0} style={styles.groupe}>
              {equipe.slice(0, 4).map((membre) => (
                <View key={membre.id} style={styles.membre}>
                  <View style={styles.membreInitiale}>
                    <Text style={styles.membreInitialeTexte}>
                      {(membre.nom ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.membreTextes}>
                    <Text style={styles.membreNom} numberOfLines={1}>
                      {membre.nom ?? 'Agent non identifié'}
                    </Text>
                    <Text style={styles.membreMeta} numberOfLines={1}>
                      {membre.zone ? `Zone ${membre.zone}` : 'Zone non renseignée'}
                    </Text>
                  </View>

                  <Badge
                    text={membre.isAvailable ? 'Disponible' : 'Indisponible'}
                    variant={membre.isAvailable ? 'success' : 'neutral'}
                  />
                </View>
              ))}
            </Card>
          ) : (
            <Card variant="secondary" style={styles.carte}>
              <Text style={styles.carteTitre}>Aucun agent rattaché</Text>
              <Text style={styles.texte}>
                Le rattachement d’un agent à une société se fait par une demande
                d’affectation, et il n’est pas encore possible depuis
                l’application.
              </Text>
            </Card>
          )}

          {disponibles > 0 ? (
            <Text style={styles.note}>
              {disponibles} agent{disponibles > 1 ? 's' : ''} disponible
              {disponibles > 1 ? 's' : ''} sur {equipe?.length ?? 0}.
            </Text>
          ) : null}
        </View>

        {/* =================================================
            DERNIÈRES AFFECTATIONS
            ================================================= */}

        <View style={styles.section}>
          <SectionHeader
            title="Dernières affectations"
            actionLabel="Tout voir"
            onPressAction={() => router.push('/(company)/missions-societe')}
          />

          {affectations && affectations.length > 0 ? (
            affectations.slice(0, 3).map((affectation) => (
              <Card key={affectation.id} variant="secondary" style={styles.carte}>
                <View style={styles.carteHaut}>
                  <Text style={styles.carteTitre} numberOfLines={2}>
                    {affectation.missions?.title ?? 'Mission'}
                  </Text>
                  <Badge
                    text={ASSIGNMENT_STATUS_LABELS[affectation.status]}
                    variant={ASSIGNMENT_STATUS_VARIANTS[affectation.status]}
                  />
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
              </Card>
            ))
          ) : (
            <Card variant="secondary" style={styles.carte}>
              <Text style={styles.carteTitre}>
                {missionsEnCours ? 'Lecture des affectations…' : 'Aucune mission reçue'}
              </Text>
              {!missionsEnCours ? (
                <Text style={styles.texte}>
                  Les missions adressées à une société le sont par un client.
                  Aucune ne vous a été confiée pour l’instant.
                </Text>
              ) : null}
            </Card>
          )}
        </View>

        {/* =================================================
            PORTEFEUILLE
            ================================================= */}

        <View style={styles.section}>
          <SectionHeader title="Mon portefeuille" />

          <Card variant="secondary" style={styles.carte}>
            <View style={styles.soldeLigne}>
              <View style={styles.soldeBloc}>
                <Text style={styles.soldeLibelle}>Solde disponible</Text>
                <Text style={styles.soldeValeur}>
                  {portefeuille && !portefeuilleEnCours
                    ? formatCurrency(portefeuille.balance)
                    : '—'}
                </Text>
              </View>

              <View style={styles.soldeBloc}>
                <Text style={styles.soldeLibelle}>Sous séquestre</Text>
                <Text style={styles.soldeValeur}>
                  {portefeuille && !portefeuilleEnCours
                    ? formatCurrency(portefeuille.blockedBalance)
                    : '—'}
                </Text>
              </View>
            </View>

            <Text style={styles.note}>
              Le versement des sommes reste manuel tant que le module de paiement
              n’est pas activé.
            </Text>
          </Card>
        </View>

        {chargement ? <Text style={styles.chargement}>Lecture de votre espace…</Text> : null}
      </ScrollView>
    </View>
  );
}

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
  identiteTexte: {
    flex: 1,
    minWidth: 0,
    gap: SPACING.xs,
  },
  identiteNom: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: FONT_SIZES.xxl,
    lineHeight: 28,
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

  /* --- Sections --- */

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
  texte: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  note: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    color: COLORS.textLight,
  },
  groupe: {
    overflow: 'hidden',
  },

  /* --- Équipe --- */

  membre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  membreInitiale: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membreInitialeTexte: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  membreTextes: {
    flex: 1,
    minWidth: 0,
  },
  membreNom: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  membreMeta: {
    marginTop: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
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

  chargement: {
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
});




