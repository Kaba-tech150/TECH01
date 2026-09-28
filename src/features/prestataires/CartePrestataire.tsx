import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';
import type { Prestataire } from '@/services';

interface CartePrestataireProps {
  prestataire: Prestataire;
  /**
   * Ouvre la réservation de ce prestataire.
   *
   * FACULTATIF ET NULLABLE. Sans gestionnaire, la carte reste une fiche de
   * lecture, et le composant reste réutilisable dans un écran de consultation.
   *
   * Elle ne déclenche JAMAIS l'écriture elle-même : elle appelle un
   * gestionnaire, et c'est l'écran qui décide. Une carte qui réserverait
   * elle-même serait inutilisable ailleurs, et son action impossible à tester.
   */
  onPress?: () => void;
}

/**
 * Fiche d'un prestataire dans les résultats de recherche.
 *
 * DEVENUE ACTIONNABLE LE 2026-09-28, ET CE COMMENTAIRE N'EST PLUS VRAI.
 *
 * Elle ne l'était pas, et le motif était raisonnable : on ne construit pas le
 * bouton qui déclenche une écriture avant d'avoir prouvé que l'écriture
 * fonctionne. Elle fonctionne maintenant sur un parcours — mission créée et
 * fiche agent enregistrées depuis l'écran, 21 contrôles de la base au vert.
 *
 * Le principe de prudence était justifié à sa date. Le conserver aurait fait de
 * ce fichier un mensonge, ce qui est plus grave que de le corriger.
 *
 * Les champs absents sont MASQUÉS, jamais affichés vides : une société n'a pas
 * de tarif horaire dans le modèle, et afficher « Tarif : — » ferait croire à un
 * bug de données.
 */
export function CartePrestataire({ prestataire, onPress }: CartePrestataireProps) {
  const estAgent = prestataire.kind === 'agent';
  const disponible = prestataire.isAvailable === true;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Reserver ${prestataire.nom}`}
      style={styles.carte}
    >
      <View style={styles.entete}>
        <View style={styles.identite}>
          <Text style={styles.nom} numberOfLines={1}>
            {prestataire.nom}
          </Text>
          <Text style={styles.type}>
            {estAgent ? 'Agent de sécurité' : 'Société de sécurité'}
          </Text>
        </View>

        {estAgent &&
          (disponible ? (
            <Badge text="Disponible" variant="success" />
          ) : (
            <Badge text="Indisponible" variant="neutral" />
          ))}
        {!estAgent && <Badge text="Société" variant="primary" />}
      </View>

      {/*
       * TOUTES CES CONDITIONS SONT DES BOOLÉENS, JAMAIS DES CHAÎNES.
       *
       * Bug corrigé le 2026-09-27, le même que dans `search.tsx` : écrire
       *
       *     {prestataire.city || prestataire.zone && ( <Text/> )}
       *
       * produit `'' && …`, c'est-à-dire une chaîne vide, que React rend comme
       * un NŒUD TEXTE enfant du `<View>`. React ignore `null`, `undefined`,
       * `true` et `false` — mais pas `''`.
       *
       * Aucune de ces erreurs n'est visible à la compilation : `string` et
       * `boolean` sont tous deux acceptables dans un `&&`, et `tsc` comme
       * `eslint` passent sans rien signaler. Seule l'exécution les révèle.
       */}
      {Boolean(prestataire.city || prestataire.zone) && (
        <Text style={styles.localisation}>
          {[prestataire.city, prestataire.zone].filter(Boolean).join(' · ')}
        </Text>
      )}

      {Boolean(prestataire.bio || prestataire.description) && (
        <Text style={styles.description} numberOfLines={3}>
          {prestataire.bio ?? prestataire.description}
        </Text>
      )}

      {Boolean(prestataire.hourlyRate) && (
        <Text style={styles.tarif}>
          {Number(prestataire.hourlyRate).toLocaleString('fr-FR')} € / heure
        </Text>
      )}

      {Boolean(prestataire.certificationNumber) && (
        <Text style={styles.certification}>
          Certification n° {prestataire.certificationNumber}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  identite: {
    flex: 1,
  },
  nom: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILIES.displayBold,
    color: COLORS.text,
  },
  type: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  localisation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  description: {
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tarif: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.displaySemibold,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  certification: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
