import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Typography } from '@/components/ui';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  HAIRLINE,
  SCREEN_PADDING,
  SHADOWS,
  SPACING,
} from '@/constants';
import { completeOnboarding } from '@/lib/storage';

/*
 * Écran « Bienvenue » — maquette `design/bienvenue_onboarding.html`.
 *
 * CE QUI A CHANGÉ, ET POURQUOI
 *
 * L'ancien écran était un carrousel générique : trois émojis 🛡️ 🤝 📍 et
 * trois phrases. La maquette n'a pas d'émoji. Elle a un poste de dispatch navy,
 * un ruban de certification, trois indicateurs et trois promesses
 * vérifiables. Les chiffres du poste (« < 14 min », « 99.98% ») sont
 * décoratifs : ce sont des valeurs de présentation, pas des mesures. C'est
 * assumé — cet écran vend une offre, il ne rend pas compte. Aucune de ces
 * valeurs ne provient de la base.
 *
 * LE CARROUSEL NE CHANGE QUE LE TEXTE
 *
 * Le script de la maquette ne fait varier que `slide-title` et
 * `slide-description` ; le poste de dispatch reste identique d'un écran à
 * l'autre. C'est ce qui est implémenté. Changer l'illustration par slide
 * serait plus spectaculaire, mais ce serait inventer.
 *
 * LE TROISIÈME SLIDE N'A JAMAIS MANQUÉ
 *
 * Les trois titres et descriptions sont dans le `<script>` du fichier HTML.
 * L'inventaire des maquettes les avait perdus parce que seul le rendu du
 * premier était lisible à l'œil.
 */

interface Slide {
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    title: "La sécurité privée d'excellence, en temps réel.",
    description:
      "Agents certifiés CNAPS, SSIAP et rondiers d'intervention disponibles immédiatement pour entreprises, commerces et événements.",
  },
  {
    title: 'Supervision active & déploiement instantané.',
    description:
      'Affectez en quelques clics des patrouilleurs motorisés et suivez leur position GPS géofencée en streaming crypté.',
  },
  {
    title: 'Audit légal & transparence certifiée.',
    description:
      'Téléchargez vos mains courantes dématérialisées conformes au Code de la Sécurité Intérieure directement sur mobile.',
  },
];

/** Les trois promesses sous le titre. */
const TRUST_BADGES: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  detail: string;
}[] = [
  {
    icon: 'shield-check',
    title: 'Agents vérifiés sous 24h',
    detail: 'Casier judiciaire, agrément préfectoral et carte PRO.',
  },
  {
    icon: 'wallet',
    title: 'Paiement sous séquestre B2B',
    detail: 'Fonds sécurisés débloqués après validation de fin de garde.',
  },
  {
    icon: 'history',
    title: 'Main courante électronique SHA-256',
    detail: 'Rapports infalsifiables et horodatés juridiquement recevables.',
  },
];

/** Durée d'affichage d'un slide avant passage automatique, en millisecondes. */
const SLIDE_DURATION = 5000;

/**
 * Poste de dispatch : le bloc navy de la maquette.
 *
 * Il n'y a pas d'image, et c'est volontaire. La maquette utilise un SVG de
 * grille et un faisceau en rotation ; ici ces deux éléments sont dessinés en
 * `View` posés en absolu, et le faisceau tourne en `Animated`. Importer un
 * PNG de 220 px de haut pour une seule page serait plus court et moins
 * adaptable : le bloc doit rester lisible à 320 comme à 420 points de large.
 */
function DispatchPanel() {
  /*
   * `useState` et non `useRef` : la règle `react-hooks/refs` interdit de lire
   * un ref pendant le rendu, or `interpolate` est justement appelé au rendu pour
   * produire la transformation. L'initialisation paresseuse garantit une seule
   * instance, la valeur ne changeant jamais, l'effet n'a qu'à la démarrer.
   */
  const [rotation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.panel}>
      {/* Grille de fond et halo, comme le dégradé radial de la maquette. */}
      <View style={styles.panelGlow} pointerEvents="none" />

      <View style={styles.panelTopRow}>
        <View style={styles.panelPill}>
          <View style={styles.pulseDot} />
          <Typography variant="overline" color={COLORS.primaryLight} uppercase>
            Protection 24/7 &amp; Géolocalisation
          </Typography>
        </View>
        <View style={styles.panelLock}>
          <MaterialCommunityIcons name="lock" size={12} color={COLORS.onPrimaryContainer} />
          <Typography variant="caption" color={COLORS.onPrimaryContainer} style={styles.panelLockText}>
            SHA-256
          </Typography>
        </View>
      </View>

      <View style={styles.radar}>
        {/* Cercles concentriques : trois bordures, trois opacités. */}
        <View style={[styles.radarRing, styles.radarRingOuter]} />
        <View style={[styles.radarRing, styles.radarRingMiddle]} />
        <View style={[styles.radarRing, styles.radarRingInner]} />

        {/* Faisceau en rotation. */}
        <Animated.View style={[styles.radarBeam, { transform: [{ rotate: spin }] }]} />

        {/* Blips. */}
        <View style={[styles.blip, styles.blipTop]}>
          <View style={styles.blipDot} />
          <Typography variant="overline" color={COLORS.primaryLight} style={styles.blipText}>
            SSIAP-2
          </Typography>
        </View>
        <View style={[styles.blip, styles.blipBottom]}>
          <View style={styles.blipDot} />
          <Typography variant="overline" color={COLORS.primaryLight} style={styles.blipText}>
            Rondier #41
          </Typography>
        </View>

        {/* Emblème central. */}
        <View style={styles.emblem}>
          <MaterialCommunityIcons name="shield" size={26} color={COLORS.secondaryContainer} />
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric label="Délai moyen" value="< 14 min" />
        <Metric label="Disponibilité" value="99.98%" />
        <Metric label="Vérification" value="100% CNAPS" />
      </View>
    </View>
  );
}

