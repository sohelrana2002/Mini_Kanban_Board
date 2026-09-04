import { api } from "@/lib/axios";
import type { AuthResponse } from "@/types";

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
