export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: 'client' | 'agent' | 'company' | 'admin';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: 'client' | 'agent' | 'company' | 'admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: 'client' | 'agent' | 'company' | 'admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_roles: {
        Row: {
          profile_id: string;
          role: 'client' | 'agent' | 'company' | 'admin';
          created_at: string;
        };
        Insert: {
          profile_id: string;
          role: 'client' | 'agent' | 'company' | 'admin';
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          role?: 'client' | 'agent' | 'company' | 'admin';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_roles_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      agent_profiles: {
        Row: {
          id: string;
          profile_id: string;
          company_id: string | null;
          certification_number: string | null;
          certification_expiry: string | null;
          hourly_rate: number | null;
          zone: string | null;
          bio: string | null;
          status: 'registered' | 'documents_submitted' | 'in_validation' | 'validated' | 'rejected' | 'active' | 'suspended';
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          company_id?: string | null;
          certification_number?: string | null;
          certification_expiry?: string | null;
          hourly_rate?: number | null;
          zone?: string | null;
          bio?: string | null;
          status?: 'registered' | 'documents_submitted' | 'in_validation' | 'validated' | 'rejected' | 'active' | 'suspended';
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          company_id?: string | null;
          certification_number?: string | null;
          certification_expiry?: string | null;
          hourly_rate?: number | null;
          zone?: string | null;
          bio?: string | null;
          status?: 'registered' | 'documents_submitted' | 'in_validation' | 'validated' | 'rejected' | 'active' | 'suspended';
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agent_profiles_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'agent_profiles_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'company_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      company_profiles: {
        Row: {
          id: string;
          profile_id: string;
          company_name: string;
          siret: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          description: string | null;
          website: string | null;
          status: 'registered' | 'documents_submitted' | 'in_validation' | 'validated' | 'rejected' | 'active' | 'suspended';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          company_name: string;
          siret?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          description?: string | null;
          website?: string | null;
          status?: 'registered' | 'documents_submitted' | 'in_validation' | 'validated' | 'rejected' | 'active' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          company_name?: string;
          siret?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          description?: string | null;
          website?: string | null;
          status?: 'registered' | 'documents_submitted' | 'in_validation' | 'validated' | 'rejected' | 'active' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'company_profiles_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          profile_id: string;
          document_type: 'identity' | 'certification' | 'insurance' | 'other';
          document_url: string;
          document_name: string | null;
          expiry_date: string | null;
          status: 'registered' | 'documents_submitted' | 'in_validation' | 'validated' | 'rejected' | 'active' | 'suspended';
          rejection_reason: string | null;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          document_type: 'identity' | 'certification' | 'insurance' | 'other';
          document_url: string;
          document_name?: string | null;
          expiry_date?: string | null;
          status?: 'registered' | 'documents_submitted' | 'in_validation' | 'validated' | 'rejected' | 'active' | 'suspended';
          rejection_reason?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          document_type?: 'identity' | 'certification' | 'insurance' | 'other';
          document_url?: string;
          document_name?: string | null;
          expiry_date?: string | null;
          status?: 'registered' | 'documents_submitted' | 'in_validation' | 'validated' | 'rejected' | 'active' | 'suspended';
          rejection_reason?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_verified_by_fkey';
            columns: ['verified_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      villes: {
        Row: {
          id: string;
          nom: string;
          code_postal: string | null;
          region: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          code_postal?: string | null;
          region?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          code_postal?: string | null;
          region?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      missions: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          description: string | null;
          address: string;
          city: string;
          postal_code: string | null;
          start_time: string;
          end_time: string;
          agent_count: number;
          budget: number | null;
          status: 'draft' | 'published' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'paid';
          special_requirements: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          /**
           * À FOURNIR, et sa valeur est sans importance.
           *
           * `20260926001400` avait posé un `DEFAULT auth.uid()` et retiré le
           * droit d'écrire la colonne. **Ça n'a jamais fonctionné** : un
           * `DEFAULT` n'est pas de la donnée, PostgreSQL l'évalue en
           * préparant l'instruction — donc via PostgREST, dans le contexte du
           * rôle *preparer*, **avant** que le jeton ne soit installé. `auth.uid()`
           * y renvoyait `NULL`, la politique refusait la ligne, et le message ne
           * nommait aucune des deux raisons.
           *
           * `20260926001600` renverse l'approche : la colonne est à nouveau
           * remplie par l'application, et un trigger `BEFORE INSERT` en
           * `SECURITY DEFINER` **écrase** la valeur par `auth.uid()`.
           *
           * Le client peut donc envoyer n'importe quel `client_id` : il sera
           * ignoré. La garantie ne repose ni sur une comparaison, ni sur
           * l'absence d'un droit, mais sur une écriture inconditionnelle.
           */
          client_id?: string;
          title: string;
          description?: string | null;
          address: string;
          city: string;
          postal_code?: string | null;
          start_time: string;
          end_time: string;
          agent_count?: number;
          budget?: number | null;
          status?: 'draft' | 'published' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
          special_requirements?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          title?: string;
          description?: string | null;
          address?: string;
          city?: string;
          postal_code?: string | null;
          start_time?: string;
          end_time?: string;
          agent_count?: number;
          budget?: number | null;
          status?: 'draft' | 'published' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
          special_requirements?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'missions_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      mission_assignments: {
        Row: {
          id: string;
          mission_id: string;
          agent_id: string | null;
          company_id: string | null;
          status: 'pending' | 'accepted' | 'rejected' | 'completed';
          proposed_rate: number | null;
          check_in_time: string | null;
          check_in_location_lat: number | null;
          check_in_location_lng: number | null;
          check_out_time: string | null;
          check_out_location_lat: number | null;
          check_out_location_lng: number | null;
          report: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          agent_id?: string | null;
          company_id?: string | null;
          status?: 'pending' | 'accepted' | 'rejected' | 'completed';
          proposed_rate?: number | null;
          check_in_time?: string | null;
          check_in_location_lat?: number | null;
          check_in_location_lng?: number | null;
          check_out_time?: string | null;
          check_out_location_lat?: number | null;
          check_out_location_lng?: number | null;
          report?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          agent_id?: string | null;
          company_id?: string | null;
          status?: 'pending' | 'accepted' | 'rejected' | 'completed';
          proposed_rate?: number | null;
          check_in_time?: string | null;
          check_in_location_lat?: number | null;
          check_in_location_lng?: number | null;
          check_out_time?: string | null;
          check_out_location_lat?: number | null;
          check_out_location_lng?: number | null;
          report?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mission_assignments_mission_id_fkey';
            columns: ['mission_id'];
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mission_assignments_agent_id_fkey';
            columns: ['agent_id'];
            referencedRelation: 'agent_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mission_assignments_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'company_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      wallets: {
        Row: {
          id: string;
          profile_id: string;
          balance: number;
          blocked_balance: number;
          stripe_account_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          balance?: number;
          blocked_balance?: number;
          stripe_account_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          balance?: number;
          blocked_balance?: number;
          stripe_account_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wallets_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          wallet_id: string;
          mission_id: string | null;
          amount: number;
          type: string;
          status: 'blocked' | 'released' | 'refunded' | 'in_dispute';
          description: string | null;
          stripe_payment_intent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          mission_id?: string | null;
          amount: number;
          type: string;
          status?: 'blocked' | 'released' | 'refunded' | 'in_dispute';
          description?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_id?: string;
          mission_id?: string | null;
          amount?: number;
          type?: string;
          status?: 'blocked' | 'released' | 'refunded' | 'in_dispute';
          description?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_wallet_id_fkey';
            columns: ['wallet_id'];
            referencedRelation: 'wallets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_mission_id_fkey';
            columns: ['mission_id'];
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          mission_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_mission_id_fkey';
            columns: ['mission_id'];
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_reviewer_id_fkey';
            columns: ['reviewer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_reviewee_id_fkey';
            columns: ['reviewee_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          mission_id: string;
          sender_id: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          sender_id: string;
          content: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          sender_id?: string;
          content?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_mission_id_fkey';
            columns: ['mission_id'];
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          body: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          body: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          body?: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_profile_id_fkey';
            columns: ['profile_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      /**
       * Annuaire des agents — migration 20260926002000.
       *
       * Rend `full_name` parce que le nom affiché n'existe que dans `profiles`,
       * table fermée au client. La fonction rend ce nom et RIEN d'autre de
       * `profiles` : ni téléphone, ni avatar.
       *
       * `p_texte` : `null` ou vide = pas de recherche. Sinon le terme doit se
       * trouver dans le nom, la zone OU la bio.
       */
      liste_agents_publics: {
        Args: { p_texte: string | null };
        Returns: {
          id: string;
          profile_id: string;
          full_name: string | null;
          zone: string | null;
          bio: string | null;
          hourly_rate: number | null;
          certification_number: string | null;
          is_available: boolean | null;
          status: string | null;
        }[];
      };
      accept_assignment: {
        Args: { target_assignment_id: string };
        Returns: Database['public']['Enums']['assignment_status'];
      };
      cancel_mission: {
        Args: { target_mission_id: string };
        Returns: Database['public']['Enums']['mission_status'];
      };
      complete_assignment: {
        Args: { target_assignment_id: string };
        Returns: Database['public']['Enums']['assignment_status'];
      };
      complete_mission: {
        Args: { target_mission_id: string };
        Returns: Database['public']['Enums']['mission_status'];
      };
      mark_mission_paid: {
        Args: { target_mission_id: string };
        Returns: Database['public']['Enums']['mission_status'];
      };
      open_mission_dispute: {
        Args: { target_mission_id: string };
        Returns: Database['public']['Enums']['mission_status'];
      };
      publish_mission: {
        Args: { target_mission_id: string };
        Returns: Database['public']['Enums']['mission_status'];
      };
      reject_assignment: {
        Args: { target_assignment_id: string };
        Returns: Database['public']['Enums']['assignment_status'];
      };
    };
    Enums: {
      user_role: 'client' | 'agent' | 'company' | 'admin';
      mission_status: 'draft' | 'published' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'paid';
      provider_status: 'registered' | 'documents_submitted' | 'in_validation' | 'validated' | 'rejected' | 'active' | 'suspended';
      payment_status: 'blocked' | 'released' | 'refunded' | 'in_dispute';
      assignment_status: 'pending' | 'accepted' | 'rejected' | 'completed';
      document_type: 'identity' | 'certification' | 'insurance' | 'other';
    };
  };
}
