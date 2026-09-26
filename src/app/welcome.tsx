import { ActionCard, Footer, Header, Hero, ServiceCard, StatCard, Step } from '@/components/common';
import { Typography } from '@/components/ui';
import { COLORS, SCREEN_PADDING, SPACING } from '@/constants';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const services = [
  {
    title: 'Gardiennage résidentiel',
    description: 'Protégez votre domicile et vos biens.',
    icon: '🏠',
  },
  {
    title: 'Gardiennage entreprise',
    description: 'Sécurisez vos locaux et vos activités.',
    icon: '🏢',
  },
  {
    title: 'Sécurité événementielle',
    description: 'Assurez la sécurité de vos événements.',
    icon: '🛡️',
  },
  {
    title: 'Surveillance',
    description: 'Une présence adaptée à vos besoins.',
    icon: '👮',
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Header 
            showLogin={true}
            onLoginPress={() => router.push('/(auth)/sign-in')}
          />

          <Hero />

          {/* STATISTIQUES */}
          <View style={styles.section}>
            <Typography variant="h2">Nos performances</Typography>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.sectionSubtitle}>
              Des résultats prouvés
            </Typography>

            <View style={styles.statsGrid}>
              <StatCard
                title="Missions réalisées"
                value="2,500+"
                subtitle="Depuis 2020"
                icon="✓"
                variant="success"
              />
              <StatCard
                title="Taux de satisfaction"
                value="98%"
                subtitle="Clients satisfaits"
                icon="⭐"
                variant="primary"
              />
              <StatCard
                title="Temps de réponse"
                value="< 15min"
                subtitle="Moyenne"
                icon="⚡"
                variant="info"
              />
            </View>
          </View>

          {/* SERVICES */}
          <View style={styles.section}>
            <Typography variant="h2">Nos services</Typography>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.sectionSubtitle}>
              Des solutions adaptées à vos besoins
            </Typography>

            <View style={styles.servicesGrid}>
              {services.map((service) => (
                <ServiceCard
                  key={service.title}
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                />
              ))}
            </View>
          </View>

          {/* ACTIONS RAPIDES */}
          <View style={styles.section}>
            <Typography variant="h2">Actions rapides</Typography>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.sectionSubtitle}>
              Accédez rapidement à nos services
            </Typography>

            <View style={styles.actionsGrid}>
              <ActionCard
                title="Demander un devis"
                description="Obtenez une estimation personnalisée"
                icon="📝"
                onPress={() => router.push('/(auth)/sign-up')}
                variant="primary"
              />
              <ActionCard
                title="Trouver un agent"
                description="Recherchez des agents disponibles"
                icon="🔍"
                onPress={() => router.push('/(auth)/sign-up')}
                variant="secondary"
              />
              <ActionCard
                title="Devenir partenaire"
                description="Rejoignez notre réseau de prestataires"
                icon="🤝"
                onPress={() => router.push('/(auth)/sign-up')}
                variant="primary"
              />
            </View>
          </View>

          {/* COMMENT ÇA MARCHE */}
          <View style={styles.section}>
            <Typography variant="h2">Comment ça marche ?</Typography>

            <Step
              number={1}
              title="Décrivez votre besoin"
              description="Indiquez le type de service, le lieu et la durée."
            />

            <Step
              number={2}
              title="Trouvez un prestataire"
              description="Comparez les prestataires disponibles selon vos critères."
            />

            <Step
              number={3}
              title="Réservez et suivez"
              description="Réservez votre service et suivez votre mission en temps réel."
            />
          </View>

          <Footer />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  safeArea: {
    flex: 1,
  },

  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 40,
  },

  section: {
    marginBottom: SPACING.xxxl,
  },

  sectionSubtitle: {
    marginBottom: SPACING.lg,
  },

  statsGrid: {
    gap: SPACING.md,
  },

  servicesGrid: {
    gap: SPACING.md,
  },

  actionsGrid: {
    gap: SPACING.md,
  },
});
