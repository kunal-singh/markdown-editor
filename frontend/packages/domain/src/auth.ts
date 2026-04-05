import { z } from "zod";

export const loginCredentialsSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Same shape as login — email + password only at signup
export const signupCredentialsSchema = loginCredentialsSchema;

export const authUserSchema = z.object({
  email: z.email(),
  access_token: z.string(),
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
export type SignupCredentials = z.infer<typeof signupCredentialsSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
