// Register / login / refresh / logout / me + the `auth` middleware,
// tested through real HTTP requests (Supertest) with a mocked database.
import jwt from "jsonwebtoken";

// import the mocked Prisma client to simulate database operations.
import { prismaMock } from "./prismaMock";
import { api, authCookie, cookieValue, setCookie } from "./support/helpers";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../src/utils/jwt";
import * as bcryptUtil from "../src/utils/bcrypt";

// Hashing is slow and irrelevant here: replace it.
// mock the entire bcrypt module to avoid executing real password hashing.
jest.mock("../src/utils/bcrypt");

// convert bcrypt utilities into Jest-mocked types for TypeScript support.
const mockedBcrypt = jest.mocked(bcryptUtil);

// create a dummy user object to simulate a database user record.
const user = {
  id: 1,
  email: "a@b.com",
  password: "hashed-pw",
  name: "Alice",
  createdAt: new Date(),
};

// return a Date object representing exactly one day from the current time.
const inOneDay = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

// factory function to create a mock refresh-token database record.
// accepts a raw token and optional properties to override default values.
const refreshRow = (token: string, overrides: object = {}) =>
  ({
    id: 7,
    tokenHash: hashRefreshToken(token),
    userId: 1,
    expiresAt: inOneDay(),
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  }) as any;

describe("POST /api/auth/register", () => {
  // define the request body used for registration test cases.
  const body = {
    email: "a@b.com",
    password: "123456",
    name: "Alice",
  };

  it("creates the user with a hashed password and never echoes it back", async () => {
    // mock findUnique() to resolve with null, simulating that no user exists with this email.
    prismaMock.user.findUnique.mockResolvedValue(null);

    // mock hashPassword() to resolve with a predefined hashed password instead of hashing it.
    mockedBcrypt.hashPassword.mockResolvedValue("hashed-pw");

    // mock user.create() to resolve with the predefined user object after user creation.
    prismaMock.user.create.mockResolvedValue(user as any);

    // send a real HTTP POST request to the registration endpoint with the request body.
    const res = await api().post("/api/auth/register").send(body);

    expect(res.status).toBe(201);

    // assert that Prisma's user.create() was called with the expected user data, including the hashed password instead of the original password.
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: "a@b.com",
        password: "hashed-pw",
        name: "Alice",
      },
    });

    // assert that the API response does not expose the hashed password.
    expect(JSON.stringify(res.body)).not.toContain("hashed-pw");

    // assert that the API response does not expose the original plain-text password.
    expect(JSON.stringify(res.body)).not.toContain("123456");
  });

  it("rejects a duplicate email with 400", async () => {
    // mock findUnique() to return an existing user, simulating a duplicate email.
    prismaMock.user.findUnique.mockResolvedValue(user as any);

    // send a real HTTP POST request using an email that already exists.
    const res = await api().post("/api/auth/register").send(body);

    expect(res.status).toBe(400);

    // assert that user.create() was never called because the email already exists.
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});
