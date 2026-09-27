import { Button, Card, Typography } from '@/components/ui';
import { COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';
import { completeOnboarding, getSelectedProfile, setSelectedProfile, type PublicProfile } from '@/lib/storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const profileOptions: { key: PublicProfile; title: string; description: string; icon: string }[] = [
  { key: 'client', title: 'Client', description: 'Je cherche un service de sécurité.', icon: '🧑‍💼' },
  { key: 'agent', title: 'Agent indépendant', description: 'Je propose mes services de sécurité.', icon: '🛡️' },
  { key: 'company', title: 'Entreprise', description: 'Je gère une équipe de prestataires.', icon: '🏢' },
];

export default function ProfileSelectionScreen() {
  const router = useRouter();
  const [selectedProfile, setSelectedProfileState] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getSelectedProfile()
      .then((profile) => { if (active) setSelectedProfileState(profile); })
      .catch(() => { if (active) setError('Impossible de restaurer votre choix de profil.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleContinue = async () => {
    if (!selectedProfile) return;
    try {
      setSaving(true);
      setError(null);
      await setSelectedProfile(selectedProfile);
      await completeOnboarding();
      router.replace({ pathname: '/(auth)/sign-in', params: { profile: selectedProfile } });
    } catch {
      setError('Impossible d’enregistrer votre profil. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="caption" color={COLORS.textSecondary}>ÉTAPE 2 / 2</Typography>
        <Typography variant="h1" style={styles.title}>Qui êtes-vous ?</Typography>
        <Typography variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
          Choisissez le profil qui correspond à votre activité. Ce choix nous aide à vous proposer le bon parcours.
        </Typography>
        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} /> : (
          <View style={styles.options}>
            {profileOptions.map((option) => {
              const selected = selectedProfile === option.key;
              return (
                <TouchableOpacity key={option.key} onPress={() => setSelectedProfileState(option.key)} accessibilityRole="button" accessibilityState={{ selected }}>
                  <Card variant={selected ? 'elevated' : 'secondary'} style={styles.card}>
                    <View style={styles.row}>
                      <Text style={styles.icon}>{option.icon}</Text>
                      <View style={styles.copy}>
                        <Text style={[styles.optionTitle, selected && styles.selectedText]}>{option.title}</Text>
                        <Text style={styles.description}>{option.description}</Text>
                      </View>
                      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Continuer" onPress={() => void handleContinue()} disabled={!selectedProfile || saving || loading} style={styles.button} />
        <Text style={styles.note}>Les droits finaux de votre profil seront vérifiés par Supabase.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, padding: SPACING.xl, justifyContent: 'center' },
  title: { marginTop: SPACING.md, marginBottom: SPACING.md },
  subtitle: { marginBottom: SPACING.xxl },
  loader: { marginVertical: SPACING.xxxl },
  options: { gap: SPACING.md },
  card: { padding: SPACING.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  icon: { fontSize: 34 },
  copy: { flex: 1 },
  optionTitle: { color: COLORS.text, fontSize: FONT_SIZES.lg, fontFamily: FONT_FAMILIES.displayBold },
  selectedText: { color: COLORS.primary },
  description: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  error: { color: COLORS.error, textAlign: 'center', marginTop: SPACING.md },
  button: { marginTop: SPACING.xxl },
  note: { color: COLORS.textLight, fontSize: FONT_SIZES.xs, textAlign: 'center', marginTop: SPACING.md },
});
