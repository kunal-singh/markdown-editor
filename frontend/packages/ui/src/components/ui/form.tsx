import type * as React from "react";
import { Field } from "@base-ui/react/field";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// FormField — wraps @base-ui Field.Root; accepts react-hook-form error state
// via the `invalid` prop so aria-invalid propagates to the control inside.
// ---------------------------------------------------------------------------

interface FormFieldProps extends React.ComponentPropsWithoutRef<typeof Field.Root> {
  className?: string;
}

function FormField({ className, ...props }: FormFieldProps) {
  return (
    <Field.Root
      data-slot="form-field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// FormLabel — wraps Field.Label; required indicator via data-required attr
// ---------------------------------------------------------------------------

interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof Field.Label> {
  required?: boolean;
}

function FormLabel({ className, required, children, ...props }: FormLabelProps) {
  return (
    <Field.Label
      data-slot="form-label"
      className={cn(
        "text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-destructive">
          *
        </span>
      )}
    </Field.Label>
  );
}

// ---------------------------------------------------------------------------
// FormControl — wraps Field.Control (associates label + error with input)
// ---------------------------------------------------------------------------

function FormControl({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Field.Control>) {
  return <Field.Control data-slot="form-control" className={cn(className)} {...props} />;
}

// ---------------------------------------------------------------------------
// FormDescription — helper text below the control
// ---------------------------------------------------------------------------

function FormDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Field.Description>) {
  return (
    <Field.Description
      data-slot="form-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// FormMessage — validation error displayed below the field.
// Pass `message` explicitly (from react-hook-form's fieldState.error.message).
// ---------------------------------------------------------------------------

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string | undefined;
}

function FormMessage({ className, message, children, ...props }: FormMessageProps) {
  const body = message ?? children;
  if (!body) return null;
  return (
    <p
      role="alert"
      aria-live="polite"
      data-slot="form-message"
      className={cn("text-xs font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export { FormField, FormLabel, FormControl, FormDescription, FormMessage };
