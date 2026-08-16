import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { z } from "zod";
import * as db from "./db";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  feedbackSync: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const record = await db.getFeedbackSyncEnvelope(ctx.user.id);
      return record ? { envelope: record.envelope, revision: record.revision, updatedAt: record.updatedAt } : null;
    }),
    put: protectedProcedure.input(z.object({ envelope: z.string().min(40).max(200_000), expectedRevision: z.number().int().min(0) })).mutation(({ ctx, input }) => db.putFeedbackSyncEnvelope(ctx.user.id, input.envelope, input.expectedRevision)),
    delete: protectedProcedure.mutation(({ ctx }) => db.deleteFeedbackSyncEnvelope(ctx.user.id)),
  }),
  trustedDevices: router({
    list: protectedProcedure.query(({ ctx }) => db.getTrustedSyncDevices(ctx.user.id)),
    register: protectedProcedure.input(z.object({ id: z.string().uuid(), label: z.string().trim().min(1).max(120), platform: z.string().trim().min(1).max(32) })).mutation(({ ctx, input }) => db.registerTrustedSyncDevice(ctx.user.id, input)),
    revoke: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) => db.revokeTrustedSyncDevice(ctx.user.id, input.id)),
  }),
  graphSync: router({
    get: protectedProcedure.input(z.object({ deviceId: z.string().uuid() })).query(async ({ ctx, input }) => {
      const record = await db.getGraphSyncEnvelope(ctx.user.id, input.deviceId);
      return record ? { envelope: record.envelope, revision: record.revision, updatedAt: record.updatedAt } : null;
    }),
    put: protectedProcedure.input(z.object({ deviceId: z.string().uuid(), envelope: z.string().min(40).max(1_000_000), expectedRevision: z.number().int().min(0) })).mutation(({ ctx, input }) => db.putGraphSyncEnvelope(ctx.user.id, input.deviceId, input.envelope, input.expectedRevision)),
    delete: protectedProcedure.input(z.object({ deviceId: z.string().uuid() })).mutation(({ ctx, input }) => db.deleteGraphSyncEnvelope(ctx.user.id, input.deviceId)),
  }),
  auditSync: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const record = await db.getAuditSyncEnvelope(ctx.user.id);
      return record ? { envelope: record.envelope, revision: record.revision, updatedAt: record.updatedAt } : null;
    }),
    put: protectedProcedure.input(z.object({ envelope: z.string().min(40).max(500_000), expectedRevision: z.number().int().min(0) })).mutation(({ ctx, input }) => db.putAuditSyncEnvelope(ctx.user.id, input.envelope, input.expectedRevision)),
    delete: protectedProcedure.mutation(({ ctx }) => db.deleteAuditSyncEnvelope(ctx.user.id)),
  }),
  subgraphSync: router({
    list: protectedProcedure.input(z.object({ deviceId: z.string().uuid() })).query(({ ctx, input }) => db.listSubgraphSyncEnvelopes(ctx.user.id, input.deviceId)),
    get: protectedProcedure.input(z.object({ deviceId: z.string().uuid(), id: z.string().trim().min(1).max(96) })).query(async ({ ctx, input }) => {
      const record = await db.getSubgraphSyncEnvelope(ctx.user.id, input.deviceId, input.id);
      return record ? { id: record.id, label: record.label, envelope: record.envelope, revision: record.revision, updatedAt: record.updatedAt } : null;
    }),
    put: protectedProcedure.input(z.object({ deviceId: z.string().uuid(), id: z.string().trim().min(1).max(96), label: z.string().trim().min(1).max(160), envelope: z.string().min(40).max(500_000), expectedRevision: z.number().int().min(0) })).mutation(({ ctx, input }) => db.putSubgraphSyncEnvelope(ctx.user.id, input.deviceId, input.id, input.label, input.envelope, input.expectedRevision)),
    delete: protectedProcedure.input(z.object({ deviceId: z.string().uuid(), id: z.string().trim().min(1).max(96) })).mutation(({ ctx, input }) => db.deleteSubgraphSyncEnvelope(ctx.user.id, input.deviceId, input.id)),
  }),
  graphSnapshots: router({
    list: protectedProcedure.input(z.object({ deviceId: z.string().uuid() })).query(({ ctx, input }) => db.listGraphSyncSnapshots(ctx.user.id, input.deviceId)),
    get: protectedProcedure.input(z.object({ deviceId: z.string().uuid(), id: z.string().trim().min(1).max(96) })).query(async ({ ctx, input }) => {
      const record = await db.getGraphSyncSnapshot(ctx.user.id, input.deviceId, input.id);
      return record ? { id: record.id, sourceRevision: record.sourceRevision, label: record.label, envelope: record.envelope, conceptCount: record.conceptCount, relationshipCount: record.relationshipCount, conceptKinds: record.conceptKinds, conceptTags: record.conceptTags, createdAt: record.createdAt } : null;
    }),
    put: protectedProcedure.input(z.object({ deviceId: z.string().uuid(), id: z.string().trim().min(1).max(96), sourceRevision: z.number().int().min(1), label: z.string().trim().min(1).max(160), envelope: z.string().min(40).max(1_000_000), conceptCount: z.number().int().min(0), relationshipCount: z.number().int().min(0), conceptKinds: z.string().max(512), conceptTags: z.string().max(512) })).mutation(({ ctx, input }) => db.putGraphSyncSnapshot(ctx.user.id, input.deviceId, input)),
    delete: protectedProcedure.input(z.object({ deviceId: z.string().uuid(), id: z.string().trim().min(1).max(96) })).mutation(({ ctx, input }) => db.deleteGraphSyncSnapshot(ctx.user.id, input.deviceId, input.id)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
