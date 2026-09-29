/**
 * Lecture du portefeuille d'un compte.
 *
 * AUCUNE ÉCRITURE ICI — et ce n'est pas un oubli.
 *
 * `wallets.balance` et `transactions.amount` sont des soldes. La migration
 * `20260925000300` ne leur accorde que `select`, et c'est définitif : aucun
 * `grant insert` ni `update` n'est posé sur ces deux tables. Un solde ne peut
 * donc être modifié que par une fonction serveur — celle de l'étape 10, qui
 * n'existe pas encore.
 *
 * L'écran qui consomme ce service doit donc se tenir à l'affichage. Le jour où
 * le paiement arrive, il passera par une RPC, pas par une écriture directe :
 * c'est la seule façon de garder le séquestre hors de portée du client.
 */
import { supabase } from '@/lib/supabase';
import type { PaymentStatus } from '@/types';

/** Portefeuille d'un compte. `null` si le trigger d'inscription n'a rien créé. */
export type Portefeuille = {
  balance: number;
  blockedBalance: number;
  /** Vrai si le compte est relié à un compte de paiement Stripe. */
  stripeRattache: boolean;
};

/** Une opération de portefeuille, telle que son titulaire peut la lire. */
export type MouvementPortefeuille = {
  id: string;
  amount: number;
  /** `credit` ou `debit` ; une valeur hors de ces deux mots est rejetée. */
  type: 'credit' | 'debit';
  status: PaymentStatus;
  description: string | null;
  createdAt: string;
};

const TYPES_MOUVEMENT = ['credit', 'debit'] as const;

/**
 * Valide le `type` d'une transaction, ou renvoie `null`.
 *
 * La colonne est un `TEXT` avec une contrainte `CHECK`, donc PostgREST la rend
 * en `string`. Un type ne doit jamais être affiché tel quel : « CREDIT », ou une
 * valeur inattendue, passeraient pour un état de la base.
 */
function versTypeMouvement(valeur: string): MouvementPortefeuille['type'] | null {
  return TYPES_MOUVEMENT.find((type) => type === valeur) ?? null;
}

export const portefeuilleService = {
  /**
   * Solde et solde bloqué d'un compte.
   *
   * La politique « Users can view own wallet; admins can view all » n'ouvre que
   * la ligne du lecteur. On filtre donc par `profile_id` : sans ce filtre, un
   * administrateur qui ouvrirait cet écran lirait le portefeuille de quelqu'un
   * d'autre, ce que l'écran n'a pas vocation à afficher.
   */
  async getPortefeuille(profileId: string): Promise<Portefeuille | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('id, balance, blocked_balance, stripe_account_id')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      balance: data.balance as number,
      blockedBalance: data.blocked_balance as number,
      stripeRattache: Boolean(data.stripe_account_id),
    };
  },

  /** Identifiant du portefeuille, nécessaire pour lire ses opérations. */
  async getPortefeuilleId(profileId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) throw error;
    return data ? (data.id as string) : null;
  },

  /**
   * Opérations du portefeuille, de la plus récente à la plus ancienne.
   *
   * `transactions` s'ouvre par l'identifiant de portefeuille, et non par
   * `profile_id` : c'est la jointure que la politique elle-même énonce
   * (`exists (select 1 from wallets where …)`).
   *
   * `limit(20)` est explicite plutôt que laissé au serveur : un tableau de bord
   * n'a pas besoin de l'historique complet, et une borne non écrite est une
   * borne qu'on ne verra pas changer.
   */
  async getMouvements(walletId: string): Promise<MouvementPortefeuille[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, amount, type, status, description, created_at')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const mouvements: MouvementPortefeuille[] = [];
    for (const ligne of data) {
      const type = versTypeMouvement(ligne.type as string);
      /*
       * UNE LIGNE DE TYPE INCONNU EST OMISE, ET NON AFFICHÉE TELLE QUELLE.
       *
       * La contrainte `CHECK` l'interdit déjà en base, mais l'interface ne doit
       * pas dépendre de cette interdiction pour rester correcte : une base
       * restaurée depuis un dump plus ancien, ou une contrainte retirée, ne
       * doivent pas produire « CREDIT » à l'écran.
       */
      if (type === null) continue;

      mouvements.push({
        id: ligne.id,
        amount: ligne.amount as number,
        type,
        status: ligne.status as PaymentStatus,
        description: ligne.description,
        createdAt: ligne.created_at,
      });
    }

    return mouvements;
  },
};