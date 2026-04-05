import type { AuthUser, LoginCredentials, SignupCredentials } from "@markdown-editor/domain";

export interface AuthDependencies {
  loginApi: (credentials: LoginCredentials) => Promise<AuthUser>;
  signupApi: (credentials: SignupCredentials) => Promise<AuthUser>;
  setCurrentUser: (user: AuthUser | null) => void;
  navigate: (path: string) => void;
}

export async function loginUseCase(
  deps: AuthDependencies,
  credentials: LoginCredentials,
): Promise<void> {
  const user = await deps.loginApi(credentials);
  deps.setCurrentUser(user);
  deps.navigate("/dashboard/pages");
}

export async function signupUseCase(
  deps: AuthDependencies,
  credentials: SignupCredentials,
): Promise<void> {
  const user = await deps.signupApi(credentials);
  deps.setCurrentUser(user);
  deps.navigate("/dashboard/pages");
}

export function logoutUseCase(deps: Pick<AuthDependencies, "setCurrentUser" | "navigate">): void {
  deps.setCurrentUser(null);
  deps.navigate("/login");
}
