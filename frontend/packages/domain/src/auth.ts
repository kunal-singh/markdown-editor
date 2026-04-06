import { z } from "zod";

export const loginCredentialsSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupCredentialsSchema = loginCredentialsSchema;

export const authUserSchema = z.object({
  access_token: z.string(),
  token_type: z.string().optional(),
  user: z.object({
    id: z.uuid(),
    email: z.email(),
    display_name: z.string(),
  }),
});

export const userReadSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  display_name: z.string(),
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
export type SignupCredentials = z.infer<typeof signupCredentialsSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type UserRead = z.infer<typeof userReadSchema>;
