import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';
import type { Prestataire } from '@/services';

interface CartePrestataireProps {
  prestataire: Prestataire;
}

/**
 * Fiche d'un prestataire dans les résultats de recherche.
 *
 * AUCUNE ACTION ICI, ET C'EST VOLONTAIRE.
 *
 * Ce composant est en lecture seule : il n'ouvre pas de réservation. La
 * réservation est une ÉCRITURE, et le projet n'a encore jamais validé une seule
 * écriture de bout en bout — la création de mission remained bloquée par un
 * défaut de session jusqu'au 2026-09-27. On ne construit pas le bouton qui
 * déclenche une écriture avant que l'écriture soit fiable : un bouton qui échoue
 * est pire qu'un bouton absent, parce qu'il fait perdre confiance au reste.
 *
 * Les champs absents sont MASQUÉS, jamais affichés vides : une société n'a pas
 * de tarif horaire dans le modèle, et afficher « Tarif : — » ferait croire à un
 * bug de données.
 */
export function CartePrestataire({ prestataire }: CartePrestataireProps) {
  const estAgent = prestataire.kind === 'agent';
  const disponible = prestataire.isAvailable === true;

  return (
    <View style={styles.carte}>
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

      {(prestataire.city || prestataire.zone) && (
        <Text style={styles.localisation}>
          {[prestataire.city, prestataire.zone].filter(Boolean).join(' · ')}
        </Text>
      )}

      {(prestataire.bio || prestataire.description) && (
        <Text style={styles.description} numberOfLines={3}>
          {prestataire.bio ?? prestataire.description}
        </Text>
      )}

      {prestataire.hourlyRate && (
        <Text style={styles.tarif}>
          {Number(prestataire.hourlyRate).toLocaleString('fr-FR')} € / heure
        </Text>
      )}

      {prestataire.certificationNumber && (
        <Text style={styles.certification}>
          Certification n° {prestataire.certificationNumber}
        </Text>
      )}
    </View>
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
