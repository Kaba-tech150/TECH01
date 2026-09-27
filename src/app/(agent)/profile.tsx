import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { Champ } from '@/components/forms';
import { Button, Card, Typography } from '@/components/ui';
import { COLORS, SPACING } from '@/constants';
import { useAuthContext } from '@/context/AuthContext';
import {
  AGENT_PROFILE_DEFAULTS,
  agentProfileSchema,
  useEnregistrerFicheAgent,
  useMaFicheAgent,
  versChargeAgent,
  type AgentProfileValues,
} from '@/features/prestataires';
import { logTechnicalError, toUserFacingError } from '@/lib/supabase/errors';

/**
 * Fiche professionnelle de l'agent.
 *
 * C'est la PREMIÈRE ÉCRITURE de l'agent de tout le projet. Elle est possible
 * parce que la base l'autorise déjà : la politique « Agents can create own
 * pending profile » existe, et le `grant insert` de 00300 couvre
 * `profile_id`, `certification_number`, `hourly_rate`, `zone` et `bio`.
 *
 * CE QUE LE SCHÉMA NE PERMET PAS, ET QUE L'ÉCRAN NE PROPOSE DONC PAS
 *
 *   - `status` : hors du `grant`, et fixé à 'registered' par défaut. Un agent
 *     ne s'auto-accepte pas ; seul un administrateur passe une fiche à
 *     `validated`.
 *   - `company_id` : la politique exige `company_id is null`. Un agent lié à
 *     une société est un autre cas d'usage, sans écran.
 *   - `is_available` : modifiable, mais c'est la DISPONIBILITÉ, autre écran.
 *
 * Les trois états sont affichés séparément : chargement, absence de fiche
 * (création), fiche existante (modification). Les confondre donnerait un
 * écran vide au premier lancement, ou un formulaire de création alors qu'une
 * fiche existe déjà.
 */
export default function AgentProfileScreen() {
  const { user, profile, signOut } = useAuthContext();

  const { data: fiche, isPending, error: erreurLecture } = useMaFicheAgent(
    user?.id,
  );
  const enregistrer = useEnregistrerFicheAgent();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AgentProfileValues>({
    resolver: zodResolver(agentProfileSchema),
    defaultValues: AGENT_PROFILE_DEFAULTS,
  });

  /*
   * `reset` et non `defaultValues` seule : la fiche arrive APRÈS le premier
   * rendu, et `defaultValues` n'est lu qu'au montage. Sans ce `reset`, le
   * formulaire d'un agent qui a déjà une fiche resterait vide — et l'écran
   * proposerait de tout ressaisir.
   */
  useEffect(() => {
    if (!fiche) return;
    reset({
      zone: fiche.zone,
      bio: fiche.bio,
      hourlyRate: fiche.hourlyRate,
      certificationNumber: fiche.certificationNumber,
    });
  }, [fiche, reset]);

  const soumettre = async (valeurs: AgentProfileValues) => {
    if (!user) return;

    try {
      await enregistrer.mutateAsync({
        userId: user.id,
        // `fiche ?? null` : `useQuery` distingue trois états — `undefined`
        // pendant le chargement, `null` quand le compte n'a pas de fiche. La
        // mutation n'a besoin que du second : elle veut savoir s'il y a une
        // ligne à modifier, et « pas encore chargée » ne veut pas dire « absent ».
        fiche: fiche ?? null,
        charge: versChargeAgent(valeurs, user.id),
      });
    } catch (e) {
      // L'erreur est rattachée au premier champ : un bandeau global en haut
      // d'un formulaire passe souvent inaperçu.
      setError('zone', {
        message: toUserFacingError(
          e,
          'Impossible d’enregistrer votre fiche.',
        ).message,
      });
      logTechnicalError('fiche agent', e);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Typography variant="h2" style={styles.titre}>
        Ma fiche professionnelle
      </Typography>
      <Typography
        variant="caption"
        color={COLORS.textSecondary}
        style={styles.sousTitre}
      >
        C’est cette fiche que les clients voient lorsqu’ils cherchent un agent.
      </Typography>

      {isPending && (
        <View style={styles.etat}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {Boolean(erreurLecture) && (
        <Card style={styles.carte}>
          <Typography variant="h3">Fiche indisponible</Typography>
          <Typography
            variant="caption"
            color={COLORS.textSecondary}
            style={styles.texte}
          >
            Impossible de charger votre fiche. Réessayez dans un instant.
          </Typography>
        </Card>
      )}

      {!isPending && !erreurLecture && (
        <>
          <View style={styles.bandeau}>
            <Typography variant="label" color={COLORS.text}>
              {fiche ? 'Fiche enregistrée' : 'Fiche à compléter'}
            </Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>
              {fiche
                ? `Statut : ${fiche.status} · ${fiche.isAvailable ? 'disponible' : 'indisponible'}`
                : 'Enregistrez votre fiche pour apparaître dans les recherches clients.'}
            </Typography>
          </View>

          <Card style={styles.carte}>
            <Typography variant="h3">Informations du compte</Typography>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.texte}
            >
              Email : {user?.email}
            </Typography>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.texte}
            >
              Nom : {profile?.full_name || 'Non renseigné'}
            </Typography>
          </Card>

          <View style={styles.formulaire}>
            <Champ
              control={control}
              name="zone"
              label="Zone d’intervention"
              placeholder="Ex. Bordeaux et Gironde"
              error={errors.zone?.message}
            />
            <Champ
              control={control}
              name="hourlyRate"
              label="Tarif horaire (€)"
              placeholder="Ex. 35"
              keyboardType="decimal-pad"
              error={errors.hourlyRate?.message}
            />
            <Champ
              control={control}
              name="bio"
              label="Présentation"
              placeholder="Votre expérience, vos spécialités…"
              multiline
              error={errors.bio?.message}
            />
            <Champ
              control={control}
              name="certificationNumber"
              label="Numéro de certification"
              placeholder="Facultatif"
              error={errors.certificationNumber?.message}
            />
          </View>

          <Button
            title={fiche ? 'Enregistrer les modifications' : 'Créer ma fiche'}
            onPress={handleSubmit(soumettre)}
            disabled={enregistrer.isPending}
          />
        </>
      )}

      <Button
        title="Se déconnecter"
        onPress={signOut}
        variant="secondary"
        style={styles.deconnexion}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  titre: {
    marginBottom: SPACING.sm,
  },
  sousTitre: {
    marginBottom: SPACING.lg,
  },
  etat: {
    paddingVertical: SPACING.xl,
  },
  bandeau: {
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    marginBottom: SPACING.lg,
    gap: 2,
  },
  carte: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  texte: {
    marginTop: SPACING.xs,
  },
  formulaire: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  deconnexion: {
    marginTop: SPACING.lg,
  },
});
