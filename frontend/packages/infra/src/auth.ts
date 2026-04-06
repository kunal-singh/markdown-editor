import {
  authUserSchema,
  userReadSchema,
  type AuthUser,
  type LoginCredentials,
  type SignupCredentials,
  type UserRead,
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

export async function getUserApi(userId: string, token: string): Promise<UserRead> {
  const res = await fetch(`/api/auth/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return userReadSchema.parse(await handleResponse(res));
}
