import {
  authUserSchema,
  type AuthUser,
  type LoginCredentials,
  type SignupCredentials,
} from "@markdown-editor/domain";

async function handleResponse(res: Response): Promise<unknown> {
  if (!res.ok) {
    const body = await res.text();
    let message: string;
    try {
      message = (JSON.parse(body) as { detail?: string }).detail ?? body;
    } catch {
      message = body || `HTTP ${String(res.status)}`;
    }
    throw new Error(message);
  }
  return res.json();
}

export async function loginApi(credentials: LoginCredentials): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return authUserSchema.parse(await handleResponse(res));
}

export async function signupApi(credentials: SignupCredentials): Promise<AuthUser> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return authUserSchema.parse(await handleResponse(res));
}
