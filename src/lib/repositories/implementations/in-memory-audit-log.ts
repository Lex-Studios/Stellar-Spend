import type { AuditLogRepository, AuditLog } from "../audit-log";

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private logs: Map<string, AuditLog> = new Map();

  async save(log: AuditLog): Promise<void> {
    this.logs.set(log.id, log);
  }

  async update(id: string, updates: Partial<AuditLog>): Promise<void> {
    const log = this.logs.get(id);
    if (!log) throw new Error(`AuditLog ${id} not found`);
    this.logs.set(id, { ...log, ...updates });
  }

  async getById(id: string): Promise<AuditLog | null> {
    return this.logs.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.logs.delete(id);
  }

  async getAll(): Promise<AuditLog[]> {
    return Array.from(this.logs.values());
  }

  async getByUserId(userId: string, limit?: number): Promise<AuditLog[]> {
    const logs = Array.from(this.logs.values())
      .filter((l) => l.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
    return limit ? logs.slice(0, limit) : logs;
  }

  async getByResource(
    resource: string,
    resourceId: string,
  ): Promise<AuditLog[]> {
    return Array.from(this.logs.values())
      .filter((l) => l.resource === resource && l.resourceId === resourceId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getByAction(action: string, limit?: number): Promise<AuditLog[]> {
    const logs = Array.from(this.logs.values())
      .filter((l) => l.action === action)
      .sort((a, b) => b.createdAt - a.createdAt);
    return limit ? logs.slice(0, limit) : logs;
  }
}
