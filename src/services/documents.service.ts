import { supabase } from '@/lib/supabase';
import type { ProviderStatus } from '@/types';

/**
 * Lecture des pièces justificatives d'un compte.
 *
 * ALIMENTAIRE POUR L'ÉCRAN « PROFIL & PARAMÈTRES », ET RIEN D'AUTRE.
 *
 * La maquette y dessine « Agréments & justificatifs — 3 valides », avec un
 * état par document. C'est la seule partie du modèle qui s'y prête : `documents`
 * porte un `status` et une date d'expiration, deux informations qui se
 * comparent et se comptent.
 *
 * LECTURE SEULE, ET C'EST VOLONTAIRE. Aucun `grant insert` ni `update` n'est
 * posé sur `documents` dans la migration 00300 : le dépôt d'un justificatif
 * passe necessarily par une fonction serveur, qui n'existe pas encore. Un
 * écran d'upload qui échouerait au premier envoi serait pire qu'un écran de
 * consultation.
 */

/** Type de pièce, aligné sur l'énumération `document_type`. */
export type TypeDocument = 'identity' | 'certification' | 'insurance' | 'other';

/** Une pièce justificative, telle que son titulaire peut la lire. */
export type DocumentJustificatif = {
  id: string;
  type: TypeDocument;
  name: string;
  status: ProviderStatus;
  /** `null` si la pièce n'a pas de date limite. */
  expiryDate: string | null;
  createdAt: string;
};

const TYPES_DOCUMENT = ['identity', 'certification', 'insurance', 'other'] as const;

/**
 * Vrai si le statut vaut `validated` ou `active`.
 *
 * C'est le seul critère retenu pour « valide ». Les deux autres statuts
 * signifient que la pièce existe mais n'est pas encore acceptée, et les compter
 * comme valides annoncerait un agrément que l'administration n'a pas donné.
 */
export function estDocumentValide(document: DocumentJustificatif): boolean {
  return document.status === 'validated' || document.status === 'active';
}

const TYPES: readonly string[] = TYPES_DOCUMENT;

export const documentsService = {
  /**
   * Pièces justificatives d'un compte, de la plus récente à la plus ancienne.
   *
   * `order` est écrit parce qu'un tableau de justificatifs livré dans un ordre
   * arbitraire change à chaque lecture : l'écran ne doit pas faire sauter le
   * document le plus récent d'une place à chaque ouverture.
   */
  async getDocuments(profileId: string): Promise<DocumentJustificatif[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('id, document_type, document_name, expiry_date, status, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const documents: DocumentJustificatif[] = [];
    for (const ligne of data) {
      const type = ligne.document_type as string;

      /*
       * UN TYPE INCONNU EST OMIS, ET NON AFFICHÉ TEL QUEL.
       *
       * La contrainte `CHECK` de l'énumération l'interdit déjà en base, mais
       * l'interface ne doit pas dépendre de cette interdiction pour rester
       * correcte : une base restaurée depuis un dump plus ancien ne doit pas
       * produire « undefined » dans une liste de justificatifs.
       */
      if (!TYPES.includes(type)) continue;

      documents.push({
        id: ligne.id,
        type: type as TypeDocument,
        name: ligne.document_name ?? 'Pièce justificative',
        status: ligne.status as ProviderStatus,
        expiryDate: ligne.expiry_date,
        createdAt: ligne.created_at,
      });
    }

    return documents;
  },
};
