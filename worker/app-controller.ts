import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo } from './types';
import type { Env } from './core-utils';
const LEGACY_SESSIONS_KEY = 'sessions';
const MIGRATION_MARKER_KEY = 'sessions_migrated_v2';
const SESSION_PREFIX = 'session:';
function sessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function coerceLegacySessions(value: unknown): Record<string, SessionInfo> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, SessionInfo> = {};
  for (const [key, v] of Object.entries(value)) {
    if (!isRecord(v)) continue;
    const id = typeof v.id === 'string' ? v.id : key;
    const title = typeof v.title === 'string' ? v.title : 'Untitled Sketch';
    const createdAt = typeof v.createdAt === 'number' ? v.createdAt : Date.now();
    const lastActive = typeof v.lastActive === 'number' ? v.lastActive : createdAt;
    out[key] = {
      id,
      title,
      createdAt,
      lastActive,
      status: v.status === 'published' ? 'published' : 'draft',
      tags: Array.isArray(v.tags) ? v.tags.filter((t) => typeof t === 'string') : [],
      summary: typeof v.summary === 'string' ? v.summary : '',
    };
  }
  return Object.keys(out).length ? out : null;
}
export class AppController extends DurableObject<Env> {
  private migrationPromise: Promise<void> | null = null;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Ensure we migrate as early as possible, but still safe with concurrency.
    this.ensureMigrated().catch((e) => console.error('AppController migration init failed:', e));
  }
  private ensureMigrated(): Promise<void> {
    if (!this.migrationPromise) {
      this.migrationPromise = this.ctx.blockConcurrencyWhile(async () => {
        await this.migrateLegacyIfNeeded();
      });
    }
    return this.migrationPromise;
  }
  private async migrateLegacyIfNeeded(): Promise<void> {
    try {
      const already = await this.ctx.storage.get<boolean>(MIGRATION_MARKER_KEY);
      if (already) return;
      const legacyRaw = await this.ctx.storage.get(LEGACY_SESSIONS_KEY);
      const legacy = coerceLegacySessions(legacyRaw);
      if (legacy) {
        // Migrate each legacy session into key-per-session storage.
        for (const [id, session] of Object.entries(legacy)) {
          await this.ctx.storage.put(sessionKey(id), session);
        }
        await this.ctx.storage.delete(LEGACY_SESSIONS_KEY);
      }
      await this.ctx.storage.put(MIGRATION_MARKER_KEY, true);
    } catch (error) {
      console.error('Failed to migrate legacy sessions:', error);
      // Don't throw: sessions API should remain available even if migration fails.
    }
  }
  async addSession(sessionId: string, title?: string, initialMetadata?: Partial<SessionInfo>): Promise<void> {
    await this.ensureMigrated();
    const now = Date.now();
    const session: SessionInfo = {
      id: sessionId,
      title: title || 'Untitled Sketch',
      createdAt: now,
      lastActive: now,
      status: 'draft',
      tags: [],
      summary: '',
      ...initialMetadata,
    };
    await this.ctx.storage.put(sessionKey(sessionId), session);
  }
  async removeSession(sessionId: string): Promise<boolean> {
    await this.ensureMigrated();
    const key = sessionKey(sessionId);
    const existing = await this.ctx.storage.get<SessionInfo>(key);
    if (!existing) return false;
    await this.ctx.storage.delete(key);
    return true;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.ensureMigrated();
    const key = sessionKey(sessionId);
    const session = await this.ctx.storage.get<SessionInfo>(key);
    if (!session) return;
    const next: SessionInfo = { ...session, lastActive: Date.now() };
    await this.ctx.storage.put(key, next);
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    await this.ensureMigrated();
    const key = sessionKey(sessionId);
    const session = await this.ctx.storage.get<SessionInfo>(key);
    if (!session) return false;
    const next: SessionInfo = { ...session, title };
    await this.ctx.storage.put(key, next);
    return true;
  }
  async updateSessionMetadata(sessionId: string, metadata: Partial<SessionInfo>): Promise<boolean> {
    await this.ensureMigrated();
    const key = sessionKey(sessionId);
    const session = await this.ctx.storage.get<SessionInfo>(key);
    if (!session) return false;
    // Avoid accidental overwrites of required fields with undefined.
    const next: SessionInfo = {
      ...session,
      ...metadata,
      id: session.id,
      createdAt: session.createdAt,
    };
    await this.ctx.storage.put(key, next);
    return true;
  }
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureMigrated();
    const listed = await this.ctx.storage.list<SessionInfo>({ prefix: SESSION_PREFIX });
    const sessions = Array.from(listed.values());
    return sessions.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
  }
  async getSessionCount(): Promise<number> {
    await this.ensureMigrated();
    const listed = await this.ctx.storage.list({ prefix: SESSION_PREFIX });
    return listed.size;
  }
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    await this.ensureMigrated();
    const session = await this.ctx.storage.get<SessionInfo>(sessionKey(sessionId));
    return session || null;
  }
  async clearAllSessions(): Promise<number> {
    await this.ensureMigrated();
    const listed = await this.ctx.storage.list({ prefix: SESSION_PREFIX });
    const keys = Array.from(listed.keys());
    if (keys.length) {
      // Delete supports string[] in Workers storage.
      await this.ctx.storage.delete(keys);
    }
    return keys.length;
  }
}