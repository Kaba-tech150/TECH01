import { COLORS, FONT_SIZES, SPACING } from '@/constants';
import { filtrerVilles, useVilles } from '@/features/villes';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface SelectVilleProps {
  value: string;
  onChange: (nom: string) => void;
  label: string;
  erreur?: string;
}

/**
 * Sélection d'une ville dans le référentiel administré.
 *
 * REMPLACE UN CHAMP TEXTE LIBRE
 *
 * Saisir « Saint-Denis » à la main produit des variantes non correspondantes,
 * et donc des missions impossibles à retrouver ou à pourvoir. Ici, la valeur
 * provient d'une liste fermée : l'administrateur contrôle la couverture
 * réelle, et l'utilisateur ne peut pas créer une ville fantôme.
 *
 * Une liste vide est un cas normal, pas une erreur : elle signifie qu'aucune
 * ville n'est encore ouverte. L'interface le dit au lieu d'afficher une zone
 * vide qui semblerait cassée.
 */
export function SelectVille({ value, onChange, label, erreur }: SelectVilleProps) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState('');
  const { data: villes, isPending, isError } = useVilles();

  const resultats = useMemo(
    () => filtrerVilles(villes ?? [], recherche),
    [villes, recherche],
  );

  const fermer = () => {
    setOuvert(false);
    setRecherche('');
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setOuvert(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${value || 'non renseignée'}`}
        style={[styles.champ, erreur ? styles.champErreur : null]}
      >
        <Text style={value ? styles.valeur : styles.valeurVide}>
          {value || 'Choisir une ville'}
        </Text>
        <Text style={styles.fleche}>▾</Text>
      </Pressable>

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Modal visible={ouvert} animationType="slide" transparent onRequestClose={fermer}>
        <View style={styles.voile}>
          <View style={styles.panneau}>
            <View style={styles.entete}>
              <Text style={styles.titre}>{label}</Text>
              <Pressable onPress={fermer} accessibilityRole="button" accessibilityLabel="Fermer">
                <Text style={styles.fermer}>✕</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.recherche}
              placeholder="Rechercher une ville ou un code postal"
              placeholderTextColor={COLORS.textLight}
              value={recherche}
              onChangeText={setRecherche}
              autoFocus
            />

            {isPending ? (
              <View style={styles.etat}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null}

            {isError ? (
              <Text style={styles.etatTexte}>
                Impossible de charger la liste des villes. Réessayez.
              </Text>
            ) : null}

            {!isPending && !isError && resultats.length === 0 ? (
              <Text style={styles.etatTexte}>
                {villes && villes.length > 0
                  ? 'Aucune ville ne correspond à cette recherche.'
                  : 'Aucune ville n’est encore disponible. Contactez le support.'}
              </Text>
            ) : null}

            <FlatList
              data={resultats}
              keyExtractor={(ville) => ville.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.nom);
                    fermer();
                  }}
                  style={({ pressed }) => [styles.ligne, pressed && styles.ligneActive]}
                >
                  <Text style={styles.nom}>{item.nom}</Text>
                  <Text style={styles.detail}>
                    {[item.code_postal, item.region].filter(Boolean).join(' · ')}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 4 },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  champ: {
    minHeight: 50,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  champErreur: { borderColor: COLORS.error },
  valeur: { color: COLORS.text, fontSize: FONT_SIZES.md, flex: 1 },
  valeurVide: { color: COLORS.textLight, fontSize: FONT_SIZES.md, flex: 1 },
  fleche: { color: COLORS.textSecondary, fontSize: 16 },
  erreur: { color: COLORS.error, fontSize: FONT_SIZES.sm },
  voile: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    justifyContent: 'flex-end',
  },
  panneau: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  titre: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text },
  fermer: { fontSize: 20, color: COLORS.textSecondary, padding: SPACING.xs },
  recherche: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    minHeight: 46,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
  etat: { padding: SPACING.xl, alignItems: 'center' },
  etatTexte: {
    padding: SPACING.xl,
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  ligne: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ligneActive: { backgroundColor: COLORS.backgroundSecondary },
  nom: { fontSize: FONT_SIZES.lg, color: COLORS.text, fontWeight: '600' },
  detail: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
});
