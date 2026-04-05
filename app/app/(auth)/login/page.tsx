import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { redirectIfAuthenticated } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams?: Promise<{ reason?: string }>;
};

function getReasonMessage(reason: string | undefined) {
  if (reason === "company-context-required") {
    return "Select your water company and sign in again to continue.";
  }

  if (reason === "role-mismatch") {
    return "Your account role does not have access to that page.";
  }

  return undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();
  const resolvedSearchParams = await searchParams;
  const initialMessage = getReasonMessage(resolvedSearchParams?.reason);

  return (
    <Card title="Sign in" description="Use your account credentials to continue.">
      <LoginForm initialMessage={initialMessage} />
    </Card>
  );
}
