export type ModerationUndoAction =
  | { kind: 'role'; userId: number; userLabel: string; previousRole: 'user' | 'ambassador' | 'moderator' | 'admin' | 'owner' }
  | { kind: 'status'; userId: number; userLabel: string; previousStatus: 'active' | 'suspended' }
  | { kind: 'bulk-role'; changes: Array<{ userId: number; userLabel: string; previousRole: 'user' | 'ambassador' | 'moderator' | 'admin' | 'owner' }> }
  | { kind: 'bulk-status'; changes: Array<{ userId: number; userLabel: string; previousStatus: 'active' | 'suspended' }> };

export type ModerationUndoOperation =
  | { userId: number; role: 'user' | 'ambassador' | 'moderator' | 'admin' | 'owner' }
  | { userId: number; status: 'active' | 'suspended' };

export function buildModerationUndoOperations(action: ModerationUndoAction): ModerationUndoOperation[] {
  if (action.kind === 'role') return [{ userId: action.userId, role: action.previousRole }];
  if (action.kind === 'status') return [{ userId: action.userId, status: action.previousStatus }];
  if (action.kind === 'bulk-role') return action.changes.map(({ userId, previousRole }) => ({ userId, role: previousRole }));
  return action.changes.map(({ userId, previousStatus }) => ({ userId, status: previousStatus }));
}
