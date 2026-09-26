import { Header } from '@/components/common';
import { SignUpForm } from '@/components/forms';
import { COLORS, SPACING } from '@/constants';
import { isPublicProfile } from '@/lib/storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function SignUpScreen() {
  const router = useRouter();
  const { profile } = useLocalSearchParams<{ profile?: string }>();
  const initialProfile = isPublicProfile(profile) ? profile : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Header showLogin={false} />
        <View style={styles.formContainer}>
          <SignUpForm
            initialProfile={initialProfile}
            onSuccess={() => router.replace('/(auth)/role-selection')}
            onSignInPress={() => router.push(initialProfile ? { pathname: '/(auth)/sign-in', params: { profile: initialProfile } } : '/(auth)/sign-in')}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  formContainer: {
    marginTop: SPACING.xl,
  },
});
