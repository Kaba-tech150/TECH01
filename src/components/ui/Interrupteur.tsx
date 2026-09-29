import { StyleSheet, Switch, View } from 'react-native';
import { COLORS } from '@/constants';

interface InterrupteurProps {
  value: boolean;
  onValueChange: (valeur: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

/**
 * Interrupteur de réglage.
 *
 * La maquette dessine une bascule de 44×24 px, avec un curseur blanc de 20 px
 * et une piste pleine quand l'état est actif. `Switch` natif a des dimensions
 * fixes par plateforme : le redessiner à la main serait réinventer un contrôle
 * système, et perdre au passage ce que le lecteur d'écran et les réglages
 * système connaissent de lui.
 *
 * La piste reprend `COLORS.border` au repos et `COLORS.primary` à l'actif.
 * L'ambre est réservé aux pips et aux liserés d'état : une bascule ambrée sur
 * fond clair descend sous le seuil de lisibilité du curseur.
 */
export function Interrupteur({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: InterrupteurProps) {
  return (
    <View style={styles.base}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={COLORS.surfaceContainerLowest}
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});