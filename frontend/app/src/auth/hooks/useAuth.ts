import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { loginApi, signupApi } from "@markdown-editor/infra";
import type { LoginCredentials, SignupCredentials, AuthUser } from "@markdown-editor/domain";
import { currentUserAtom } from "@/auth/state/authAtoms";
import {
  loginUseCase,
  signupUseCase,
  logoutUseCase,
  type AuthDependencies,
} from "@/auth/useCases/authUseCases";

export function useAuth() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deps: AuthDependencies = useMemo(
    () => ({
      loginApi,
      signupApi,
      setCurrentUser: (user: AuthUser | null) => {
        setCurrentUser(user);
      },
      navigate,
    }),
    [navigate, setCurrentUser],
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true);
      setError(null);
      try {
        await loginUseCase(deps, credentials);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Login failed");
      } finally {
        setIsLoading(false);
      }
    },
    [deps],
  );

  const signup = useCallback(
    async (credentials: SignupCredentials) => {
      setIsLoading(true);
      setError(null);
      try {
        await signupUseCase(deps, credentials);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Signup failed");
      } finally {
        setIsLoading(false);
      }
    },
    [deps],
  );

  const logout = useCallback(() => {
    logoutUseCase(deps);
  }, [deps]);

  return { login, signup, logout, currentUser, isLoading, error };
}
