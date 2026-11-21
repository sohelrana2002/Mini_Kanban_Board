/** @type {import("jest").Config} */

module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],

  transform: {
    "^.+\\.ts$": ["ts-jest", { isolatedModules: true }],
  },

  setupFiles: ["<rootDir>/test/setupEnv.ts"],

  setupFilesAfterEnv: ["<rootDir>/test/prismaMock.ts"],

  clearMocks: true,

  collectCoverageFrom: ["src/**/*.ts", "!src/prisma/**"],
};
