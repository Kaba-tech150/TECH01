import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, LigneReglage, SectionHeader } from '@/components/ui';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  HAIRLINE,
  SCREEN_PADDING,
  SPACING,
} from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import { useMesDocuments } from '@/features/documents';
import { estDocumentValide, type TypeDocument } from '@/services';
import { formatDate, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/utils';

/**
 * Écran « Profil & Paramètres », d'après `design/paramettre.html`.
 *
 * LA MAQUETTE DESSINE UNE CONSOLE D'ENTREPRISE. L'APPLICATION EST UNE PLACE DE
 * MARCHÉ. LE TRI EST FAIT SUR CE QUE LE MODÈLE PEUT MESURER.
 *
 * Sur les vingt blocs dessinés, QUATRE sont alimentés par une lecture réelle :
 *
 *   - l'identité : `profiles`, `agent_profiles`, `company_profiles` ;
 *   - les justificatifs : `documents`, avec leur `status` et leur expiration ;
 *   - la déconnexion : `AuthContext.signOut` ;
 *   - la version : `app.json` annonce `1.0.0`, et non « Enterprise v2.4.0 ».
 *
 * LES SEIZE AUTRES SONT RENDUS `desactive`, ET NON FABRIQUÉS.
 *
 * Ce sont la 2FA, la biométrie, l'historique de mot de passe, les sessions
 * actives, le code PIN SOS, les trois interrupteurs de notification, les canaux
 * d'envoi, la signature eIDAS, l'export RGPD, la carte, le choix de langue, le
 * thème, le canal support et les CGV. Aucun n'a de colonne, aucune migration ne
 * les prévoit, et les bibliothèques qui les portent — `expo-notifications`,
 * `expo-local-authentication`, `react-native-maps` — ne sont pas installées.
 *
 * Les rendre actifs produirait seize interrupteurs qui se remettent seuls au
 * rechargement et laisseraient croire que le compte est surveillé. Ils sont donc
 * listés, et marqués « Non configuré » : on peut les cocher d'un coup d'œil
 * sans mentir sur ce qu'ils protègent.
 *
 * LES MENTIONS DE CONFORMITÉ SONT ABSENTES.
 *
 * « Hébergement SecNumCloud », « ANSIS France », « Audit trimestriel »,
 * « Chiffrement AES-GCM 256-bits » et « Matricule ID #CL-8849-FR » ne sont
 * établis par rien dans le dépôt. Le pied de page affiche la version réelle du
 * projet, et c'est tout.
 */

/** Libellés français des types de pièces, alignés sur `document_type`. */
const LIBELLES_PIECE: Record<TypeDocument, string> = {
  identity: "Pièce d'identité",
  certification: 'Certification',
  insurance: 'Assurance',
  other: 'Autre justificatif',
};

/** Version déclarée dans `app.json`. La maquette affiche « v2.4.0 (Build 8904) ». */
const VERSION = '1.0.0';

export default function ClientProfile() {
  const { user, profile, roles, signOut } = useAuthContext();
  const { data: documents, isPending: documentsEnCours } = useMesDocuments(user?.id);

  const nomAffiche = profile?.full_name?.trim() || 'Utilisateur SecuGuard';
  const initiale = nomAffiche.charAt(0).toUpperCase();

  /*
   * LA QUALIFICATION EST CELLE DES RÔLES RÉELS.
   *
   * `ROLE_DESCRIPTIONS` décrit ce que le rôle permet, pas la fonction exercée
   * par la personne. Écrire « Directeur Sécurité & Sûreté » depuis cette table
   * serait inventer un métier que la base ne contient pas.
   */
  const rolePrincipal = roles[0];
  const qualification = rolePrincipal ? ROLE_DESCRIPTIONS[rolePrincipal] : null;

  const valides = useMemo(
    () => (documents ?? []).filter(estDocumentValide).length,
    [documents],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* =================================================
          IDENTITÉ
          ================================================= */}

      <Card variant="secondary" style={styles.identite}>
        <View style={styles.identiteHaut}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitiale}>{initiale}</Text>
          </View>

          <View style={styles.identiteTextes}>
            <Text style={styles.identiteNom} numberOfLines={1}>
              {nomAffiche}
            </Text>
            {rolePrincipal ? (
              <Badge text={ROLE_LABELS[rolePrincipal]} variant="neutral" />
            ) : null}
          </View>
        </View>

        {qualification ? (
          <Text style={styles.qualification} numberOfLines={2}>
            {qualification}
          </Text>
        ) : null}

        {user?.email ? (
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        ) : null}

        {/*
         * AUCUN BOUTON « MODIFIER MON PROFIL » ICI.
         *
         * La maquette en propose un, mais aucune route d'édition n'existe : le
         * bouton mènerait à cet écran lui-même, et il dirait possible de
         * modifier des informations que rien ne permet d'enregistrer. La
         * modification du nom et du téléphone relève de l'étape 8.
         */}
      </Card>

      {/* =================================================
          SÉCURITÉ ET ACCÈS

          Aucune de ces cinq lignes n'est active. Elles sont listées pour que la
          section existe, et chacune est marquée « Non configuré ».
          ================================================= */}

      <View style={styles.section}>
        <SectionHeader title="Sécurité et accès" />

        <Card variant="secondary" padding={0} style={styles.groupe}>
          <LigneReglage
            icon="shield-key-outline"
            title="Double authentification (2FA)"
            subtitle="SMS prioritaire et clé TOTP"
            desactive
          />
          <LigneReglage
            icon="fingerprint"
            title="Biométrie (Face ID / Empreinte)"
            subtitle="Déverrouillage rapide de l'application"
            desactive
          />
          <LigneReglage icon="key-outline" title="Mot de passe" desactive />
          <LigneReglage
            icon="monitor-cellphone"
            title="Appareils et sessions actives"
            desactive
          />
          <LigneReglage icon="dialpad" title="Code PIN d'urgence" desactive />
        </Card>

        <Text style={styles.note}>
          La double authentification, la biométrie et le code PIN d’urgence ne
          sont pas encore pris en charge. Aucun de ces réglages n’est appliqué.
        </Text>
      </View>

      {/* =================================================
          NOTIFICATIONS

          La table `notifications` reçoit des messages : ce n'est pas une table
          de préférences. Aucun réglage d'alerte n'existe, et `expo-notifications`
          n'est pas installé. Les trois lignes sont donc listées, pas actives.
          ================================================= */}

      <View style={styles.section}>
        <SectionHeader title="Notifications et alertes" />

        <Card variant="secondary" padding={0} style={styles.groupe}>
          <LigneReglage icon="bell-alert-outline" title="Alertes critiques et SOS" desactive />
          <LigneReglage
            icon="clipboard-clock-outline"
            title="Missions et rondes de garde"
            desactive
          />
          <LigneReglage
            icon="file-document-outline"
            title="Rapports d'incident et main courante"
            desactive
          />
        </Card>

        <Text style={styles.note}>
          Aucun canal d’envoi n’est configuré : ni notification push, ni SMS,
          ni courriel automatique. L’application ne déclenche pas d’alerte pour
          l’instant.
        </Text>
      </View>

      {/* =================================================
          CONFORMITÉ

          SEULE SECTION ALIMENTÉE APRÈS L'IDENTITÉ. `documents` porte un statut
          et une date d'expiration, deux informations qui se comptent et se
          comparent. C'est le seul endroit de la maquette où le modèle produit
          un compteur exact.
          ================================================= */}

      <View style={styles.section}>
        <SectionHeader title="Conformité et légal" />

        <Card variant="secondary" padding={0} style={styles.groupe}>
          <LigneReglage
            icon="file-certificate-outline"
            title="Agréments et justificatifs"
            subtitle={
              documentsEnCours
                ? 'Lecture de vos pièces…'
                : documents && documents.length > 0
                  ? `${valides} valide${valides > 1 ? 's' : ''} sur ${documents.length}`
                  : 'Aucune pièce déposée'
            }
            trailing={valides > 0 ? String(valides) : undefined}
          />
          <LigneReglage
            icon="signature-freehand"
            title="Délégation de signature électronique"
            desactive
          />
          <LigneReglage
            icon="database-export-outline"
            title="Export des données et registre"
            desactive
          />
        </Card>

        {/*
         * LES PIÈCES SONT LISTÉES, ET LEUR NOMBRE EST COMPTÉ.
         *
         * Sans ce décompte, la ligne « Agréments » n'afficherait qu'un libellé et
         * l'utilisateur ne saurait pas s'il a des justificatifs. Le compteur
         * retient les statuts `validated` et `active`, et eux seuls.
         */}
        {documents && documents.length > 0 ? (
          <View style={styles.pieces}>
            {documents.slice(0, 5).map((document) => (
              <View key={document.id} style={styles.piece}>
                <View style={styles.pieceTextes}>
                  <Text style={styles.pieceNom} numberOfLines={1}>
                    {document.name}
                  </Text>
                  <Text style={styles.pieceMeta} numberOfLines={1}>
                    {LIBELLES_PIECE[document.type]}
                    {document.expiryDate
                      ? ` · jusqu'au ${formatDate(document.expiryDate, 'short')}`
                      : ''}
                  </Text>
                </View>
                <Badge
                  text={estDocumentValide(document) ? 'Valide' : 'En attente'}
                  variant={estDocumentValide(document) ? 'success' : 'warning'}
                />
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.note}>
          La signature électronique et l’export de vos données ne sont pas
          disponibles. Le dépôt d’une pièce passe par un contrôle administratif.
        </Text>
      </View>

      {/* =================================================
          PRÉFÉRENCES

          La langue et le thème ne sont PAS des sélecteurs : l'application n'a
          ni i18n ni thème sombre. Les afficher comme réglables promettrait un
          choix sans effet. Ils disent ce qui est appliqué.
          ================================================= */}

      <View style={styles.section}>
        <SectionHeader title="Préférences générales" />

        <Card variant="secondary" padding={0} style={styles.groupe}>
          <LigneReglage
            icon="translate"
            title="Langue de l’interface"
            trailing="Français"
          />
          <LigneReglage
            icon="theme-light-dark"
            title="Thème visuel"
            trailing="Non appliqué"
          />
        </Card>

        <Text style={styles.note}>
          L’interface est en français et suit le thème du système. Aucun autre
          choix de langue ou d’apparence n’est proposé pour l’instant.
        </Text>
      </View>

      {/* =================================================
          DÉCONNEXION

          SEULE ACTION RÉELLEMENT EXÉCUTABLE DE L'ÉCRAN.
          ================================================= */}

      <Button title="Se déconnecter" icon="logout" variant="outline" onPress={() => void signOut()} />

      {/*
       * LA VERSION EST CELLE DE `app.json`.
       *
       * La maquette écrit « SecuGuard Enterprise v2.4.0 (Build 8904) ». Le
       * projet est en `1.0.0`, et il n'est pas « Enterprise » : c'est une
       * application de mise en relation. Écrire ce qui n'est pas serait le genre
       * de détail que personne ne contrôle et qui se retrouve sur les captures
       * d'écran des utilisateurs.
       */}
      <Text style={styles.pied}>SecuGuard {VERSION}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },

  /* --- Identité --- */

  identite: {
    gap: SPACING.md,
  },
  identiteHaut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitiale: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 28,
    color: COLORS.onWhite,
  },
  identiteTextes: {
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
  qualification: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  email: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },

  /* --- Sections --- */

  section: {
    gap: SPACING.sm,
  },
  groupe: {
    overflow: 'hidden',
  },
  note: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    color: COLORS.textLight,
  },

  /* --- Pièces justificatives --- */

  pieces: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  piece: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
  pieceTextes: {
    flex: 1,
    minWidth: 0,
  },
  pieceNom: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  pieceMeta: {
    marginTop: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },

  /* --- Pied --- */

  pied: {
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
});





