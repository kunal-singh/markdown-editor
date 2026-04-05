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
import { useLoginPage } from "./hooks/useLoginPage";

export function LoginPage() {
  const { form, onSubmit, isLoading, error } = useLoginPage();

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
              <CardTitle>Sign in to your account</CardTitle>
              <CardDescription>Enter your email and password to sign in</CardDescription>
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
                  <FormLabel htmlFor="login-email" required>
                    Email
                  </FormLabel>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="m@example.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  <FormMessage message={errors.email?.message} />
                </FormField>

                <FormField invalid={!!errors.password}>
                  <FormLabel htmlFor="login-password" required>
                    Password
                  </FormLabel>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <FormMessage message={errors.password?.message} />
                </FormField>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <LoaderCircleIcon className="animate-spin" /> : "Sign in"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link to="/signup" className="underline-offset-4 hover:underline">
                    Sign up
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
