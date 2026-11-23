import request from "supertest";
import app from "../../src/index";
import { generateAccessToken } from "./../../src/utils/jwt";

// Supertest bound to the real Express app (no port is opened)
export const api = () => request(app);

// Cookie header carrying a valid access token for the given user
export const authCookie = (userId = 1, email = `user${userId}@test.com`) => [
  `accessToken=${generateAccessToken(userId, email)}`,
];

// Every Set-Cookie line ofa response (empty array if there is none)
export const setCookie = (res: {
  headers: Record<string, unknown>;
}): string[] => {
  const raw = res.headers["set-cookie"];

  if (Array.isArray(raw)) return raw as string[];

  return raw ? [String(raw)] : [];
};

// The value of one cookie out of a list of Set-Cookie lines
export const cookieValue = (
  cookies: string[],
  name: string,
): string | undefined => {
  const line = cookies.find((c) => c.startsWith(`${name}=`));

  return line
    ? decodeURIComponent(line.split(";")[0].slice(name.length + 1))
    : undefined;
};