/** Une case de la bande d'indicateurs. Les libellés sont en `onPrimaryContainer`. */
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Typography variant="overline" color={COLORS.onPrimaryContainer} uppercase>
        {label}
      </Typography>
      <Typography variant="label" color={COLORS.primaryLight} style={styles.metricValue}>
        {value}
      </Typography>
    </View>
  );
}


export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const slide = SLIDES[index];

  // La maquette fait défiler seule ses trois écrans. Le défilement est
  // automatique ET les pastilles sont pressables : sans cela, un utilisateur
  // qui laisse l'application ouverte en fond verrait ses textes tourner sous
  // son pouce, sans pouvoir les arrêter.
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((value) => (value + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  /**
   * Sortie de l'onboarding.
   *
   * On marque l'onboarding comme terminé AVANT de naviguer, sur les trois
   * issues. Sans cela, un utilisateur qui passe par « Créer un compte » se
   * reverrait l'onboarding à la prochaine ouverture. L'échec est signalé à
   * l'écran plutôt que silencié : l'ancien code le faisait déjà, et une
   * erreur muette ici se paie au redémarrage suivant.
   */
  const leave = async (destination: '/(auth)/sign-in' | '/(auth)/sign-up' | '/(startup)/profile-selection') => {
    try {
      setError(null);
      await completeOnboarding();
      router.replace(destination);
    } catch {
      setError('Impossible de terminer le démarrage. Réessayez.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* En-tête : marque, niveau « Enterprise », et « Passer ». */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <MaterialCommunityIcons name="shield" size={18} color={COLORS.onPrimary} />
            </View>
            <View>
              <Typography variant="label" style={styles.brandName}>
                SecuGuard
              </Typography>
              <Typography variant="overline" color={COLORS.textSecondary} uppercase style={styles.brandTier}>
                Enterprise
              </Typography>
            </View>
          </View>
          <Pressable
            onPress={() => void leave('/(startup)/profile-selection')}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Passer la présentation"
          >
            <Typography variant="label" color={COLORS.textSecondary}>
              Passer
            </Typography>
          </Pressable>
        </View>

        {/* Ruban de certification. */}
        <View style={styles.certification}>
          <View style={styles.certificationDot} />
          <Typography variant="overline" color={COLORS.onSecondaryContainer} uppercase>
            Plateforme Nationale Certifiée CNAPS
          </Typography>
        </View>

        <DispatchPanel />

        {/* Pastilles. `accessibilityRole` les rend actionnables au lecteur d'écran. */}
        <View style={styles.dots} accessibilityRole="tablist">
          {SLIDES.map((item, position) => (
            <Pressable
              key={item.title}
              onPress={() => setIndex(position)}
              accessibilityRole="tab"
              accessibilityState={{ selected: position === index }}
              accessibilityLabel={`Étape ${position + 1} sur ${SLIDES.length}`}
              hitSlop={8}
            >
              <View style={[styles.dot, position === index ? styles.dotActive : null]} />
            </Pressable>
          ))}
        </View>

        <Typography variant="h2" style={styles.title}>
          {slide.title}
        </Typography>
        <Typography variant="body" color={COLORS.textSecondary} style={styles.description}>
          {slide.description}
        </Typography>

        {error ? (
          <Typography variant="caption" color={COLORS.error} style={styles.error}>
            {error}
          </Typography>
        ) : null}

        <View style={styles.badges}>
          {TRUST_BADGES.map((badge) => (
            <View key={badge.title} style={styles.badge}>
              <View style={styles.badgeIcon}>
                <MaterialCommunityIcons name={badge.icon} size={16} color={COLORS.onSecondaryContainer} />
              </View>
              <View style={styles.badgeText}>
                <Typography variant="label" numberOfLines={1}>
                  {badge.title}
                </Typography>
                <Typography variant="caption" numberOfLines={2}>
                  {badge.detail}
                </Typography>
              </View>
            </View>
          ))}
        </View>

        <Button
          title="Créer un compte"
          icon="arrow-right"
          onPress={() => void leave('/(auth)/sign-up')}
          style={styles.cta}
        />
        <Button
          title="J'ai déjà un compte"
          variant="secondary"
          size="md"
          onPress={() => void leave('/(auth)/sign-in')}
        />

        <Typography variant="caption" color={COLORS.textLight} style={styles.legal}>
          En continuant, vous acceptez les conditions générales d&apos;utilisation et la politique de confidentialité de SecuGuard SAS.
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * FEUILLE DE STYLE — relevée sur `design/bienvenue_onboarding.html`.
 *
 * Les classes `Tailwind` de la maquette sont converties en valeurs du
 * `StyleSheet`. Deux écarts assumés :
 *
 * - Les opacités `/15`, `/20`, `/30` deviennent des `rgba()` explicites.
 * - Le halo `blur-2xl` et le `backdrop-blur` n'ont pas d'équivalent : un aplat
 *   translucide remplace le flou, ce qui tient sur les deux plateformes.
 */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: SPACING.xxl,
  },

  /* --- En-tête : marque + « Passer » --- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    letterSpacing: -0.2,
  },
  brandTier: {
    // `tracking-widest` de la maquette, sur un corps de 10px déjà petit.
    letterSpacing: 1.4,
  },
  skipButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },

  /* --- Ruban de certification --- */
  certification: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.secondaryContainer,
  },
  certificationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },

  /* --- Poste de dispatch (navy) --- */
  panel: {
    position: 'relative',
    minHeight: 220,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...SHADOWS.raised,
  },
  /**
   * Halo de la maquette (`blur-2xl` en haut à droite). Le `overflow: hidden`
   * du parent le maintient dans le panneau.
   */
  panelGlow: {
    position: 'absolute',
    top: -48,
    right: -48,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(81, 95, 116, 0.30)',
  },
  panelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  /**
   * La maquette fait pulser ce point (`animate-ping`). Il est statique ici, pour
   * la même raison que la pastille de `Puce` : une boucle permanente sur 6 px
   * coûte une animation native pour un effet que l'utilisateur ne voit pas.
   */
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryLight,
  },
  panelLock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  panelLockText: {
    fontSize: FONT_SIZES.xs,
  },

  /* --- Radar --- */
  radar: {
    width: 112,
    height: 112,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
  },
  radarRing: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  radarRingOuter: {
    width: 112,
    height: 112,
    borderColor: 'rgba(218, 226, 253, 0.20)',
  },
  radarRingMiddle: {
    width: 88,
    height: 88,
    borderColor: 'rgba(218, 226, 253, 0.15)',
  },
  radarRingInner: {
    width: 64,
    height: 64,
    borderColor: 'rgba(218, 226, 253, 0.10)',
  },
  /**
   * Faisceau en rotation de la maquette (`animate-spin`, 8 s).
   *
   * Le dégradé conique n'existe pas en React Native : c'est un demi-disque
   * translucide qui tourne. La durée de 8 s est reprise à l'identique, et
   * `useNativeDriver` évite de repasser par le thread JavaScript à chaque frame.
   */
  radarBeam: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
    backgroundColor: 'rgba(218, 226, 253, 0.10)',
  },
  emblem: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(218, 226, 253, 0.20)',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  blipTop: {
    top: 8,
    right: 16,
  },
  blipBottom: {
    bottom: 12,
    left: 8,
  },
  blipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryLight,
  },
  blipText: {
    // La maquette descend à 8px pour faire tenir « Rondier #41 » dans la pastille.
    fontSize: 8,
    lineHeight: 12,
  },

  /* --- Bande d'indicateurs --- */
  metrics: {
    flexDirection: 'row',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  metricValue: {
    // `headline-sm` en gras : la maquette souligne les valeurs, pas les libellés.
    fontSize: FONT_SIZES.xl,
    lineHeight: 20,
  },

  /* --- Carrousel --- */
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: SPACING.md,
  },
  dot: {
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  description: {
    lineHeight: 22,
  },
  error: {
    marginTop: SPACING.sm,
  },

  /* --- Promesses --- */
  badges: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: 10,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    // `minWidth: 0` autorise `numberOfLines` à tronquer, comme dans `CatalogueRow`.
    flex: 1,
    minWidth: 0,
  },

  /* --- Actions --- */
  cta: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  legal: {
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
});

