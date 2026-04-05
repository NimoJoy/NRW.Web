type AuditActionType = "create" | "update" | "correction";

type AuditEvent = {
  entityType: "account" | "bill" | "connection" | "reading";
  entityId: string;
  actionType: AuditActionType;
  actorUserId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
};

type SupabaseInsertClient = {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => unknown;
  };
};

export async function logAuditEvent(supabase: SupabaseInsertClient, event: AuditEvent) {
  const result = (await supabase.from("audit_logs").insert({
    entity_type: event.entityType,
    entity_id: event.entityId,
    action_type: event.actionType,
    actor_user_id: event.actorUserId,
    old_values: event.oldValues,
    new_values: event.newValues,
  })) as { error?: { message: string } | null };

  const error = result.error ?? null;

  if (error) {
    throw new Error(error.message);
  }
}
