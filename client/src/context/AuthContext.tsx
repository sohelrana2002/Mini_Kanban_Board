"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  loginRequest,
  registerRequest,
  meRequest,
  logoutRequest,
} from "@/lib/services/auth.service";
import { extractErrorMessage } from "@/lib/axios";
import type { ApiUser } from "@/types";
import { toast } from "react-toastify";

interface AuthContextValue {
  user: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      try {
        const data = await meRequest();

        if (!cancelled) setUser(data.user);
      } catch (error) {
        // No valid cookie / session — stay logged out, no error to show.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await loginRequest({ email, password });
        toast.success(data.message);

        setUser(data.user);
        router.push("/boards");
      } catch (error) {
        throw new Error(extractErrorMessage(error, "Login failed"));
      }
    },
    [router],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const res = await registerRequest({ email, password, name });
        toast.success(res.message);

        const data = await loginRequest({ email, password });
        setUser(data.user);
        router.push("/boards");
      } catch (error) {
        throw new Error(extractErrorMessage(error, "Registration failed"));
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      // Revoke refresh token and clear cookies on the backend.
      await logoutRequest();
    } catch (error) {
      // Even if the request fails, clear local state.
    } finally {
      setUser(null);
      toast.success("Successfully logged out.");
      router.push("/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
