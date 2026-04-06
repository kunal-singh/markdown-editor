import {
  authUserSchema,
  type AuthUser,
  type LoginCredentials,
  type SignupCredentials,
} from "@markdown-editor/domain";
import { handleResponse } from "./utils";

export async function loginApi(credentials: LoginCredentials): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return authUserSchema.parse(await handleResponse(res));
}

export async function signupApi(
  credentials: SignupCredentials & { display_name: string },
): Promise<AuthUser> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return authUserSchema.parse(await handleResponse(res));
}
