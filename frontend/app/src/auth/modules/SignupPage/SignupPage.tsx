import { Link } from "react-router-dom";
import { LoaderCircleIcon } from "lucide-react";
import {
  Button,
  Input,
  FormField,
  FormLabel,
  FormMessage,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@markdown-editor/ui";
import { useSignupPage } from "./hooks/useSignupPage";

export function SignupPage() {
  const { form, onSubmit, isLoading, error } = useSignupPage();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>Enter your email below to create your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  void handleSubmit(onSubmit)(e);
                }}
                noValidate
                className="flex flex-col gap-5"
              >
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </div>
                )}

                <FormField invalid={!!errors.email}>
                  <FormLabel htmlFor="signup-email" required>
                    Email
                  </FormLabel>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="m@example.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  <FormMessage message={errors.email?.message} />
                </FormField>

                <FormField invalid={!!errors.password}>
                  <FormLabel htmlFor="signup-password" required>
                    Password
                  </FormLabel>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <FormMessage message={errors.password?.message} />
                </FormField>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <LoaderCircleIcon className="animate-spin" /> : "Create account"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="underline-offset-4 hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
