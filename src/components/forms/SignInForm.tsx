import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui';
import { BORDER_RADIUS, COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';
import { signIn } from '@/lib/supabase/auth';
import { logTechnicalError, toUserFacingError } from '@/lib/supabase/errors';
import { type PublicProfile } from '@/lib/storage';

/**
 * Écran de connexion, d'après `design/secuguard_connexion.html`.
 *
 * LA MAQUETTE ANNONCE TROIS CHOSES QUE LE PROJET NE FAIT PAS. ELLES SONT
 * TRAITÉES ICI EXPLICITEMENT, ET NON SUPPRIMÉES EN SILENCE.
 *
 *   - « Identifiant professionnel ou matricule AG-XXXX » → LE CHAMP EST UN
 *     EMAIL, ET C'EST `signInWithPassword` QUI LE DÉCIDE. `agent_profiles` n'a
 *     aucune colonne de matricule : la seule référence réglementaire du modèle
 *     est `certification_number`, qui est un agrément et pas un identifiant de
 *     connexion. Accepter un matricule afficherait un écran qui promet une
 *     connexion par matricule et la refuse toujours.
 *
 *   - « Connexion rapide biométrique / Certifié FIDO2 » → `expo-local-
 *     authentication` N'EST PAS INSTALLÉ, et aucune clé FIDO2 n'existe. Un
 *     badge « certifié » sur un bouton qui n'authentifie rien serait la pire
 *     des fausses promesses : il vendrait une garantie de sécurité inexistante,
 *     sur l'écran même qui doit mériter la confiance. Le bloc est remplacé par
 *     l'annonce exacte de ce qui manque.
 *
 *   - « Agréé CNAPS », « Hébergement France (SecNumCloud) », « TLS 1.3 ·
 *     Chiffrement 256-bit » → CE SONT DES ALLÉGATIONS, PAS DES DONNÉES. Rien
 *     dans le dépôt ne les établit, et l'application ne peut ni les mesurer ni
 *     les garantir. Le pied de page ne les reprendra donc pas.
 *
 * EN REVANCHE, L'ŒIL SUR LE MOT DE PASSE EST CONSERVÉ : c'est un contrôle
 * natif utile, sans promesse à tenir.
 *
 * LE SÉLECTEUR DE RÔLE DE LA MAQUETTE A ÉTÉ RETIRÉ.
 *
 * Il affichait « Client / Ordre », « Agent terrain », « Société agréée » au-dessus
 * du formulaire, et ne changeait que le texte indicatif du champ. C'était un
 * sélecteur qui n'ouvrait aucun accès et ne décidait de rien : choisir
 * « Agent terrain » ne faisait pas davantage de l'utilisateur un agent. Les
 * rôles réels sont lus dans `profile_roles` par `role-selection`, et le profil
 * d'inscription est déjà choisi à l'onboarding. Le laisser ici aurait suggère
 * un contrôle d'accès là où il n'y en a aucun.
 */

const signInSchema = z.object({
  email: z.string().email('Saisissez une adresse email valide.'),
  password: z.string().min(6, 'Le mot de passe contient au moins 6 caractères.'),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSuccess?: () => void;
  onSignUpPress?: (profile: PublicProfile) => void;
  /**
   * Profil connu de l'onboarding, transmis à l'inscription.
   *
   * Il ne sert plus à afficher un sélecteur : il est seulement repassé au
   * formulaire d'inscription, pour que l'utilisateur ne choisisse pas deux fois
   * le même profil.
   */
  initialProfile?: PublicProfile | null;
}

export function SignInForm({ onSuccess, onSignUpPress, initialProfile }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: authError } = await signIn(data.email, data.password);
      if (authError) throw authError;

      onSuccess?.();
    } catch (err) {
      /*
       * LE DÉTAIL TECHNIQUE RESTE AU JOURNAL.
       *
       * `AuthError` peut contenir le nom d'une table, d'une politique ou d'un
       * rôle. L'utilisateur reçoit un message en français ; la cause reste dans
       * la console, avec le contexte de l'action.
       */
      logTechnicalError('connexion', err);
      setError(toUserFacingError(err, 'Connexion impossible.').message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.bandeauErreur} accessibilityRole="alert">
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={COLORS.error} />
          <Text style={styles.texteErreur}>{error}</Text>
        </View>
      ) : null}

      {/* =========================================================
          IDENTIFIANT

          La maquette propose « Identifiant professionnel ou matricule
          AG-XXXX ». Le modèle n'a pas de matricule : le champ est un
          email, et l'indique plutôt que de laisser croire à un
          identifiant que la base ne connaît pas.
          ========================================================= */}

      <View style={styles.groupe}>
        <Text style={styles.label}>Adresse email</Text>
        <View style={styles.champEnveloppe}>
          <MaterialCommunityIcons
            name="at"
            size={20}
            color={COLORS.textSecondary}
            style={styles.iconeChamp}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.champ, errors.email && styles.champErreur]}
                placeholder="vous@exemple.fr"
                placeholderTextColor={COLORS.textLight}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                accessibilityLabel="Adresse email"
              />
            )}
          />
        </View>
        {errors.email ? <Text style={styles.erreur}>{errors.email.message}</Text> : null}
      </View>

      {/* =========================================================
          MOT DE PASSE

          Aucun lien « Mot de passe oublié ? » : il n'existe aucune
          route de réinitialisation dans l'application, et un lien
          vers l'inexistant est le pire genre de lien.
          ========================================================= */}

      <View style={styles.groupe}>
        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.champEnveloppe}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={20}
            color={COLORS.textSecondary}
            style={styles.iconeChamp}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.champ, styles.champAvecBouton, errors.password && styles.champErreur]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textLight}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!motDePasseVisible}
                autoComplete="current-password"
                textContentType="password"
                accessibilityLabel="Mot de passe"
              />
            )}
          />
          <Pressable
            onPress={() => setMotDePasseVisible((visible) => !visible)}
            style={styles.boutonOeil}
            accessibilityRole="button"
            accessibilityLabel={
              motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
            }
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name={motDePasseVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </Pressable>
        </View>
        {errors.password ? <Text style={styles.erreur}>{errors.password.message}</Text> : null}
      </View>

      <Button
        title={isLoading ? 'Connexion…' : "Se connecter à l'espace sécurisé"}
        icon="lock-open-outline"
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        style={styles.boutonSoumission}
      />

      {/* =========================================================
          LA SESSION EST DÉJÀ PERSISTÉE

          La maquette propose un interrupteur « Mémoriser cet appareil
          sécurisé ». `expo-secure-store` enregistre la session sur
          native et `localStorage` sur le web : la persistance est
          DÉJÀ ACTIVE et n'a pas à être activée. Un interrupteur qui
          ne commande rien serait un mensonge, et le débrancher
          laisserait l'utilisateur croire qu'il protège quelque chose.
          L'état réel est donc annoncé, pas proposé.
          ========================================================= */}

      <View style={styles.ligneSession}>
        <View style={styles.pipSession} />
        <Text style={styles.texteSession}>
          Votre session reste active sur cet appareil
        </Text>
      </View>

      {/* =========================================================
          AUTHENTIFICATION À DEUX FACTEURS

          La maquette place ici « Connexion rapide biométrique » avec
          un badge « Certifié FIDO2 ». `expo-local-authentication`
          n'est pas installé et aucune clé FIDO2 n'existe : ce badge
          certifierait un mécanisme absent. L'encart annonce à la
          place ce qui est réellement en place — un mot de passe, et
          une validation par le serveur — plutôt qu'une garantie.
          ========================================================= */}

      <View style={styles.encart2fa}>
        <View style={styles.encartIcone}>
          <MaterialCommunityIcons name="shield-key-outline" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.encartTexte}>
          <Text style={styles.encartTitre}>Authentification à deux facteurs</Text>
          <Text style={styles.encartDescription}>
            La validation par code ou clé physique n’est pas encore activée sur
            votre compte.
          </Text>
        </View>
      </View>

      <View style={styles.pied}>
        <Text style={styles.piedTexte}>Pas encore de compte SecuGuard ? </Text>
        <Pressable
          onPress={() => onSignUpPress?.(initialProfile ?? 'client')}
          accessibilityRole="link"
          accessibilityLabel="Créer un compte"
          hitSlop={8}
        >
          <Text style={styles.piedLien}>Créer un compte</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },

  /* --- Erreur --- */

  bandeauErreur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.errorSurface,
  },
  texteErreur: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.error,
  },

  /* --- Champs --- */

  groupe: {
    gap: SPACING.xs,
  },
  label: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  champEnveloppe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 50,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconeChamp: {
    marginRight: 2,
  },
  champ: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  champAvecBouton: {
    paddingRight: 0,
  },
  champErreur: {
    borderColor: COLORS.error,
  },
  boutonOeil: {
    padding: SPACING.xs,
  },
  erreur: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },

  /* --- Bouton --- */

  boutonSoumission: {
    marginTop: SPACING.xs,
  },

  /* --- Session --- */

  ligneSession: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pipSession: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  texteSession: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  /* --- Encart deux facteurs --- */

  encart2fa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundSecondary,
  },
  encartIcone: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  encartTexte: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  encartTitre: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  encartDescription: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  /* --- Pied --- */

  pied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  piedTexte: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  piedLien: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
});

