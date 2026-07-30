export type ApiKeyStatus = "active" | "rotated" | "revoked";

export type ApiKeyScope =
  | "transactions:read"
  | "transactions:write"
  | "analytics:read"
  | "wallets:read"
  | "webhooks:read"
  | "webhooks:write"
  | "admin"
  | "admin:*"
  | "read:quotes"
  | "read:transactions"
  | "write:transactions"
  | "write:payouts"
  | "read:analytics"
  | "read:wallets"
  | "read:webhooks"
  | "write:webhooks"
  | "read:api-keys"
  | "write:api-keys";

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  status: ApiKeyStatus;
  scopes: ApiKeyScope[];
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
  usageCount: number;
  lastUsedAt?: number;
  lastRotatedAt?: number;
  revokedAt?: number;
  revokedReason?: string;
  expiresAt?: number;
  rotatedFromKeyId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApiKeyWithSecret extends ApiKeyRecord {
  plaintextKey: string;
}

export interface ApiKeyUsageEvent {
  id: string;
  apiKeyId: string;
  method: string;
  path: string;
  statusCode: number;
  limited: boolean;
  ipAddress?: string;
  usedAt: number;
  metadata?: Record<string, unknown>;
}

export interface ApiKeyAnalytics {
  apiKeyId: string;
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  rateLimitedRequests: number;
  successRate: number;
  topPaths: { path: string; count: number }[];
  requestsByDay: { date: string; count: number }[];
  averageRequestsPerHour: number;
}
