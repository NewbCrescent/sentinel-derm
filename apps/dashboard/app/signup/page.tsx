import { redirect } from "next/navigation";

import { signupAction } from "@/app/signup/actions";
import { AuthForm } from "@/components/dashboard/AuthForm";
import { AuthPage } from "@/components/dashboard/AuthPage";
import { getDashboardAuthState } from "@/lib/auth";
import type { AuthFormState } from "@/types/auth";

const initialState: AuthFormState = {
  status: "idle",
  message: "",
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const authState = await getDashboardAuthState();

  if (authState.status === "authorized") {
    redirect("/patients");
  }

  return (
    <AuthPage
      eyebrow="Account request"
      title="Create an account"
      summary="Dermatologist profile approval is required before the review queue opens."
    >
      <AuthForm
        action={signupAction}
        alternateHref="/login"
        alternateLabel="Log in"
        buttonLabel="Create account"
        initialState={initialState}
        mode="signup"
      />
    </AuthPage>
  );
}
