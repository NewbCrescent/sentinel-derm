"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AuthFormState } from "@/types/auth";

type AuthFormProps = {
  action: (previousState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  alternateHref: string;
  alternateLabel: string;
  buttonLabel: string;
  initialState: AuthFormState;
  mode: "login" | "signup";
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="button" disabled={pending} type="submit">
      {pending ? "Working" : label}
    </button>
  );
}

export function AuthForm({
  action,
  alternateHref,
  alternateLabel,
  buttonLabel,
  initialState,
  mode,
}: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <>
      <form action={formAction} className="auth-form">
        <label className="field">
          <span>Email</span>
          <input autoComplete="email" name="email" required type="email" />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "signup" ? 8 : undefined}
            name="password"
            required
            type="password"
          />
        </label>
        {state.status === "error" ? <p className="status-message error">{state.message}</p> : null}
        <SubmitButton label={buttonLabel} />
      </form>
      <p className="auth-switch">
        <Link href={alternateHref}>{alternateLabel}</Link>
      </p>
    </>
  );
}
