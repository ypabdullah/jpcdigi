import { supabase } from '@/integrations/supabase/client';
import { ApiCredential } from '@/types/settings';

// Table name in Supabase
const API_CREDENTIALS_TABLE = 'api_credentials';

export class ApiSettingsService {
  // Get all API credentials
  static async getAllCredentials(): Promise<ApiCredential[]> {
    try {
      const { data, error } = await supabase
        .from(API_CREDENTIALS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching API credentials:', error);
      throw error;
    }
  }

  // Get credentials for a specific provider (e.g., "digiflazz")
  static async getCredentialsByProvider(provider: string): Promise<ApiCredential[]> {
    try {
      const { data, error } = await supabase
        .from(API_CREDENTIALS_TABLE)
        .select('*')
        .eq('provider', provider)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${provider} credentials:`, error);
      throw error;
    }
  }

  // Create a new API credential
  static async createCredential(credential: Omit<ApiCredential, 'id' | 'created_at' | 'updated_at'>): Promise<ApiCredential> {
    try {
      const { data, error } = await supabase
        .from(API_CREDENTIALS_TABLE)
        .insert([{
          ...credential,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating API credential:', error);
      throw error;
    }
  }

  // Update an existing API credential
  static async updateCredential(id: string, updates: Partial<ApiCredential>): Promise<ApiCredential> {
    try {
      const { data, error } = await supabase
        .from(API_CREDENTIALS_TABLE)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating API credential:', error);
      throw error;
    }
  }

  // Delete an API credential
  static async deleteCredential(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(API_CREDENTIALS_TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting API credential:', error);
      throw error;
    }
  }

  // Set a credential as active and deactivate others of the same key_name
  static async setCredentialActive(id: string, provider: string, keyName: string): Promise<void> {
    try {
      // First, deactivate all credentials with the same provider and key_name
      const { error: deactivateError } = await supabase
        .from(API_CREDENTIALS_TABLE)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('provider', provider)
        .eq('key_name', keyName);

      if (deactivateError) throw deactivateError;

      // Then, activate the specified credential
      const { error: activateError } = await supabase
        .from(API_CREDENTIALS_TABLE)
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (activateError) throw activateError;
    } catch (error) {
      console.error('Error setting credential active status:', error);
      throw error;
    }
  }

  // Get active Digiflazz credentials
  static async getActiveDigiflazzCredentials(): Promise<{ username: string, apiKey: string } | null> {
    try {
      const credentials = await this.getCredentialsByProvider('digiflazz');
      
      const username = credentials.find(c => c.key_name === 'username' && c.is_active);
      const apiKey = credentials.find(c => c.key_name === 'apiKey' && c.is_active);
      
      if (username && apiKey) {
        return {
          username: username.key_value,
          apiKey: apiKey.key_value
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting active Digiflazz credentials:', error);
      throw error;
    }
  }
}
