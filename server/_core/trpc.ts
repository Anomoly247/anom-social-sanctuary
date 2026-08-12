import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const status = ctx.user.status;
  const restrictedUntil = (ctx.user as any).restrictedUntil ? new Date((ctx.user as any).restrictedUntil) : null;
  const now = new Date();

  if (status === "suspended") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Account suspended" });
  }
  if (status === "banned" || status === "muted") {
    throw new TRPCError({ code: "FORBIDDEN", message: `Account is ${status}` });
  }

  if (status === "timed_out" && restrictedUntil && restrictedUntil > now) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Account is timed out" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    if (ctx.user.status === "suspended") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Account suspended" });
    }

    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
