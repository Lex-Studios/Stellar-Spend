import type { Repository } from "./base";

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failure";
  error?: string;
  createdAt: number;
}

export interface AuditLogRepository extends Repository<AuditLog> {
  getByUserId(userId: string, limit?: number): Promise<AuditLog[]>;
  getByResource(resource: string, resourceId: string): Promise<AuditLog[]>;
  getByAction(action: string, limit?: number): Promise<AuditLog[]>;
}
