import { schema, type Database } from '@productivity/db';

export interface AuditEntry {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Append an entry to the audit trail. Best-effort: never throws into the
 * caller's request path (a failed audit write must not fail the operation).
 */
export async function writeAudit(db: Database, entry: AuditEntry): Promise<void> {
  try {
    await db.insert(schema.auditLogs).values({
      userId: entry.userId ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata,
    });
  } catch {
    // swallow — audit failures should not break the request
  }
}
