// Runs before every test file is loaded (jest `setupFiles`).
// Dedicated test-only secrets: tests never depend on your local .env.

// JWT Secrets
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

// The Prisma client is mocked in tests, but if some file ever imports the real
// config/prisma.ts this keeps it from throwing "DATABASE_URL is not set".
// Database
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";

// ?? - Nullish Coalescing Operator

// postgresql://test:test@localhost:5432/test
// postgresql:// - Database type
// test - Username
// test - Password
// localhost = Database host
// 5432 - PostgreSQL default port
// test - Database name
