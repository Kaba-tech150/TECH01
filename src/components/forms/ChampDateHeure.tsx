import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { BORDER_RADIUS, COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '@/constants';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const PARTIE_DATE = /^(\d{4}-\d{2}-\d{2})/;
const PARTIE_HEURE = /(\d{2}):(\d{2})/;

type Etape = 'date' | 'heure' | null;

/** « 1 octobre 2026 à 14:00 », ou une forme lisible si la date est invalide. */
function formaterFrançais(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return 'Date invalide';
  }
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** La date du jour au format `AAAA-MM-JJ`, pour une valeur encore vide. */
function dateDuJour(): string {
  const aujourdhui = new Date();
  return [
    aujourdhui.getFullYear(),
    String(aujourdhui.getMonth() + 1).padStart(2, '0'),
    String(aujourdhui.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Remplace la partie date d'une valeur, en conservant l'heure choisie. */
function avecDate(valeur: string, choisie: Date): string {
  const annee = choisie.getFullYear();
  const mois = String(choisie.getMonth() + 1).padStart(2, '0');
  const jour = String(choisie.getDate()).padStart(2, '0');
  const heureExistante = PARTIE_HEURE.exec(valeur);
  return `${annee}-${mois}-${jour} ${heureExistante ? heureExistante[0] : '09:00'}`;
}

/** Remplace la partie heure d'une valeur, en conservant la date choisie. */
function avecHeure(valeur: string, choisie: Date): string {
  const jour = PARTIE_DATE.exec(valeur);
  const heures = String(choisie.getHours()).padStart(2, '0');
  const minutes = String(choisie.getMinutes()).padStart(2, '0');
  return `${jour ? jour[1] : dateDuJour()} ${heures}:${minutes}`;
}

interface ChampDateHeureProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  erreur?: string;
  /** Date minimale désactivable dans le calendrier. */
  dateMinimale?: Date;
}

/**
 * Champ de date et d'heure ouvrant le calendrier natif.
 *
 * POURQUOI UN SÉLECTEUR ET NON UN CHAMP TEXTE
 *
 * Saisir `2026-10-01 14:00` à la main est source d'erreur de format, et
 * l'utilisateur ne voit pas immédiatement quel jour il a choisi. Le sélecteur
 * natif supprime les deux problèmes : il impose le format et affiche la date
 * en clair.
 *
 * FORMAT DE STOCKAGE INCHANGÉ
 *
 * La valeur reste la chaîne `AAAA-MM-JJ HH:MM`, celle que le schéma Zod et
 * `versIso` attendent déjà. Le composant ne change donc pas le contrat du
 * formulaire : il énonce la valeur au lieu de la laisser saisir.
 *
 * ENCHAÎNEMENT DATE PUIS HEURE
 *
 * Un seul champ doit saisir deux notions. Après le choix de la date, le
 * sélecteur d'heure s'ouvre automatiquement, pour éviter un second appui.
 */
export function ChampDateHeure<T extends FieldValues>({
  control,
  name,
  label,
  erreur,
  dateMinimale,
}: ChampDateHeureProps<T>) {
  const [etape, setEtape] = useState<Etape>(null);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => {
        // Le schéma garantit une chaîne ; le cast est nécessaire car `value`
        // reste typé comme `FieldValues` sur un composant générique.
        const valeur = typeof value === 'string' ? (value as string) : '';
        const dateCourante = valeur ? new Date(valeur.replace(' ', 'T')) : new Date();

        const surChangement = (event: DateTimePickerEvent, choisie?: Date) => {
          // Sur Android, le sélecteur se referme seul : l'état doit être
          // libéré dans tous les cas, sinon le composant resterait « ouvert »
          // sans rien afficher.
          if (Platform.OS === 'android') {
            setEtape(null);
          }

          if (event.type === 'dismissed' || !choisie) {
            return;
          }

          if (etape === 'heure') {
            onChange(avecHeure(valeur, choisie));
            if (Platform.OS === 'ios') setEtape(null);
            return;
          }

          onChange(avecDate(valeur, choisie));
          setEtape('heure');
        };

        return (
          <View style={styles.group}>
            <Text style={styles.label}>{label}</Text>

            <Pressable
              onPress={() => setEtape('date')}
              accessibilityRole="button"
              accessibilityLabel={`${label} : ${valeur || 'non renseigné'}`}
              style={[styles.input, erreur ? styles.inputError : null]}
            >
              <Text style={valeur ? styles.valeur : styles.valeurVide}>
                {valeur
                  ? formaterFrançais(new Date(valeur.replace(' ', 'T')))
                  : 'Choisir une date'}
              </Text>
              <Text style={styles.calendar}>📅</Text>
            </Pressable>

            {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

            {etape ? (
              <View style={styles.calendrier}>
                <DateTimePicker
                  value={dateCourante}
                  mode={etape === 'heure' ? 'time' : 'date'}
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={surChangement}
                  minimumDate={etape === 'date' ? dateMinimale : undefined}
                  locale="fr-FR"
                  accentColor={COLORS.primary}
                />
                {/*
                  Sur iOS, le sélecteur reste affiché après le choix. Le bouton
                  ferme l'ensemble ; sur Android il est inutile, la fermeture
                  étant automatique.
                */}
                {Platform.OS === 'ios' ? (
                  <Pressable onPress={() => setEtape(null)} style={styles.fermer}>
                    <Text style={styles.fermerTexte}>Terminé</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  group: { gap: 4 },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  input: {
    minHeight: 50,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  inputError: { borderColor: COLORS.error },
  valeur: { color: COLORS.text, fontSize: FONT_SIZES.md, flex: 1 },
  valeurVide: { color: COLORS.textLight, fontSize: FONT_SIZES.md, flex: 1 },
  calendar: { fontSize: 18 },
  erreur: { color: COLORS.error, fontSize: FONT_SIZES.sm },
  calendrier: {
    marginTop: 4,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    overflow: 'hidden',
  },
  fermer: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  fermerTexte: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
});
