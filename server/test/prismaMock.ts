import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";
import prisma from "../src/config/prisma";

// Replace the real Prisma client with a deep mock for EVERY test file
// (this file is registered in jest.config.js -> setupFilesAfterEnv).
// No database is needed to run the tests.
jest.mock("../src/config/prisma", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// Import this in a test:  import { prismaMock } from "./prismaMock";
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  // Fresh mock for every test, so tests can't leak into each other.
  mockReset(prismaMock);

  // Controllers console.log their caught errors; keep test output readable.
  jest.spyOn(console, "log").mockImplementation(() => undefined);

  jest.spyOn(console, "error").mockImplementation(() => undefined);
});
