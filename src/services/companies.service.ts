/**
 * Fiche société et équipe d'une société de sécurité.
 *
 * DEUX LECTURES, UNE SEULE SOCIÉTÉ.
 *
 * `company_profiles` porte la société, `agent_profiles` porte ses agents, et le
 * lien est `agent_profiles.company_id`. Ces trois tables sont donc lues dans cet
 * ordre : la société d'abord, puis son équipe. L'inverse demanderait l'identifiant
 * de la société avant de l'avoir.
 *
 * AUCUNE ÉCRITURE ICI.
 *
 * Comme pour l'agent, l'écriture de `company_profiles` n'a jamais été validée
 * de bout en bout : la lecture reste le seul chemin prouvé. Aucune fonction
 * serveur ne permet de rattacher un agent à une société, donc l'invitation
 * d'agent — que la maquette dessine — n'a rien sur quoi s'appuyer.
 */
import { supabase } from '@/lib/supabase';
import type { ProviderStatus } from '@/types';

/** Fiche société, telle que son gérant peut la lire. */
export type FicheSociete = {
  id: string;
  companyName: string;
  siret: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  description: string | null;
  website: string | null;
  status: ProviderStatus;
};

/** Un agent de l'équipe, tel que la société le voit. */
export type MembreEquipe = {
  id: string;
  /** Identifiant de la fiche `agent_profiles`, pas du compte : c'est elle que l'écran affiche. */
  profileId: string;
  /** `null` si la RLS masque la jointure : l'agent existe, son nom n'est pas lisible. */
  nom: string | null;
  zone: string | null;
  certificationNumber: string | null;
  isAvailable: boolean;
  status: ProviderStatus;
};

const PROVIDER_STATUSES: readonly ProviderStatus[] = [
  'registered',
  'documents_submitted',
  'in_validation',
  'validated',
  'rejected',
  'active',
  'suspended',
];

/**
 * Valide un statut venu du serveur, ou renvoie `null`.
 *
 * `null` signifie « la base a renvoyé une valeur hors énumération ». L'écran
 * omet alors le statut au lieu d'afficher un mot inconnu : `provider_status`
 * est un `TEXT` avec contrainte `CHECK`, donc PostgREST le rend en `string`.
 */
function versStatut(valeur: string): ProviderStatus | null {
  return PROVIDER_STATUSES.find((statut) => statut === valeur) ?? null;
}

export const companiesService = {
  /**
   * Fiche de la société du compte connecté, ou `null` si elle n'existe pas encore.
   *
   * `maybeSingle()` et non `single()` : un compte peut être créé avant que sa
   * société ne soit renseignée. `single()` renverrait une erreur, et l'écran
   * afficherait un échec là où il y a un simple champ à remplir.
   */
  async getMyCompanyProfile(profileId: string): Promise<FicheSociete | null> {
    const { data, error } = await supabase
      .from('company_profiles')
      .select(
        'id, company_name, siret, address, city, postal_code, description, website, status',
      )
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const statut = versStatut(data.status as string);

    return {
      id: data.id,
      companyName: data.company_name,
      siret: data.siret,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      description: data.description,
      website: data.website,
      /*
       * UNE FICHE SANS STATUT RECONNU EST RENVOYÉE SANS STATUT, PAS REJETÉE.
       *
       * `status` est `not null` en base, mais la valeur peut être hors
       * énumération si la contrainte a été retirée. Rejeter la fiche entière
       * ferait disparaître le nom de la société de l'écran pour un détail de
       * statut ; l'interface l'omettra, ce qui est exact.
       */
      status: statut ?? 'registered',
    };
  },

  /**
   * Agents rattachés à la société du compte connecté.
   *
   * `company_id` est résolu par une sous-requête plutôt que par une jointure
   * imbriquée : le motif `missions(...)` a déjà cassé deux requêtes dans ce
   * projet, et une liste d'équipe n'a pas besoin d'une jointure pour s'afficher.
   *
   * `profiles!left(full_name)` est une jointure LEFT : un agent dont le compte
   * n'est pas lisible reste dans la liste, avec `nom: null`. Filtrer par la
   * jointure INNER l'aurait fait disparaître — et une équipe affichant moins
   * d'agents qu'elle n'en compte est un défaut, pas une simplification.
   */
  async getMyTeam(profileId: string): Promise<MembreEquipe[]> {
    const { data: societe, error: erreurSociete } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (erreurSociete) throw erreurSociete;
    if (!societe) return [];

    const { data, error } = await supabase
      .from('agent_profiles')
      .select('id, profile_id, zone, certification_number, is_available, status, profiles!left(full_name)')
      .eq('company_id', societe.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const membres: MembreEquipe[] = [];
    for (const ligne of data) {
      const jointure = ligne.profiles as unknown;
      /*
       * LA JOINTURE EST LUE SANS `any` ET SANS TRANSTYPE DIRECT.
       *
       * PostgREST rend la jointure soit comme un objet, soit comme un tableau
       * selon la relation détectée. Les deux formes existent réellement, et
       * ignorer le tableau ferait perdre le nom de tous les agents. On teste la
       * forme au lieu de forcer le typage.
       */
      const profil = Array.isArray(jointure) ? jointure[0] : jointure;
      const nom =
        profil && typeof profil === 'object' && 'full_name' in profil
          ? ((profil as { full_name: string | null }).full_name ?? null)
          : null;

      membres.push({
        id: ligne.id,
        profileId: ligne.profile_id,
        nom,
        zone: ligne.zone,
        certificationNumber: ligne.certification_number,
        isAvailable: ligne.is_available,
        status: versStatut(ligne.status as string) ?? 'registered',
      });
    }

    return membres;
  },
};
