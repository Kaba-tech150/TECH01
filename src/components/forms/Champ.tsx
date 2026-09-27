import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

interface ChampProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
}

/**
 * Champ de formulaire relié à React Hook Form.
 *
 * Extraire ce composant évite de répéter treize fois le même bloc
 * `Controller` + `label` + `erreur` dans le formulaire, et surtout évite que
 * l'affichage des erreurs diverge d'un champ à l'autre.
 */
export function Champ<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  hint,
  error,
  multiline = false,
  keyboardType = 'default',
}: ChampProps<T>) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              multiline && styles.multiline,
              error ? styles.inputError : null,
            ]}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textLight}
            value={typeof value === 'string' ? value : String(value ?? '')}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline={multiline}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === 'default' ? 'sentences' : 'none'}
          />
        )}
      />
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.semibold,
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
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  hint: {
    color: COLORS.textLight,
    fontSize: FONT_SIZES.sm,
  },
  error: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
  },
});