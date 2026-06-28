import { redirect } from "next/navigation";

import { AuthForm } from "@/components/dashboard/AuthForm";
import { AuthPage } from "@/components/dashboard/AuthPage";
import { StatusMessage } from "@/components/dashboard/StatusMessage";
import { getDashboardAuthState } from "@/lib/auth";
import { loginAction } from "@/app/login/actions";
import type { AuthFormState } from "@/types/auth";

const initialState: AuthFormState = {
  status: "idle",
  message: "",
};

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const authState = await getDashboardAuthState();
  const resolvedSearchParams = await searchParams;
  const error = getSearchValue(resolvedSearchParams.error);
  const message = getSearchValue(resolvedSearchParams.message);

  if (authState.status === "authorized") {
    redirect("/patients");
  }

  return (
    <AuthPage
      eyebrow="Dermatologist web app"
      title="Sentinel Derm"
      summary="Prioritized review queue for clinic check-ins, image summaries, and case closeout."
    >
      {message === "signup-submitted" ? (
        <StatusMessage tone="success">
          Account created. A dermatologist profile must be approved before access opens.
        </StatusMessage>
      ) : null}
      {message === "signed-out" ? <StatusMessage tone="success">Signed out.</StatusMessage> : null}
      {error === "pending-profile" || authState.status === "pending-profile" ? (
        <StatusMessage tone="error">
          This account is waiting for dermatologist profile approval.
        </StatusMessage>
      ) : null}
      {error === "missing-config" || authState.status === "missing-config" ? (
        <StatusMessage tone="error">
          Dashboard Supabase configuration is missing.
        </StatusMessage>
      ) : null}
      {error === "profile-check-failed" || authState.status === "error" ? (
        <StatusMessage tone="error">Unable to verify dermatologist access.</StatusMessage>
      ) : null}
      <AuthForm
        action={loginAction}
        alternateHref="/signup"
        alternateLabel="Create account"
        buttonLabel="Log in"
        initialState={initialState}
        mode="login"
      />
    </AuthPage>
  );
}
