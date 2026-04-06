import { Link } from "react-router-dom";
import { LoaderCircleIcon } from "lucide-react";
import {
  Button,
  Input,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
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
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>Enter your email below to login to your account</CardDescription>
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

                <Field>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="m@example.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  <FieldError errors={[errors.email]} />
                </Field>

                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <Link to="#" className="ml-auto text-sm underline-offset-4 hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <FieldError errors={[errors.password]} />
                </Field>

                <FieldGroup>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <LoaderCircleIcon className="animate-spin" /> : "Login"}
                  </Button>
                </FieldGroup>

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
