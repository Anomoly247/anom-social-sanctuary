import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getUserById: vi.fn(async (userId: number) => userId === 999999 ? undefined : ({
    id: userId,
    email: `target-${userId}@example.com`,
    role: "user" as const,
    status: "active" as const,
  })),
  updateUserRole: vi.fn(async (_userId: number, _role: "user" | "admin") => ({ success: true as const })),
  updateUserStatus: vi.fn(async (_userId: number, _status: "active" | "suspended") => ({ success: true as const })),
  createAuditLog: vi.fn(async (_entry: Record<string, unknown>) => undefined),
  getAuditLogs: vi.fn(async (_limit: number) => []),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function createContext(
  role: "admin" | "user",
  status: "active" | "suspended" = "active",
  id = 1,
): TrpcContext {
  const now = new Date();
  return {
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: {
      id,
      openId: `user-${id}`,
      name: "Test User",
      email: `user-${id}@example.com`,
      loginMethod: "google",
      role,
      status,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
  };
}

describe("system user management procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows an admin to promote a user and suspend an account", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.system.updateUserRole({ userId: 7, role: "admin" })).resolves.toEqual({ success: true });
    await expect(caller.system.updateUserStatus({ userId: 7, status: "suspended" })).resolves.toEqual({ success: true });

    expect(dbMocks.updateUserRole).toHaveBeenCalledWith(7, "admin");
    expect(dbMocks.updateUserStatus).toHaveBeenCalledWith(7, "suspended");
    expect(dbMocks.createAuditLog).toHaveBeenCalledTimes(2);
    expect(dbMocks.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "update_user_role_admin", entityId: 7 }));
    expect(dbMocks.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "update_user_status_suspended", entityId: 7 }));
  });

  it("rejects role and status changes from regular users", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.system.updateUserRole({ userId: 7, role: "admin" })).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
    });
    await expect(caller.system.updateUserStatus({ userId: 7, status: "suspended" })).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
    });
    expect(dbMocks.updateUserRole).not.toHaveBeenCalled();
    expect(dbMocks.updateUserStatus).not.toHaveBeenCalled();
  });

  it("prevents an admin from removing their own access or suspending themselves", async () => {
    const caller = appRouter.createCaller(createContext("admin", "active", 1));

    await expect(caller.system.updateUserRole({ userId: 1, role: "user" })).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
    });
    await expect(caller.system.updateUserStatus({ userId: 1, status: "suspended" })).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
    });
    expect(dbMocks.updateUserRole).not.toHaveBeenCalled();
    expect(dbMocks.updateUserStatus).not.toHaveBeenCalled();
  });

  it("rejects malformed or missing target IDs before calling the database", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.system.updateUserRole({ userId: 0, role: "admin" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.system.updateUserStatus({ userId: -2, status: "suspended" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.system.updateUserRole({ userId: 999999, role: "admin" })).rejects.toMatchObject<Partial<TRPCError>>({
      code: "NOT_FOUND",
    });
    expect(dbMocks.updateUserRole).not.toHaveBeenCalled();
  });

  it("allows an admin to promote and suspend multiple selected users atomically at the procedure level", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.system.bulkUpdateUserRole({ userIds: [7, 8], role: "admin" })).resolves.toEqual({ success: true, count: 2 });
    await expect(caller.system.bulkUpdateUserStatus({ userIds: [7, 8], status: "suspended" })).resolves.toEqual({ success: true, count: 2 });

    expect(dbMocks.updateUserRole).toHaveBeenCalledWith(7, "admin");
    expect(dbMocks.updateUserRole).toHaveBeenCalledWith(8, "admin");
    expect(dbMocks.updateUserStatus).toHaveBeenCalledWith(7, "suspended");
    expect(dbMocks.updateUserStatus).toHaveBeenCalledWith(8, "suspended");
    expect(dbMocks.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "bulk_update_user_role_admin" }));
    expect(dbMocks.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "bulk_update_user_status_suspended" }));
  });

  it("rejects bulk actions from regular users and protects the admin from self-suspension", async () => {
    const regularCaller = appRouter.createCaller(createContext("user"));
    const adminCaller = appRouter.createCaller(createContext("admin", "active", 1));

    await expect(regularCaller.system.bulkUpdateUserRole({ userIds: [7, 8], role: "admin" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(regularCaller.system.bulkUpdateUserStatus({ userIds: [7, 8], status: "suspended" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    await expect(adminCaller.system.bulkUpdateUserStatus({ userIds: [1, 8], status: "suspended" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    expect(dbMocks.updateUserStatus).not.toHaveBeenCalled();
  });

  it("exposes the protected audit activity query", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    dbMocks.getAuditLogs.mockResolvedValueOnce([{ id: 1, action: "bulk_update_user_status_suspended" }]);

    await expect(caller.system.getAuditLogs()).resolves.toEqual([{ id: 1, action: "bulk_update_user_status_suspended" }]);
    expect(dbMocks.getAuditLogs).toHaveBeenCalledWith(100);
  });

  it("blocks suspended users before protected procedures run", async () => {
    const caller = appRouter.createCaller(createContext("user", "suspended"));

    await expect(caller.profile.getMe()).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
      message: "Account suspended",
    });
  });
});
