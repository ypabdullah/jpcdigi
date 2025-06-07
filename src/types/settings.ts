export interface ApiCredential {
  id: string;
  provider: string;
  key_name: string;
  key_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiProvider {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  credentials: ApiCredential[];
}
