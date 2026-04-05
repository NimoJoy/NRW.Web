"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/lib/auth/server-actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="app-btn-secondary disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Signing out..." : "Logout"}
    </button>
  );
}

export function LogoutButton() {
  return (
    <form
      action={async () => {
        await logoutAction();
      }}
    >
      <SubmitButton />
    </form>
  );
}
