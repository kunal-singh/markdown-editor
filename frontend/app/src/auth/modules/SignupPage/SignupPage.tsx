import { useState } from "react";
import { Link } from "react-router-dom";
import { EyeIcon, EyeOffIcon, LoaderCircleIcon, FileTextIcon } from "lucide-react";
import { Button, Input, FormField, FormLabel, FormMessage } from "@markdown-editor/ui";
import { useSignupPage } from "./hooks/useSignupPage";

export function SignupPage() {
  const { form, onSubmit, isLoading, error } = useSignupPage();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <FileTextIcon className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="text-sm text-slate-500">Start writing and organizing your notes</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e);
            }}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* Server error */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Email */}
            <FormField invalid={!!errors.email}>
              <FormLabel htmlFor="signup-email" required>
                Email
              </FormLabel>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FormMessage message={errors.email?.message} />
            </FormField>

            {/* Password */}
            <FormField invalid={!!errors.password}>
              <FormLabel htmlFor="signup-password" required>
                Password
              </FormLabel>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  aria-invalid={!!errors.password}
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => {
                    setShowPassword((v) => !v);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FormMessage message={errors.password?.message} />
            </FormField>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-1 h-10 w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {isLoading ? <LoaderCircleIcon className="h-4 w-4 animate-spin" /> : "Create account"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
