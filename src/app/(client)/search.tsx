import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Typography } from '@/components/ui';
import { COLORS, FONT_FAMILIES, FONT_SIZES, SPACING } from '@/constants';
import { CartePrestataire, trierPrestataires, usePrestataires } from '@/features/prestataires';
import { logTechnicalError, toUserFacingError } from '@/lib/supabase/errors';

/**
 * Recherche de prestataires.
 *
 * PREMIER ÉCRAN RÉELLEMENT FONCTIONNEL DU PARCOURS CLIENT, et il est
 * volontairement en LECTURE SEULE.
 *
 * Aucune réservation n'est proposée ici. Une réservation est une écriture, et le
 * projet n'a jamais validé une seule écriture de bout en bout : la création de
 * mission a été bloquée jusqu'au 2026-09-27 par un défaut de session — pas par
 * la base, qui était saine. On ne déclenche pas une écriture avant que
 * l'écriture soit prouvée.
 *
 * Les états pending / error / vide sont DISTINCTS. Sans cela, l'écran affiche
 * « Aucun prestataire » pendant le chargement, et l'utilisateur conclut que la
 * recherche est vide alors qu'elle n'a pas encore eu lieu.
 */
export default function ClientSearch() {
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [ville, setVille] = useState('');

  const criteres = useMemo(
    () => ({
      recherche: recherche.trim() || undefined,
      city: ville.trim() || undefined,
    }),
    [recherche, ville],
  );

  const { data, isPending, error, refetch, isFetching } = usePrestataires(criteres);

  // Le détail technique est journalisé DÈS l'erreur, et pas seulement au clic
  // sur « Réessayer ».
  //
  // Le 2026-09-27, l'écran affichait « Recherche impossible » sans qu'aucune
  // ligne du journal n'explique pourquoi : la cause n'a été trouvée qu'en
  // comparant la requête au schéma, à la main. Masquer une erreur sans écrire
  // sa source rend le diagnostic IMPOSSIBLE — c'est exactement ce qui avait été
  // reproché à `AuthContext.toError` deux jours plus tôt, et le défaut revenait
  // ailleurs.
  useEffect(() => {
    if (error) {
      logTechnicalError('recherche prestataires', error);
    }
  }, [error]);

  const resultats = useMemo(() => trierPrestataires(data ?? []), [data]);

  /*
   * « Des filtres sont-ils appliqués ? » — un BOULÉEN, jamais une chaîne.
   *
   * BUG CORRIGÉ LE 2026-09-27. L'écriture d'origine était :
   *
   *     {(recherche || ville) && ( <Button … /> )}
   *
   * Au démarrage, `recherche` et `ville` valent tous deux `''`. L'expression
   * `recherche || ville` vaut donc `''`, et `'' && <Button/>` vaut `''` — que
   * React rend comme un NŒUD TEXTE vide, enfant direct du `<View>`. D'où :
   *
   *     Unexpected text node: . A text node cannot be a child of a <View>.
   *
   * Le point du message est la ponctuation du libellé de react-native-web, pas
   * le contenu du nœud.
   *
   * React ne rend rien pour `null`, `undefined`, `true` et `false` — mais PAS
   * pour `''`. Une chaîne vide reste une chaîne, et devient un enfant.
   *
   * `Boolean()` rend la question explicite, et rend l'erreur impossible à
   * commettre de nouveau par inadvertance.
   */
  const aDesFiltres = Boolean(recherche.trim() || ville.trim());

  const lancer = () => {
    // La saisie n'est appliquée qu'au bouton : chercher à chaque frappe
    // enverrait une requête par caractère, sur un réseau mobile.
    setRecherche(saisie);
  };

  const reinitialiser = () => {
    setSaisie('');
    setRecherche('');
    setVille('');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Typography variant="h2" style={styles.titre}>
        Trouver un prestataire
      </Typography>
      <Typography
        variant="caption"
        color={COLORS.textSecondary}
        style={styles.sousTitre}
      >
        Recherchez un agent ou une société de sécurité dans votre secteur.
      </Typography>

      <View style={styles.formulaire}>
        <TextInput
          value={saisie}
          onChangeText={setSaisie}
          placeholder="Nom, spécialité, ville…"
          placeholderTextColor={COLORS.textSecondary}
          style={styles.champ}
          returnKeyType="search"
          onSubmitEditing={lancer}
          accessibilityLabel="Rechercher un prestataire"
        />
        <TextInput
          value={ville}
          onChangeText={setVille}
          onSubmitEditing={lancer}
          placeholder="Ville (ex. Paris)"
          placeholderTextColor={COLORS.textSecondary}
          style={styles.champ}
          accessibilityLabel="Filtrer par ville"
        />
        {/* `disabled` et non un état de chargement : `Button` n'a pas de prop
            `loading`. Passer par un libellé différent ferait sauter la mise en
            page à chaque requête. `isFetching` reste lu pour griser le bouton. */}
        <Button title="Rechercher" onPress={lancer} disabled={isFetching} />
      </View>

      {isPending && (
        <View style={styles.etat}>
          <ActivityIndicator color={COLORS.primary} />
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.etatTexte}>
            Recherche en cours…
          </Typography>
        </View>
      )}

      {!isPending && error && (
        <View style={styles.etat}>
          <Typography variant="h3">Recherche impossible</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.etatTexte}>
            {toUserFacingError(error, 'Impossible de charger les prestataires.').message}
          </Typography>
          <Button
            title="Réessayer"
            onPress={() => {
              logTechnicalError('recherche prestataires', error);
              void refetch();
            }}
            variant="secondary"
            style={styles.action}
          />
        </View>
      )}

      {!isPending && !error && resultats.length === 0 && (
        <View style={styles.etat}>
          <Typography variant="h3">Aucun prestataire trouvé</Typography>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.etatTexte}>
            {recherche || ville
              ? 'Aucun résultat pour ces critères. Élargissez la recherche.'
              : 'Aucun prestataire inscrit pour le moment.'}
          </Typography>
          {aDesFiltres && (
            <Button
              title="Effacer les filtres"
              onPress={reinitialiser}
              variant="secondary"
              style={styles.action}
            />
          )}
        </View>
      )}

      {!isPending && !error && resultats.length > 0 && (
        <>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.compte}>
            {resultats.length} prestataire{resultats.length > 1 ? 's' : ''} trouvé
            {resultats.length > 1 ? 's' : ''}
          </Typography>
          {resultats.map((p) => (
            <CartePrestataire key={`${p.kind}-${p.id}`} prestataire={p} />
          ))}
        </>
      )}
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
  formulaire: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  champ: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.regular,
    color: COLORS.text,
    backgroundColor: COLORS.backgroundSecondary,
  },
  etat: {
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  etatTexte: {
    lineHeight: 20,
  },
  action: {
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
  },
  compte: {
    marginBottom: SPACING.sm,
  },
});
