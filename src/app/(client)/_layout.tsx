import { ProtectedRoute } from '@/components/auth';
import { TAB_BAR_SCREEN_OPTIONS, TAB_ICONS } from '@/components/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function ClientLayout() {
  return (
    <ProtectedRoute requireAuth requireRole="client">
      <Tabs screenOptions={TAB_BAR_SCREEN_OPTIONS}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={TAB_ICONS.accueil} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="missions"
          options={{
            title: 'Missions',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={TAB_ICONS.missions} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Rechercher',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={TAB_ICONS.recherche} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={TAB_ICONS.profil} color={color} size={size} />
            ),
          }}
        />
        {/*
         * `href: null` RETIRE LA ROUTE DE LA BARRE D'ONGLETS.
         *
         * Un fichier de cet espace apparaît dans la navigation par défaut, y
         * compris quand il s'agit d'un écran d'action. Sans cette ligne,
         * l'application afficherait un onglet « Réservation » qui vide l'écran,
         * alors qu'aucune réservation n'est possible sans passer par la
         * recherche. C'est un onglet qui ne mène nulle part.
         *
         * Les deux écrans d'action sont déclarés ici : `mission/new` était
         * absent de ce layout depuis l'origine — même cas, même conséquence,
         * et il n'avait été signalé que par un rapport.
         */}
        <Tabs.Screen name="prestation/[id]" options={{ href: null, title: 'Réservation' }} />
        <Tabs.Screen name="mission/[id]" options={{ href: null, title: 'Suivi' }} />
        <Tabs.Screen name="mission/new" options={{ href: null, title: 'Nouvelle mission' }} />
      </Tabs>
    </ProtectedRoute>
  );
}
