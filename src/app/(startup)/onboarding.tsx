import { completeOnboarding } from '@/lib/storage';
import { Button, Typography } from '@/components/ui';
import { BORDER_RADIUS, COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '@/constants';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const slides = [
  { icon: '🛡️', title: 'Une sécurité pensée pour vous', description: 'SecuGuard vous aide à trouver le bon prestataire pour protéger ce qui compte vraiment.' },
  { icon: '🤝', title: 'Des professionnels vérifiés', description: 'Les agents et sociétés déclarent leur profil et leurs documents pour construire une relation de confiance.' },
  { icon: '📍', title: 'Un suivi de vos missions', description: 'Décrivez votre besoin, échangez avec votre prestataire et suivez la mission depuis votre espace.' },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const handleContinue = () => {
    if (isLastSlide) {
      router.replace('/(startup)/profile-selection');
      return;
    }
    setCurrentSlide((value) => value + 1);
  };

  const handleExistingAccount = async () => {
    try {
      setError(null);
      await completeOnboarding();
      router.replace('/(auth)/sign-in');
    } catch {
      setError('Impossible de terminer le démarrage. Réessayez.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Typography variant="caption" color={COLORS.textSecondary}>SECU GUARD</Typography>
          <TouchableOpacity onPress={() => void handleExistingAccount()}>
            <Text style={styles.skipText}>J’ai déjà un compte</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.illustration}><Text style={styles.icon}>{slide.icon}</Text></View>
        <View style={styles.copy}>
          <Typography variant="h1" style={styles.title}>{slide.title}</Typography>
          <Typography variant="body" color={COLORS.textSecondary} style={styles.description}>{slide.description}</Typography>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.dots} accessibilityLabel={`Étape ${currentSlide + 1} sur ${slides.length}`}>
          {slides.map((item, index) => <View key={item.title} style={[styles.dot, index === currentSlide && styles.activeDot]} />)}
        </View>
        <Button title={isLastSlide ? 'Choisir mon profil' : 'Suivant'} onPress={handleContinue} style={styles.button} />
        {!isLastSlide ? <Button title="Passer" variant="outline" onPress={() => router.replace('/(startup)/profile-selection')} style={styles.button} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, padding: SPACING.xl, justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skipText: { color: COLORS.primary, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semibold },
  illustration: { alignItems: 'center', marginVertical: SPACING.xxxl },
  icon: { fontSize: 96 },
  copy: { alignItems: 'center' },
  title: { textAlign: 'center', marginBottom: SPACING.md },
  description: { textAlign: 'center' },
  error: { color: COLORS.error, textAlign: 'center', marginTop: SPACING.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginVertical: SPACING.xxl },
  dot: { width: 8, height: 8, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.border },
  activeDot: { width: 24, backgroundColor: COLORS.primary },
  button: { marginTop: SPACING.md },
});
