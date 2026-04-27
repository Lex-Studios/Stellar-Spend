import { pool } from "./db/client";
import { logger } from "./logger";
import crypto from "crypto";

export interface AuditLog {
  id: string;
  userAddress?: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  actionDetails?: string;
  status: "success" | "failure";
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  createdAt: number;
}

export interface AdminAction {
  id: string;
  adminAddress: string;
  actionType: string;
  targetUser?: string;
  actionDetails?: string;
  reason?: string;
  createdAt: number;
}

export class AuditLoggingService {
  private readonly DEFAULT_RETENTION_DAYS = 90;

  async logAction(
    actionType: string,
    resourceType: string,
    status: "success" | "failure",
    options?: {
      userAddress?: string;
      resourceId?: string;
      actionDetails?: string;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    },
  ): Promise<AuditLog> {
    const id = `audit_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    const now = Date.now();

    await pool.query(
      `INSERT INTO audit_logs (id, user_address, action_type, resource_type, resource_id, action_details, status, ip_address, user_agent, session_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        options?.userAddress || null,
        actionType,
        resourceType,
        options?.resourceId || null,
        options?.actionDetails || null,
        status,
        options?.ipAddress || null,
        options?.userAgent || null,
        options?.sessionId || null,
        now,
      ],
    );

    logger.info(`Audit log created`, {
      auditId: id,
      actionType,
      resourceType,
      status,
      userId: options?.userAddress,
    });

    return {
      id,
      userAddress: options?.userAddress,
      actionType,
      resourceType,
      resourceId: options?.resourceId,
      actionDetails: options?.actionDetails,
      status,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      sessionId: options?.sessionId,
      createdAt: now,
    };
  }

  async logAdminAction(
    adminAddress: string,
    actionType: string,
    options?: {
      targetUser?: string;
      actionDetails?: string;
      reason?: string;
    },
  ): Promise<AdminAction> {
    const id = `admin_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    const now = Date.now();

    await pool.query(
      `INSERT INTO admin_actions (id, admin_address, action_type, target_user, action_details, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        adminAddress,
        actionType,
        options?.targetUser || null,
        options?.actionDetails || null,
        options?.reason || null,
        now,
      ],
    );

    logger.warn(`Admin action logged`, {
      adminId: id,
      adminAddress,
      actionType,
      targetUser: options?.targetUser,
    });

    return {
      id,
      adminAddress,
      actionType,
      targetUser: options?.targetUser,
      actionDetails: options?.actionDetails,
      reason: options?.reason,
      createdAt: now,
    };
  }

  async getUserAuditLogs(
    userAddress: string,
    limit = 100,
    offset = 0,
  ): Promise<AuditLog[]> {
    const result = await pool.query(
      `SELECT id, user_address, action_type, resource_type, resource_id, action_details, status, ip_address, user_agent, session_id, created_at
       FROM audit_logs
       WHERE user_address = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userAddress, limit, offset],
    );

    return result.rows.map((row) => ({
      id: row.id,
      userAddress: row.user_address || undefined,
      actionType: row.action_type,
      resourceType: row.resource_type,
      resourceId: row.resource_id || undefined,
      actionDetails: row.action_details || undefined,
      status: row.status,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      sessionId: row.session_id || undefined,
      createdAt: Number(row.created_at),
    }));
  }

  async getAuditLogs(
    filters?: {
      actionType?: string;
      resourceType?: string;
      status?: "success" | "failure";
      startDate?: number;
      endDate?: number;
    },
    limit = 100,
    offset = 0,
  ): Promise<AuditLog[]> {
    let query = `SELECT id, user_address, action_type, resource_type, resource_id, action_details, status, ip_address, user_agent, session_id, created_at
                 FROM audit_logs WHERE 1=1`;
    const params: unknown[] = [];
    let paramCount = 1;

    if (filters?.actionType) {
      query += ` AND action_type = $${paramCount}`;
      params.push(filters.actionType);
      paramCount++;
    }

    if (filters?.resourceType) {
      query += ` AND resource_type = $${paramCount}`;
      params.push(filters.resourceType);
      paramCount++;
    }

    if (filters?.status) {
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.startDate) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters?.endDate) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      userAddress: row.user_address || undefined,
      actionType: row.action_type,
      resourceType: row.resource_type,
      resourceId: row.resource_id || undefined,
      actionDetails: row.action_details || undefined,
      status: row.status,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      sessionId: row.session_id || undefined,
      createdAt: Number(row.created_at),
    }));
  }

  async getAdminActions(
    adminAddress?: string,
    limit = 100,
    offset = 0,
  ): Promise<AdminAction[]> {
    let query = `SELECT id, admin_address, action_type, target_user, action_details, reason, created_at
                 FROM admin_actions`;
    const params: unknown[] = [];

    if (adminAddress) {
      query += ` WHERE admin_address = $1`;
      params.push(adminAddress);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      adminAddress: row.admin_address,
      actionType: row.action_type,
      targetUser: row.target_user || undefined,
      actionDetails: row.action_details || undefined,
      reason: row.reason || undefined,
      createdAt: Number(row.created_at),
    }));
  }

  async cleanupOldLogs(retentionDays = this.DEFAULT_RETENTION_DAYS): Promise<number> {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    const result = await pool.query(
      `DELETE FROM audit_logs WHERE created_at < $1`,
      [cutoffTime],
    );

    logger.info(`Old audit logs cleaned up`, {
      count: result.rowCount,
      retentionDays,
    });

    return result.rowCount || 0;
  }

  async setRetentionPolicy(retentionDays: number): Promise<void> {
    const id = `retention_${Date.now()}`;
    const now = Date.now();

    await pool.query(
      `INSERT INTO audit_log_retention (id, retention_days, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET retention_days = $2, last_cleanup_at = $3`,
      [id, retentionDays, now],
    );

    logger.info(`Audit log retention policy updated`, {
      retentionDays,
    });
  }

  async getRetentionPolicy(): Promise<number> {
    const result = await pool.query(
      `SELECT retention_days FROM audit_log_retention ORDER BY created_at DESC LIMIT 1`,
    );

    if (result.rows.length === 0) {
      return this.DEFAULT_RETENTION_DAYS;
    }

    return result.rows[0].retention_days;
  }
}

export const auditLoggingService = new AuditLoggingService();
