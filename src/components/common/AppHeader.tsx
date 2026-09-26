import { useAuthContext } from '@/context/AuthContext';
import { Image } from 'expo-image';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* =========================================================
   COULEURS
   ========================================================= */

const COLORS = {
  background: '#eff0f5',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0066FF',
  cyan: '#00D2FF',
  error: '#BA1A1A',
  onWhite: '#FFFFFF',
  surfaceContainerHigh: '#E8F0FF',
};

/* =========================================================
   TYPOGRAPHIE
   ========================================================= */

const FONT_FAMILIES = {
  displayBold: 'System',
  bold: 'System',
  medium: 'System',
};

/* =========================================================
   TAILLES
   ========================================================= */

const FONT_SIZES = {
  xs: 11,
  md: 16,
  xl: 20,
};

/* =========================================================
   ESPACEMENTS
   ========================================================= */

const SPACING = {
  sm: 8,
  lg: 16,
};

/* =========================================================
   BORDER RADIUS
   ========================================================= */

const BORDER_RADIUS = {
  sm: 6,
  full: 999,
};

/* =========================================================
   DESCENTE DE L'EN-TÊTE
   ========================================================= */

/**
 * Espace ajouté après la barre d'état.
 *
 * 0  = colle à l'inset
 * 4  = léger espace
 * 8  = espace normal
 * 16 = espace plus important
 */
const DESCENTE_ENTETE = 20;

/* =========================================================
   PROPS
   ========================================================= */

interface AppHeaderProps {
  onPressProfile?: () => void;
  onPressSos?: () => void;
}

/* =========================================================
   COMPOSANT APP HEADER
   ========================================================= */

export function AppHeader({
  onPressProfile,
  onPressSos,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthContext();

  /**
   * Première lettre du nom de l'utilisateur.
   * Si aucun nom n'est disponible, on affiche "C".
   */
  const initial = (
    profile?.full_name?.trim()?.[0] ?? 'C'
  ).toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + DESCENTE_ENTETE,
        },
      ]}
    >
      <View style={styles.inner}>

        {/* =================================================
            LOGO + NOM DE LA PLATEFORME
            ================================================= */}

        <View style={styles.brand}>

          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <View style={styles.brandText}>

            {/* NOM + BADGE PRO */}
            <View style={styles.titleRow}>

              <Text style={styles.title}>
                Secu
              </Text>

             

            </View>

            {/* STATUT */}
            <View style={styles.subtitleRow}>

              <View style={styles.pulse} />

              <Text style={styles.subtitle}>
                Réseau certifié 24/7
              </Text>

            </View>

          </View>
        </View>

        {/* =================================================
            ACTIONS : SOS + PROFIL
            ================================================= */}

        <View style={styles.actions}>

          {/* BOUTON SOS */}
          

          {/* AVATAR / PROFIL */}
          <Pressable
            onPress={onPressProfile}
            style={styles.avatar}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir mon profil"
          >

            {profile?.avatar_url ? (

              <Image
                source={{
                  uri: profile.avatar_url,
                }}
                style={styles.avatarImage}
                contentFit="cover"
              />

            ) : (

              <Text style={styles.avatarInitial}>
                {initial}
              </Text>

            )}

          </Pressable>

        </View>

      </View>
    </View>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({

  /* -------------------------------------------------------
     CONTENEUR PRINCIPAL
     ------------------------------------------------------- */

  container: {
    backgroundColor: COLORS.background,

    borderBottomWidth: 1,

    borderBottomColor:
      'rgba(0, 210, 255, 0.12)',

    elevation: 4,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  /* -------------------------------------------------------
     CONTENU DE L'EN-TÊTE
     ------------------------------------------------------- */

  inner: {
    height: 64,

    paddingHorizontal: SPACING.lg,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  /* -------------------------------------------------------
     MARQUE
     ------------------------------------------------------- */

  brand: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: SPACING.sm,

    flexShrink: 1,
  },

  logo: {
    width: 32,
    height: 32,

    borderRadius: BORDER_RADIUS.sm,
  },

  brandText: {
    flexShrink: 1,
  },

  /* -------------------------------------------------------
     TITRE + BADGE PRO
     ------------------------------------------------------- */

  titleRow: {
    flexDirection: 'row',

    alignItems: 'center',

    /*
     * IMPORTANT :
     * Votre ancien code avait :
     *
     * gap: 1222
     *
     * ce qui créait un espace gigantesque.
     *
     * On utilise ici un espace normal.
     */
    gap: 6,
  },

  title: {
    fontFamily: FONT_FAMILIES.displayBold,

    fontSize: FONT_SIZES.xl,

    color: COLORS.text,

    letterSpacing: 1,

    textTransform: 'uppercase',
  },

  proBadge: {
    backgroundColor:
      COLORS.surfaceContainerHigh,

    paddingHorizontal: 5,

    paddingVertical: 1,

    borderRadius: BORDER_RADIUS.sm,
  },

  proText: {
    fontFamily: FONT_FAMILIES.bold,

    fontSize: FONT_SIZES.xs,

    color: COLORS.primary,

    letterSpacing: 0.8,

    textTransform: 'uppercase',
  },

  /* -------------------------------------------------------
     SOUS-TITRE
     ------------------------------------------------------- */

  subtitleRow: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    marginTop: 2,
  },

  pulse: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: COLORS.cyan,
  },

  subtitle: {
    fontFamily: FONT_FAMILIES.medium,

    fontSize: FONT_SIZES.xs,

    color: COLORS.textSecondary,
  },

  /* -------------------------------------------------------
     ACTIONS
     ------------------------------------------------------- */

  actions: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: SPACING.sm,
  },

  /* -------------------------------------------------------
     SOS
     ------------------------------------------------------- */

  sos: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    paddingHorizontal: 10,

    paddingVertical: 8,

    borderRadius: BORDER_RADIUS.sm,

    backgroundColor:
      'rgba(186, 26, 26, 0.08)',
  },

  sosText: {
    fontFamily: FONT_FAMILIES.bold,

    fontSize: FONT_SIZES.xs,

    color: COLORS.error,

    letterSpacing: 0.8,
  },

  /* -------------------------------------------------------
     AVATAR
     ------------------------------------------------------- */

  avatar: {
    width: 32,
    height: 32,

    borderRadius: BORDER_RADIUS.full,

    backgroundColor: COLORS.primary,

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarInitial: {
    fontFamily: FONT_FAMILIES.bold,

    fontSize: FONT_SIZES.md,

    color: COLORS.onWhite,
  },

});
