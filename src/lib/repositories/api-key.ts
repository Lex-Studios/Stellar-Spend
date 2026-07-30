import type { Repository } from "./base";

export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  name: string;
  scopes: string[];
  createdAt: number;
  lastUsedAt?: number;
  expiresAt?: number;
  isActive: boolean;
}

export interface ApiKeyRepository extends Repository<ApiKey> {
  getByKey(key: string): Promise<ApiKey | null>;
  getByUserId(userId: string): Promise<ApiKey[]>;
  getActiveByUserId(userId: string): Promise<ApiKey[]>;
}
