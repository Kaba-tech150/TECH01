import { type PublicProfile } from '@/lib/storage';
import { Button, Typography } from '@/components/ui';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';
import { signUp } from '@/lib/supabase/auth';
import { toUserFacingError, logTechnicalError } from '@/lib/supabase/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  role: z.enum(['client', 'agent', 'company']),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  initialProfile?: PublicProfile | null;
  onSuccess?: () => void;
  onSignInPress?: () => void;
}

export function SignUpForm({ initialProfile, onSuccess, onSignInPress }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<PublicProfile>(initialProfile ?? 'client');

  const { control, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: initialProfile ?? 'client',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setPendingEmail(null);

      // `signUpData` est nommé ainsi pour ne pas entrer en collision avec le
      // `data` du formulaire, qui contient l'email et le mot de passe.
      const { data: signUpData, error: authError } = await signUp(data.email, data.password, {
        full_name: data.fullName,
        role: selectedRole,
      });
      if (authError) throw authError;

      // Tant que l'adresse email n'est pas confirmée, Supabase ne renvoie
      // AUCUNE session. Rediriger vers la sélection d'espace dans ce cas
      // ramenait immédiatement l'utilisateur vers la connexion, avec une
      // erreur trompeuse. On affiche donc l'attente de confirmation.
      if (!signUpData.session) {
        setPendingEmail(data.email);
        return;
      }

      onSuccess?.();
    } catch (err) {
      logTechnicalError('inscription', err);
      setError(toUserFacingError(err, 'Erreur d’inscription').message);
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { key: PublicProfile; label: string; description: string }[] = [
    { key: 'client', label: 'Client', description: 'Je cherche un service de sécurité' },
    { key: 'agent', label: 'Agent indépendant', description: 'Je propose mes services' },
    { key: 'company', label: 'Société', description: 'Je gère une équipe' },
  ];

  // Écran d'attente de confirmation d'email. Il remplace le formulaire le temps
  // que l'utilisateur valide son adresse : le compte existe déjà côté serveur,
  // mais aucune session n'est ouverte tant que la confirmation n'a pas eu lieu.
  if (pendingEmail) {
    return (
      <View style={styles.container}>
        <Typography variant="h2" style={styles.title}>Vérifiez votre messagerie</Typography>
        <Typography variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
          Un message de confirmation a été envoyé à {pendingEmail}. Ouvrez le lien qu’il
          contient pour activer votre compte, puis revenez vous connecter.
        </Typography>

        <View style={styles.form}>
          <Button
            title="J’ai déjà confirmé mon adresse"
            onPress={() => onSignInPress?.()}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Adresse erronée ?</Text>
          <TouchableOpacity onPress={() => setPendingEmail(null)}>
            <Text style={styles.footerLink}>Modifier l’inscription</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Typography variant="h2" style={styles.title}>Inscription</Typography>
      <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
        Créez votre compte SecuGuard
      </Typography>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom complet</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Nom complet"
                placeholderTextColor={COLORS.textLight}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                placeholderTextColor={COLORS.textLight}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mot de passe</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Mot de passe"
                placeholderTextColor={COLORS.textLight}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Je suis :</Text>
          <View style={styles.rolesContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.key}
                style={[
                  styles.roleButton,
                  selectedRole === role.key && styles.roleButtonSelected,
                ]}
                onPress={() => setSelectedRole(role.key)}
              >
                <Text style={[
                  styles.roleTitle,
                  selectedRole === role.key && styles.roleTitleSelected,
                ]}>
                  {role.label}
                </Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title={isLoading ? 'Inscription...' : 'S\'inscrire'}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          style={styles.submitButton}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Déjà un compte ?</Text>
        <TouchableOpacity onPress={onSignInPress}>
          <Text style={styles.footerLink}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  subtitle: {
    marginBottom: SPACING.xl,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
  },
  form: {
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.semibold,
    color: COLORS.text,
    marginBottom: 4,
  },
  input: {
    height: 50,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  rolesContainer: {
    gap: SPACING.sm,
  },
  roleButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  roleButtonSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  roleTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILIES.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  roleTitleSelected: {
    color: COLORS.primary,
  },
  roleDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  footerLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontFamily: FONT_FAMILIES.bold,
  },
});
