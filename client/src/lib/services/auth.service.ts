import { api } from "@/lib/axios";
import type { ApiUser, AuthResponse } from "@/types";

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerRequest(payload: RegisterPayload) {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    user: { id: number; email: string; name: string | null };
  }>("/auth/register", payload);

  return data;
}

export async function loginRequest(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);

  return data;
}

// called on app load to check whether the httpOnly cookie still represents
// a valid session, since the frontend can no longer read the token itself.
export async function meRequest() {
  const { data } = await api.get<{
    success: boolean;
    user: ApiUser;
  }>("/auth/me");

  return data;
}

// exchanges the httpOnly "refreshToken" cookie for a new "accessToken"
// cookie. In normal use you shouldn't need to call this directly — axios.ts's
// response interceptor already calls it automatically whenever a request 401s
// because the access token expired. Exposed here mainly for explicit/manual use.
export async function refreshRequest() {
  const { data } = await api.post<{
    success: boolean;
    message: string;
  }>("/auth/refresh");

  return data;
}

//  tells the backend to clear the httpOnly auth cookie.
export async function logoutRequest() {
  const { data } = await api.post<{
    success: boolean;
    message: string;
  }>("/auth/logout");

  return data;
}
