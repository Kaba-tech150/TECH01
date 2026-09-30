import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Champ, ChampDateHeure } from '@/components/forms';
import { Button, Typography } from '@/components/ui';
import { COLORS, SPACING } from '@/constants';
import {
  MISSION_FORM_DEFAULTS,
  missionSchema,
  useCreateMission,
  useMissionErrorMessage,
  versChargeUtile,
  type MissionFormValues,
} from '@/features/missions';
import { SelectVille, useVilles } from '@/features/villes';

/**
 * Formulaire de création d'une mission de sécurité.
 *
 * La mission est créée au statut `draft` : l'utilisateur la vérifie, puis la
 * publiera dans un second temps via la fonction serveur `publish_mission`.
 * Publier dès la création exposerait à des prestataires une mission
 * éventuellement incomplète, sans aucun moyen de savoir qu'elle est en cours
 * de rédaction.
 */
export default function NewMissionScreen() {
  const router = useRouter();
  const createMission = useCreateMission();
  const messageErreur = useMissionErrorMessage();
  const { data: villes } = useVilles();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
  } = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: MISSION_FORM_DEFAULTS,
  });

  /*
   * Le calendrier de fin ne propose pas les dates antérieures au début : en
   * laisser choisir une date incohérente pour ne subir un message d'erreur
   * qu'à la validation serait une faute d'ergonomie. La contrainte
   * `missions_time_range_check` reste appliquée côté serveur.
   *
   * `watch` est volontairement évité ici : combiné au React Compiler
   * (activé dans app.json), il force le compilateur à désoptimiser tout le
   * composant. `useWatch` s'abonne au champ précis et préserve la
   * mémoïsation.
   */
  /*
   * `useWatch` est utilisé pour lire les champs dont la valeur pilote
   * l'affichage. `watch` est volontairement évité : combiné au React Compiler
   * (activé dans app.json), il force le compilateur à désoptimiser tout le
   * composant, et le signale comme bibliothèque incompatible.
   */
  const debutChoisi = useWatch({ control, name: 'startTime' });
  const villeChoisie = useWatch({ control, name: 'city' });

  /*
   * Choisir une ville dans le référentiel préremplit le code postal quand il
   * est connu. Ce n'est qu'un confort : le champ reste modifiable, certaines
   * villes ayant plusieurs codes postaux.
   */
  const selectionnerVille = (nom: string) => {
    setValue('city', nom, { shouldValidate: true, shouldDirty: true });

    const correspondance = villes?.find((ville) => ville.nom === nom);
    if (correspondance?.code_postal) {
      setValue('postalCode', correspondance.code_postal);
    }
  };

  const onSubmit = async (valeurs: MissionFormValues) => {
    try {
      await createMission.mutateAsync(versChargeUtile(valeurs));
      router.replace('/(client)/missions-client');
    } catch (error) {
      // L'erreur est rattachée au titre : un bandeau global placé en haut
      // d'un formulaire long est souvent hors champ, et le message passe
      // alors inaperçu. Ancrer l'erreur sur un champ la rend visible.
      setError('title', { message: messageErreur(error, 'créer') });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Typography variant="h2" style={styles.title}>
            Nouvelle mission
          </Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.subtitle}>
            Décrivez votre besoin. La mission reste en brouillon tant que vous ne l’avez pas publiée.
          </Typography>

          <View style={styles.form}>
            <Champ
              control={control}
              name="title"
              label="Titre"
              placeholder="Ex. : Gardiennage d’un événement"
              error={errors.title?.message}
            />
            <Champ
              control={control}
              name="description"
              label="Description"
              placeholder="Type de surveillance, horaires, niveau de risque…"
              error={errors.description?.message}
              multiline
            />
            <Champ
              control={control}
              name="address"
              label="Adresse"
              placeholder="12 rue de la Paix"
              error={errors.address?.message}
            />

            <View style={styles.row}>
              <View style={styles.rowItemLarge}>
                <SelectVille
                  label="Ville"
                  value={villeChoisie ?? ''}
                  onChange={selectionnerVille}
                  erreur={errors.city?.message}
                />
              </View>
              <View style={styles.rowItem}>
                <Champ
                  control={control}
                  name="postalCode"
                  label="Code postal"
                  placeholder="75002"
                  error={errors.postalCode?.message}
                />
              </View>
            </View>

            <ChampDateHeure
              control={control}
              name="startTime"
              label="Début"
              erreur={errors.startTime?.message}
            />
            <ChampDateHeure
              control={control}
              name="endTime"
              label="Fin"
              erreur={errors.endTime?.message}
              dateMinimale={debutChoisi ? new Date(debutChoisi.replace(' ', 'T')) : undefined}
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Champ
                  control={control}
                  name="agentCount"
                  label="Nombre d’agents"
                  placeholder="1"
                  error={errors.agentCount?.message}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.rowItem}>
                <Champ
                  control={control}
                  name="budget"
                  label="Budget (€)"
                  placeholder="Facultatif"
                  error={errors.budget?.message}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Champ
              control={control}
              name="specialRequirements"
              label="Exigences particulières"
              placeholder="Ex. : agent formé, véhicule, badge d’accès"
              error={errors.specialRequirements?.message}
              multiline
            />

            <Button
              title={createMission.isPending ? 'Création...' : 'Créer la mission'}
              onPress={handleSubmit(onSubmit)}
              disabled={createMission.isPending}
              style={styles.submit}
            />
            <Button
              title="Annuler"
              variant="outline"
              onPress={() => router.back()}
              disabled={createMission.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  title: { marginBottom: SPACING.sm },
  subtitle: { marginBottom: SPACING.xl },
  form: { gap: SPACING.lg },
  row: { flexDirection: 'row', gap: SPACING.md },
  rowItem: { flex: 1 },
  // La ville porte un nom long et un code postal court : elle prend plus de
  // place que le code postal, sinon le libellé serait tronqué.
  rowItemLarge: { flex: 2 },
  submit: { marginTop: SPACING.sm },
});
