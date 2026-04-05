import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginCredentialsSchema, type LoginCredentials } from "@markdown-editor/domain";
import { useAuth } from "@/auth/hooks";

export interface UseLoginPageReturn {
  form: UseFormReturn<LoginCredentials>;
  onSubmit: (data: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useLoginPage(): UseLoginPageReturn {
  const { login, isLoading, error } = useAuth();

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginCredentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginCredentials) => {
    await login(data);
  };

  return { form, onSubmit, isLoading, error };
}
