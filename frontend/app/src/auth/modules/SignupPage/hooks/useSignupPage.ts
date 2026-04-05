import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupCredentialsSchema, type SignupCredentials } from "@markdown-editor/domain";
import { useAuth } from "@/auth/hooks";

export interface UseSignupPageReturn {
  form: UseFormReturn<SignupCredentials>;
  onSubmit: (data: SignupCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useSignupPage(): UseSignupPageReturn {
  const { signup, isLoading, error } = useAuth();

  const form = useForm<SignupCredentials>({
    resolver: zodResolver(signupCredentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignupCredentials) => {
    await signup(data);
  };

  return { form, onSubmit, isLoading, error };
}
