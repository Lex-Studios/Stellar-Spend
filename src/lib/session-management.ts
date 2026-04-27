import { pool } from "./db/client";
import { logger } from "./logger";
import crypto from "crypto";

export interface Session {
  id: string;
  userAddress: string;
  token: string;
  refreshToken?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: number;
  expiresAt: number;
  lastActivityAt: number;
  refreshedAt?: number;
}

export class SessionManagementService {
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  async createSession(
    userAddress: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    const id = `session_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    const token = crypto.randomBytes(32).toString("hex");
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    const expiresAt = now + this.SESSION_TIMEOUT;

    await pool.query(
      `INSERT INTO sessions (id, user_address, token, refresh_token, ip_address, user_agent, is_active, created_at, expires_at, last_activity_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        userAddress,
        token,
        refreshToken,
        ipAddress || null,
        userAgent || null,
        true,
        now,
        expiresAt,
        now,
      ],
    );

    logger.info(`Session created`, {
      userId: userAddress,
      sessionId: id,
      ipAddress,
    });

    return {
      id,
      userAddress,
      token,
      refreshToken,
      ipAddress,
      userAgent,
      isActive: true,
      createdAt: now,
      expiresAt,
      lastActivityAt: now,
    };
  }

  async validateSession(token: string): Promise<Session | null> {
    const result = await pool.query(
      `SELECT id, user_address, token, refresh_token, ip_address, user_agent, is_active, created_at, expires_at, last_activity_at, refreshed_at
       FROM sessions
       WHERE token = $1 AND is_active = true`,
      [token],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const now = Date.now();

    // Check if session has expired
    if (Number(row.expires_at) < now) {
      await this.revokeSession(row.id, "Session expired");
      return null;
    }

    // Update last activity
    await pool.query(
      `UPDATE sessions SET last_activity_at = $1 WHERE id = $2`,
      [now, row.id],
    );

    return {
      id: row.id,
      userAddress: row.user_address,
      token: row.token,
      refreshToken: row.refresh_token || undefined,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      isActive: row.is_active,
      createdAt: Number(row.created_at),
      expiresAt: Number(row.expires_at),
      lastActivityAt: Number(row.last_activity_at),
      refreshedAt: row.refreshed_at ? Number(row.refreshed_at) : undefined,
    };
  }

  async refreshSession(refreshToken: string): Promise<Session | null> {
    const result = await pool.query(
      `SELECT id, user_address, token, refresh_token, ip_address, user_agent, is_active, created_at, expires_at, last_activity_at
       FROM sessions
       WHERE refresh_token = $1 AND is_active = true`,
      [refreshToken],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const now = Date.now();
    const newExpiresAt = now + this.SESSION_TIMEOUT;

    // Update session with new expiry
    await pool.query(
      `UPDATE sessions SET expires_at = $1, refreshed_at = $2, last_activity_at = $3
       WHERE id = $4`,
      [newExpiresAt, now, now, row.id],
    );

    logger.info(`Session refreshed`, {
      userId: row.user_address,
      sessionId: row.id,
    });

    return {
      id: row.id,
      userAddress: row.user_address,
      token: row.token,
      refreshToken: row.refresh_token || undefined,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      isActive: true,
      createdAt: Number(row.created_at),
      expiresAt: newExpiresAt,
      lastActivityAt: now,
      refreshedAt: now,
    };
  }

  async getUserSessions(userAddress: string): Promise<Session[]> {
    const result = await pool.query(
      `SELECT id, user_address, token, refresh_token, ip_address, user_agent, is_active, created_at, expires_at, last_activity_at, refreshed_at
       FROM sessions
       WHERE user_address = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [userAddress],
    );

    return result.rows.map((row) => ({
      id: row.id,
      userAddress: row.user_address,
      token: row.token,
      refreshToken: row.refresh_token || undefined,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      isActive: row.is_active,
      createdAt: Number(row.created_at),
      expiresAt: Number(row.expires_at),
      lastActivityAt: Number(row.last_activity_at),
      refreshedAt: row.refreshed_at ? Number(row.refreshed_at) : undefined,
    }));
  }

  async revokeSession(sessionId: string, reason?: string): Promise<void> {
    const result = await pool.query(
      `SELECT user_address FROM sessions WHERE id = $1`,
      [sessionId],
    );

    if (result.rows.length === 0) {
      return;
    }

    const userAddress = result.rows[0].user_address;

    await pool.query(
      `UPDATE sessions SET is_active = false WHERE id = $1`,
      [sessionId],
    );

    const revocationId = `revocation_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    await pool.query(
      `INSERT INTO session_revocations (id, session_id, user_address, reason, revoked_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [revocationId, sessionId, userAddress, reason || null, Date.now()],
    );

    logger.info(`Session revoked`, {
      userId: userAddress,
      sessionId,
      reason,
    });
  }

  async revokeAllUserSessions(userAddress: string, reason?: string): Promise<void> {
    const result = await pool.query(
      `SELECT id FROM sessions WHERE user_address = $1 AND is_active = true`,
      [userAddress],
    );

    for (const row of result.rows) {
      await this.revokeSession(row.id, reason);
    }

    logger.info(`All sessions revoked for user`, {
      userId: userAddress,
      reason,
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = Date.now();
    const result = await pool.query(
      `UPDATE sessions SET is_active = false
       WHERE expires_at < $1 AND is_active = true`,
      [now],
    );

    logger.info(`Expired sessions cleaned up`, {
      count: result.rowCount,
    });

    return result.rowCount || 0;
  }
}

export const sessionManagementService = new SessionManagementService();
