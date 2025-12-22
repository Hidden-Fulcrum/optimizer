import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User; // Always present for single-user internal tool
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // For single-user internal tool: always return a mock user
  // Frontend PIN authentication (5327) protects access
  const mockUser: User = {
    id: 1,
    openId: 'internal-user',
    name: 'Nick Panos',
    email: null,
    loginMethod: null,
    role: 'admin' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    req: opts.req,
    res: opts.res,
    user: mockUser,
  };
}
