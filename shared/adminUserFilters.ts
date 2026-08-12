export type AdminUserRole = "user" | "ambassador" | "moderator" | "admin" | "owner";
export type AdminUserAccountStatus = "active" | "suspended" | "muted" | "timed_out" | "banned";
export type AdminUserRoleFilter = "all" | AdminUserRole;
export type AdminUserStatusFilter = "all" | "active" | "inactive";

export type AdminUserSummary = {
  id: number;
  name: string | null;
  email: string | null;
  role: AdminUserRole;
  status?: AdminUserAccountStatus;
  createdAt: Date | string;
  lastSignedIn: Date | string | null;
};

const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function isAdminUserActive(lastSignedIn: Date | string | null, now = Date.now()): boolean {
  if (!lastSignedIn) return false;
  const signedInAt = new Date(lastSignedIn).getTime();
  return Number.isFinite(signedInAt) && now - signedInAt <= ACTIVE_WINDOW_MS;
}

export function filterAdminUsers(
  users: readonly AdminUserSummary[],
  options: {
    query?: string;
    role?: AdminUserRoleFilter;
    status?: AdminUserStatusFilter;
    now?: number;
  } = {},
): AdminUserSummary[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  const role = options.role ?? "all";
  const status = options.status ?? "all";
  const now = options.now ?? Date.now();

  return users.filter((user) => {
    const searchableText = `${user.id} ${user.name ?? ""} ${user.email ?? ""}`.toLowerCase();
    const matchesQuery = query.length === 0 || searchableText.includes(query);
    const matchesRole = role === "all" || user.role === role;
    const matchesStatus =
      status === "all" ||
      (status === "active" && isAdminUserActive(user.lastSignedIn, now)) ||
      (status === "inactive" && !isAdminUserActive(user.lastSignedIn, now));
    return matchesQuery && matchesRole && matchesStatus;
  });
}

export function selectAdminUsers(users: readonly AdminUserSummary[], userIds: readonly number[]): AdminUserSummary[] {
  const userMap = new Map(users.map((user) => [user.id, user]));
  const result: AdminUserSummary[] = [];
  for (const id of userIds) {
    const user = userMap.get(id);
    if (user && !result.some((u) => u.id === user.id)) {
      result.push(user);
    }
  }
  return result;
}
